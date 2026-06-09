import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/db';

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
  },
];

export async function GET() {
  try {
    const dbClients = await prisma.client.findMany({
      include: { user: true },
    });
    return NextResponse.json({ success: true, clients: dbClients });
  } catch (error) {
    // Fallback to in-memory store if DB is not configured
    return NextResponse.json({ success: true, clients: inMemoryClients, isDemoMode: true });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, userId, password, zerodhaClientId, capital, riskPercentage, strategyId } = body;

    try {
      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          userId,
          password: password || 'password123', // Demo placeholder hashing
          role: 'client',
        },
      });

      const newClient = await prisma.client.create({
        data: {
          userId: newUser.id,
          zerodhaClientId,
          capital: Number(capital),
          riskPercentage: Number(riskPercentage || 1.00),
          strategyId,
          tradingStatus: 'inactive',
          subscriptionStatus: 'active',
        },
        include: { user: true },
      });

      return NextResponse.json({ success: true, client: newClient });
    } catch {
      // In-memory fallback logic
      const newClientMock = {
        id: `c_${Date.now()}`,
        user: { name, email, userId, status: 'active' },
        zerodhaClientId,
        capital: Number(capital),
        riskPercentage: Number(riskPercentage || 1.00),
        tradingStatus: 'inactive',
        subscriptionStatus: 'active',
        strategyId: strategyId || 'pre-open-breakout',
      };
      inMemoryClients.push(newClientMock);
      return NextResponse.json({ success: true, client: newClientMock, isDemoMode: true });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
export { inMemoryClients };
