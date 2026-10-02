export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';
import { KiteClient } from '../../../../shared/services/kite';
import { sendEmail } from '../../../../shared/services/mailer';
import { performKiteAutoLogin } from '../../../../shared/services/kiteAutoLogin';
import { invalidateCache } from '../../../../shared/utils/redis';
import { encryptText, decryptText } from '../../../../shared/utils/crypto';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    try {
      let client = await prisma.client.findUnique({
        where: { id },
        include: { user: true, productType: true, assignments: { include: { strategy: true } } },
      });
      if (!client) {
        return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
      }

      if (client.user && client.user.password) {
        client.user.password = ''; // Do not send encrypted or decrypted password to frontend for security
      }

      let profileData: any = null;
      let marginData: any = null;
      let marginError: string | null = null;

      // Helper function to check token profile and fetch margins
      const checkAndFetchData = async (apiKey: string, token: string) => {
        const profile = await KiteClient.getProfile(apiKey, token);
        if (profile.status === 'success' && profile.data) {
          let margins: any = null;
          try {
            const mRes = await KiteClient.getMargins(apiKey, token);
            if (mRes.status === 'success') margins = mRes.data;
            else marginError = mRes.message || 'Margins API error';
          } catch (e: any) { marginError = e.message || 'Margins request failed'; }
          return { isValid: true, profile: profile.data, margins };
        }
        return { isValid: false, profile: null, margins: null };
      };

      const clientApiKey = (client.zerodhaApiKey || '').trim();

      // 1. If we have a token and client API key, check it using the Client's own API Key
      if (client.accessToken && client.tradingStatus === 'active' && clientApiKey) {
        try {
          const check = await checkAndFetchData(clientApiKey, client.accessToken);
          if (check.isValid) {
            profileData = check.profile;
            marginData = check.margins;
          } else {
            console.warn(`Kite token verification failed for client ${client.id} using client API Key. Clearing token.`);
            await prisma.client.update({
              where: { id },
              data: { accessToken: null }
            });
            client.accessToken = null;
          }
        } catch (e) {
          console.error('Failed to verify Kite token session:', e);
        }
      }

      return NextResponse.json({ success: true, client, profile: profileData, margin: marginData, marginError, zerodhaApiKey: clientApiKey });
    } catch {
      return NextResponse.json({ success: false, error: 'Database query failed' }, { status: 500 });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { 
      name, 
      email, 
      userId, 
      password, 
      zerodhaClientId, 
      zerodhaApiKey, 
      zerodhaApiSecret, 
      zerodhaPassword,
      zerodhaTotpSecret,
      dedicatedIp,
      proxyUrl,
      capital,
      riskPercentage,
      tradingStatus,
      subscriptionStatus,
      strategyId,
      productTypeId,
      accessToken,
      panNumber,
      aadhaarNumber,
      dob,
      kycStatus
    } = body;
 
     try {
       const client = await prisma.client.findUnique({
         where: { id },
         include: { user: true }
       });
 
       if (!client) {
         return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
       }

       if (dedicatedIp !== undefined && dedicatedIp && dedicatedIp.trim()) {
         const formattedIp = dedicatedIp.trim();
         const existingClientWithIp = await prisma.client.findFirst({
           where: {
             dedicatedIp: formattedIp,
             id: { not: id }
           },
           include: { user: true }
         });
         if (existingClientWithIp) {
           return NextResponse.json({
             success: false,
             error: `Static IP address "${formattedIp}" is already assigned to client "${existingClientWithIp.user.name || existingClientWithIp.zerodhaClientId}". Each client must have a unique static IP.`
           }, { status: 400 });
         }
       }
 
       // Handle password encryption
       let finalPassword = password;
       if (password && !password.startsWith('$2b$') && !password.startsWith('aes:')) {
         finalPassword = encryptText(password);
       }

       // Update associated user account
       const userDataToUpdate: any = {
         name: name !== undefined ? name : undefined,
         email: email !== undefined ? email : undefined,
         userId: userId !== undefined ? userId : undefined,
       };
       if (finalPassword) {
         userDataToUpdate.password = finalPassword;
       }

       await prisma.user.update({
         where: { id: client.userId },
         data: userDataToUpdate
       });
 
       // Invalidate Zerodha session if we are disconnecting or changing status to inactive
       if (tradingStatus === 'inactive' || accessToken === null) {
         if (client.accessToken && client.zerodhaApiKey) {
           try {
             await KiteClient.logout(client.zerodhaApiKey, client.accessToken);
           } catch (logoutErr) {
             console.error('Failed to invalidate Zerodha token session on disconnect:', logoutErr);
           }
         }
       }
 
       // If strategyIds array is provided, sync assignments
       let targetStrategyId = strategyId;
       if (body.strategyIds !== undefined && Array.isArray(body.strategyIds)) {
         // Delete old assignments
         await prisma.strategyAssignment.deleteMany({
           where: { clientId: id }
         });
         // Create new assignments
         if (body.strategyIds.length > 0) {
           await prisma.strategyAssignment.createMany({
             data: body.strategyIds.map((sId: string) => ({
               clientId: id,
               strategyId: sId,
               status: 'active'
             }))
           });
           targetStrategyId = body.strategyIds[0];
         } else {
           targetStrategyId = null;
         }
       }

       const updatedClient = await prisma.client.update({
         where: { id },
         data: {
           zerodhaClientId: zerodhaClientId !== undefined ? zerodhaClientId : undefined,
           zerodhaApiKey: zerodhaApiKey !== undefined ? zerodhaApiKey : undefined,
           zerodhaApiSecret: zerodhaApiSecret !== undefined ? zerodhaApiSecret : undefined,
           zerodhaPassword: zerodhaPassword !== undefined ? zerodhaPassword : undefined,
           zerodhaTotpSecret: zerodhaTotpSecret !== undefined ? zerodhaTotpSecret : undefined,
           dedicatedIp: dedicatedIp !== undefined ? (dedicatedIp ? dedicatedIp.trim() : null) : undefined,
           proxyUrl: proxyUrl !== undefined ? (proxyUrl ? proxyUrl.trim() : null) : undefined,
           tradingStatus: tradingStatus !== undefined ? tradingStatus : undefined,
           subscriptionStatus: subscriptionStatus !== undefined ? subscriptionStatus : undefined,
           productTypeId: productTypeId !== undefined ? productTypeId : undefined,
           capital: capital ? Math.max(-1, Number(capital)) : undefined,
           perDayTradeAmount: body.perDayTradeAmount !== undefined ? (body.perDayTradeAmount !== null && body.perDayTradeAmount !== '' && Number(body.perDayTradeAmount) > 0 ? Number(body.perDayTradeAmount) : null) : undefined,
           accessToken: (tradingStatus === 'inactive' || accessToken === null) ? null : (accessToken !== undefined ? accessToken : undefined),
           zerodhaSession: (tradingStatus === 'inactive' || accessToken === null) ? null : undefined,
           panNumber: panNumber !== undefined ? panNumber : undefined,
           aadhaarNumber: aadhaarNumber !== undefined ? aadhaarNumber : undefined,
           dob: dob !== undefined ? dob : undefined,
           kycStatus: kycStatus !== undefined ? kycStatus : undefined,
         },
         include: { user: true, productType: true, assignments: { include: { strategy: true } } },
       });
       await invalidateCache('all_clients');
       return NextResponse.json({ success: true, client: updatedClient });
    } catch {
      return NextResponse.json({ success: false, error: 'Database update failed' }, { status: 500 });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    try {
      const client = await prisma.client.findUnique({ where: { id } });
      if (client) {
        await prisma.client.delete({ where: { id } });
        await prisma.user.delete({ where: { id: client.userId } });
        await invalidateCache('all_clients');
      }
      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json({ success: false, error: 'Failed to delete client' }, { status: 500 });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
