import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/db';
import { inMemoryClients } from '../clients/route';
import { inMemoryTrades } from '../trades/route';

export async function GET() {
  try {
    // Attempt aggregates from DB
    const totalClients = await prisma.client.count();
    const activeClients = await prisma.client.count({ where: { tradingStatus: 'active' } });
    const inactiveClients = totalClients - activeClients;

    const openTrades = await prisma.trade.count({ where: { status: 'open' } });
    const closedTrades = await prisma.trade.count({ where: { status: 'closed' } });
    
    const dbPnl = await prisma.trade.aggregate({
      _sum: { pnl: true }
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalClients,
        activeClients,
        inactiveClients,
        todayTrades: openTrades + closedTrades,
        openTrades,
        closedTrades,
        totalPnl: Number(dbPnl._sum.pnl || 0),
        activeSubscriptions: activeClients,
        paymentCollection: activeClients * 9999, // dummy calculations
      }
    });
  } catch {
    // Mock Fallback
    const totalClients = inMemoryClients.length;
    const activeClients = inMemoryClients.filter(c => c.tradingStatus === 'active').length;
    const inactiveClients = totalClients - activeClients;
    const openTrades = inMemoryTrades.filter(t => t.status === 'open').length;
    const closedTrades = inMemoryTrades.filter(t => t.status === 'closed').length;
    const totalPnl = inMemoryTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);

    return NextResponse.json({
      success: true,
      stats: {
        totalClients,
        activeClients,
        inactiveClients,
        todayTrades: openTrades + closedTrades,
        openTrades,
        closedTrades,
        totalPnl,
        activeSubscriptions: activeClients,
        paymentCollection: activeClients * 4999, // Monthly Plan pricing reference
      }
    });
  }
}
