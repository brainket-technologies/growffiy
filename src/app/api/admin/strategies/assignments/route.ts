import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/db';
import { inMemoryClients } from '../../../clients/route';

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      include: {
        user: true,
        strategy: true
      }
    });

    const mappedClients = clients.map(client => ({
      id: client.id,
      name: client.user.name,
      broker: client.zerodhaClientId ? 'Zerodha' : 'Not Connected',
      clientId: client.zerodhaClientId || 'N/A',
      segment: client.strategy?.configJson ? JSON.parse(client.strategy.configJson)?.basicInfo?.segment || 'N/A' : 'N/A',
      capital: Number(client.capital),
      status: client.user.status, // user active status
      strategyStatus: client.tradingStatus, // 'active' or 'inactive'
      strategyId: client.strategyId,
      strategyName: client.strategy?.name || 'No Strategy Assigned'
    }));

    return NextResponse.json({ success: true, clients: mappedClients });
  } catch (error) {
    // Fallback in-memory map
    const mappedClients = inMemoryClients.map((client: any) => ({
      id: client.id,
      name: client.user.name,
      broker: client.zerodhaClientId ? 'Zerodha' : 'Not Connected',
      clientId: client.zerodhaClientId || 'N/A',
      segment: 'NSE F&O',
      capital: Number(client.capital),
      status: client.user.status || 'active',
      strategyStatus: client.tradingStatus || 'inactive',
      strategyId: client.strategyId,
      strategyName: client.strategyId === 'pre-open-breakout' ? 'Pre-Open Momentum Breakout Strategy' : 'No Strategy Assigned'
    }));

    return NextResponse.json({ success: true, clients: mappedClients, isDemoMode: true });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { strategyId, clientIds, action } = body; // action can be 'assign' or 'remove'

    if (!clientIds || !Array.isArray(clientIds)) {
      return NextResponse.json({ success: false, error: 'clientIds must be an array' }, { status: 400 });
    }

    const targetStrategyId = action === 'remove' ? null : strategyId;

    try {
      // Perform database updates
      await prisma.$transaction(
        clientIds.map((clientId) =>
          prisma.client.update({
            where: { id: clientId },
            data: { strategyId: targetStrategyId }
          })
        )
      );

      // Create assignments log records
      if (action !== 'remove' && targetStrategyId) {
        for (const cId of clientIds) {
          try {
            await prisma.strategyAssignment.create({
              data: {
                clientId: cId,
                strategyId: targetStrategyId,
                status: 'active'
              }
            });
            await prisma.strategyLog.create({
              data: {
                strategyId: targetStrategyId,
                message: `Client ${cId} assigned to strategy.`,
                logType: 'info'
              }
            });
          } catch (e) {}
        }
      }

      // Log to admin audit log
      try {
        const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
        if (admin) {
          await prisma.auditLog.create({
            data: {
              adminId: admin.id,
              action: action === 'remove' ? 'REMOVE_STRATEGY_ASSIGNMENT' : 'ASSIGN_STRATEGY',
              newValue: `${action === 'remove' ? 'Removed assignment' : 'Assigned strategy'} for ${clientIds.length} client(s).`
            }
          });
        }
      } catch (auditErr) {}

      return NextResponse.json({ success: true });
    } catch (dbErr) {
      console.error('DB Assignment failed, updating in-memory:', dbErr);
      clientIds.forEach((cId) => {
        const index = inMemoryClients.findIndex((c) => c.id === cId);
        if (index !== -1) {
          inMemoryClients[index].strategyId = targetStrategyId;
        }
      });
      return NextResponse.json({ success: true, isDemoMode: true });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
