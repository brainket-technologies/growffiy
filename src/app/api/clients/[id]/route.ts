import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';
import { inMemoryClients } from '../route';

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
      capital, 
      riskPercentage, 
      tradingStatus,
      subscriptionStatus,
      strategyId 
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

      const updatedClient = await prisma.client.update({
        where: { id },
        data: {
          zerodhaClientId: zerodhaClientId !== undefined ? zerodhaClientId : undefined,
          zerodhaApiKey: zerodhaApiKey !== undefined ? zerodhaApiKey : undefined,
          zerodhaApiSecret: zerodhaApiSecret !== undefined ? zerodhaApiSecret : undefined,
          tradingStatus: tradingStatus !== undefined ? tradingStatus : undefined,
          subscriptionStatus: subscriptionStatus !== undefined ? subscriptionStatus : undefined,
          strategyId: strategyId !== undefined ? strategyId : undefined,
          capital: capital ? Number(capital) : undefined,
          riskPercentage: riskPercentage ? Number(riskPercentage) : undefined,
        },
        include: { user: true },
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
          tradingStatus: tradingStatus ?? current.tradingStatus,
          subscriptionStatus: subscriptionStatus ?? current.subscriptionStatus,
          strategyId: strategyId ?? current.strategyId,
          capital: capital ? Number(capital) : current.capital,
          riskPercentage: riskPercentage ? Number(riskPercentage) : current.riskPercentage,
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
