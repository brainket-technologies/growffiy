export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '../../../../database/db';
import { sendClientWelcomeEmail } from '../../../../shared/services/mail';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const staffId = searchParams.get('staffId');

  try {
    const where: any = {};
    if (staffId) where.addedByStaffId = staffId;

    const clients = await prisma.client.findMany({
      where,
      include: { user: true, strategy: true, productType: true },
    });
    return NextResponse.json({ success: true, clients });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Database query failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, userId, password, zerodhaClientId, zerodhaApiKey, zerodhaApiSecret, zerodhaPassword, zerodhaTotpSecret, capital, riskPercentage, strategyId, productTypeId, addedByStaffId } = body;

    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const generatedUserId = userId || `${cleanName}${Math.floor(100 + Math.random() * 900)}`;

    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let generatedPassword = '';
    for (let i = 0; i < 8; i++) {
      generatedPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const finalPassword = password || `grw_${generatedPassword}`;

    try {
      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          userId: generatedUserId,
          password: finalPassword,
          role: 'client',
        },
      });

      const newClient = await prisma.client.create({
        data: {
          userId: newUser.id,
          zerodhaClientId,
          zerodhaApiKey,
          zerodhaApiSecret,
          zerodhaPassword,
          zerodhaTotpSecret,
          capital: Math.max(-1, Number(capital)),
          strategyId,
          productTypeId,
          addedByStaffId,
          tradingStatus: 'inactive',
          subscriptionStatus: 'pending',
        },
        include: { user: true, strategy: true, productType: true },
      });

      try {
        const originUrl = request.headers.get('origin') || request.headers.get('host') || 'http://localhost:3000';
        const formattedOrigin = originUrl.startsWith('http') ? originUrl : `https://${originUrl}`;
        const loginUrl = `${formattedOrigin}/vendor/login`;
        sendClientWelcomeEmail({
          email: newUser.email,
          name: newUser.name,
          userId: newUser.userId,
          passwordHashOrPlain: finalPassword,
          loginUrl,
        }).catch(err => console.error('Background welcome email error:', err));
      } catch (mailErr) {
        console.error('Mail dispatch setup error:', mailErr);
      }

      return NextResponse.json({
        success: true,
        client: newClient,
        generatedCredentials: {
          userId: generatedUserId,
          password: finalPassword,
        },
      });
    } catch (e: any) {
      return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
