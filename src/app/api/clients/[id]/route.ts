export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '../../../../database/db';
import { inMemoryClients } from '../route';
import { KiteClient } from '../../../../shared/services/kite';
import { sendEmail } from '../../../../shared/services/mailer';
import { performKiteAutoLogin } from '../../../../shared/services/kiteAutoLogin';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    try {
      let client = await prisma.client.findUnique({
        where: { id },
        include: { user: true, strategy: true, productType: true },
      });
      if (!client) {
        return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
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

      const masterApiKeySetting = await prisma.appSettings.findUnique({ where: { settingKey: 'master_zerodha_api_key' } });
      const masterApiKey = masterApiKeySetting?.settingValue || '';

      // 1. If we have a token, check it using the Master API Key
      if (client.accessToken && client.tradingStatus === 'active' && masterApiKey) {
        try {
          const check = await checkAndFetchData(masterApiKey, client.accessToken);
          if (check.isValid) {
            profileData = check.profile;
            marginData = check.margins;
          } else {
            console.warn(`Kite token verification failed for client ${client.id} using Master Key. Clearing token.`);
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

      return NextResponse.json({ success: true, client, profile: profileData, margin: marginData, marginError, masterZerodhaApiKey: masterApiKey });
    } catch {
      let client = inMemoryClients.find((c) => c.id === id);
      if (client) {
        // Fallback checks for demo mode
        return NextResponse.json({ success: true, client, isDemoMode: true });
      }
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
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
 
       // Update associated user account
       await prisma.user.update({
         where: { id: client.userId },
         data: {
           name: name !== undefined ? name : undefined,
           email: email !== undefined ? email : undefined,
           userId: userId !== undefined ? userId : undefined,
           password: password !== undefined ? password : undefined,
         }
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
 
       const updatedClient = await prisma.client.update({
         where: { id },
         data: {
           zerodhaClientId: zerodhaClientId !== undefined ? zerodhaClientId : undefined,
           zerodhaApiKey: zerodhaApiKey !== undefined ? zerodhaApiKey : undefined,
           zerodhaApiSecret: zerodhaApiSecret !== undefined ? zerodhaApiSecret : undefined,
           zerodhaPassword: zerodhaPassword !== undefined ? zerodhaPassword : undefined,
           zerodhaTotpSecret: zerodhaTotpSecret !== undefined ? zerodhaTotpSecret : undefined,
           tradingStatus: tradingStatus !== undefined ? tradingStatus : undefined,
           subscriptionStatus: subscriptionStatus !== undefined ? subscriptionStatus : undefined,
           strategyId: strategyId !== undefined ? strategyId : undefined,
           productTypeId: productTypeId !== undefined ? productTypeId : undefined,
             capital: capital ? Math.max(-1, Number(capital)) : undefined,
            accessToken: (tradingStatus === 'inactive' || accessToken === null) ? null : (accessToken !== undefined ? accessToken : undefined),
           zerodhaSession: (tradingStatus === 'inactive' || accessToken === null) ? null : undefined,
           panNumber: panNumber !== undefined ? panNumber : undefined,
           aadhaarNumber: aadhaarNumber !== undefined ? aadhaarNumber : undefined,
           dob: dob !== undefined ? dob : undefined,
           kycStatus: kycStatus !== undefined ? kycStatus : undefined,
         },
         include: { user: true, strategy: true, productType: true },
       });
       return NextResponse.json({ success: true, client: updatedClient });
     } catch {
       // Fallback update in-memory
       const clientIndex = inMemoryClients.findIndex((c) => c.id === id);
       if (clientIndex !== -1) {
         const current = inMemoryClients[clientIndex];
         inMemoryClients[clientIndex] = {
           ...current,
           user: {
             ...current.user,
             name: name ?? current.user.name,
             email: email ?? current.user.email,
             userId: userId ?? current.user.userId,
             password: password ?? current.user.password,
           },
           zerodhaClientId: zerodhaClientId !== undefined ? zerodhaClientId : current.zerodhaClientId,
           zerodhaApiKey: zerodhaApiKey !== undefined ? zerodhaApiKey : current.zerodhaApiKey,
           zerodhaApiSecret: zerodhaApiSecret !== undefined ? zerodhaApiSecret : current.zerodhaApiSecret,
           zerodhaPassword: zerodhaPassword !== undefined ? zerodhaPassword : current.zerodhaPassword,
           zerodhaTotpSecret: zerodhaTotpSecret !== undefined ? zerodhaTotpSecret : current.zerodhaTotpSecret,
           tradingStatus: tradingStatus ?? current.tradingStatus,
           subscriptionStatus: subscriptionStatus ?? current.subscriptionStatus,
           strategyId: strategyId ?? current.strategyId,
            capital: capital ? Math.max(-1, Number(capital)) : current.capital,
           riskPercentage: riskPercentage ? Number(riskPercentage) : current.riskPercentage,
           accessToken: (tradingStatus === 'inactive' || accessToken === null) ? null : (accessToken !== undefined ? accessToken : current.accessToken),
           zerodhaSession: (tradingStatus === 'inactive' || accessToken === null) ? null : current.zerodhaSession,
           panNumber: panNumber !== undefined ? panNumber : current.panNumber,
           aadhaarNumber: aadhaarNumber !== undefined ? aadhaarNumber : current.aadhaarNumber,
           dob: dob !== undefined ? dob : current.dob,
           kycStatus: kycStatus !== undefined ? kycStatus : current.kycStatus,
         };
         return NextResponse.json({ success: true, client: inMemoryClients[clientIndex], isDemoMode: true });
       }
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
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
      }
      return NextResponse.json({ success: true });
    } catch {
      const index = inMemoryClients.findIndex((c) => c.id === id);
      if (index !== -1) {
        inMemoryClients.splice(index, 1);
        return NextResponse.json({ success: true, isDemoMode: true });
      }
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
