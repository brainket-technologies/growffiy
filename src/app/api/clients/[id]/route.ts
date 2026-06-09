import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';
import { inMemoryClients } from '../route';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { tradingStatus, subscriptionStatus, strategyId, capital, riskPercentage } = body;

    try {
      const updatedClient = await prisma.client.update({
        where: { id },
        data: {
          tradingStatus,
          subscriptionStatus,
          strategyId,
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
        inMemoryClients[clientIndex] = {
          ...inMemoryClients[clientIndex],
          tradingStatus: tradingStatus ?? inMemoryClients[clientIndex].tradingStatus,
          subscriptionStatus: subscriptionStatus ?? inMemoryClients[clientIndex].subscriptionStatus,
          strategyId: strategyId ?? inMemoryClients[clientIndex].strategyId,
          capital: capital ? Number(capital) : inMemoryClients[clientIndex].capital,
          riskPercentage: riskPercentage ? Number(riskPercentage) : inMemoryClients[clientIndex].riskPercentage,
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
