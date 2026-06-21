export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '../../../database/db';
import { sendClientWelcomeEmail } from '../../../shared/services/mail';

// In-memory fallback array to guarantee immediate functionality without live DB
let inMemoryClients: any[] = [
  {
    id: 'c1',
    user: { name: 'Aman Sharma', email: 'aman.sharma@example.com', userId: 'aman_sharma', status: 'active' },
    zerodhaClientId: 'IN30123456789012',
    accessToken: 'tok_active_aman_123',
    capital: 25000000.00,
    riskPercentage: 1.00,
    tradingStatus: 'active',
    subscriptionStatus: 'active',
    strategyId: 'pre-open-breakout',
    zerodhaTotpSecret: 'ZTOTPAMAN123',
  },
  {
    id: 'c2',
    user: { name: 'Rahul Kumar', email: 'rahul.kumar@example.com', userId: 'rahul_kumar', status: 'active' },
    zerodhaClientId: 'IN30223456789012',
    accessToken: null,
    capital: 12750000.00,
    riskPercentage: 1.00,
    tradingStatus: 'inactive',
    subscriptionStatus: 'active',
    strategyId: 'pre-open-breakout',
    zerodhaTotpSecret: 'ZTOTPRAHUL456',
  },
  {
    id: 'c3',
    user: { name: 'Neha Patel', email: 'neha.patel@example.com', userId: 'neha_patel', status: 'active' },
    zerodhaClientId: 'IN30323456789012',
    accessToken: 'tok_expired_neha',
    capital: 500000.00,
    riskPercentage: 1.00,
    tradingStatus: 'inactive',
    subscriptionStatus: 'expired',
    strategyId: 'pre-open-breakout',
    zerodhaTotpSecret: 'ZTOTPNEHA789',
  },
];

export async function GET() {
  try {
    const dbClients = await prisma.client.findMany({
      include: { user: true, strategy: true, productType: true },
    });
    
    // Only use mock/in-memory clients if the database is not configured
    const isDbConfigured = !!process.env.DATABASE_URL;
    const finalClients = isDbConfigured ? dbClients : inMemoryClients;

    return NextResponse.json({ success: true, clients: finalClients });
  } catch (error) {
    // Fallback to in-memory store if DB is not configured
    const isDbConfigured = !!process.env.DATABASE_URL;
    if (isDbConfigured) {
      return NextResponse.json({ success: false, error: 'Database query failed' }, { status: 500 });
    }
    return NextResponse.json({ success: true, clients: inMemoryClients, isDemoMode: true });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, userId, password, zerodhaClientId, zerodhaApiKey, zerodhaApiSecret, zerodhaPassword, zerodhaTotpSecret, capital, riskPercentage, strategyId, productTypeId } = body;

    // Auto-generate credentials for the client
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
          password: finalPassword, // Client logs in with this generated password
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
          capital: Number(capital),
          strategyId,
          productTypeId,
          tradingStatus: 'inactive',
          subscriptionStatus: 'pending',
        },
        include: { user: true, strategy: true, productType: true },
      });

      // Trigger welcome email notification asynchronously if mail option is turned on
      try {
        const originUrl = request.headers.get('origin') || request.headers.get('host') || 'http://localhost:3000';
        // Normalize HTTP protocol wrapper for host fallback if origin is missing
        const formattedOrigin = originUrl.startsWith('http') ? originUrl : `https://${originUrl}`;
        const loginUrl = `${formattedOrigin}/vendor/login`;
        // Non-blocking fire and forget welcome email
        sendClientWelcomeEmail({
          email: newUser.email,
          name: newUser.name,
          userId: newUser.userId,
          passwordHashOrPlain: finalPassword,
          loginUrl
        }).catch(err => console.error('Background welcome email error:', err));
      } catch (mailErr) {
        console.error('Mail dispatch setup error:', mailErr);
      }

      return NextResponse.json({
        success: true,
        client: newClient,
        generatedCredentials: {
          userId: generatedUserId,
          password: finalPassword
        }
      });
    } catch (e: any) {
      console.error('Database client creation failed:', e);
      // In-memory fallback logic
      const newClientMock = {
        id: `c_${Date.now()}`,
        user: { name, email, userId: generatedUserId, status: 'active' },
        zerodhaClientId,
        zerodhaApiKey,
        zerodhaApiSecret,
        zerodhaPassword,
        zerodhaTotpSecret,
        capital: Number(capital),
        riskPercentage: Number(riskPercentage || 1.00),
        tradingStatus: 'inactive',
        subscriptionStatus: 'pending',
        strategyId: strategyId || 'pre-open-breakout',
      };
      inMemoryClients.push(newClientMock);
      return NextResponse.json({
        success: true,
        client: newClientMock,
        isDemoMode: true,
        generatedCredentials: {
          userId: generatedUserId,
          password: finalPassword
        }
      });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
export { inMemoryClients };
