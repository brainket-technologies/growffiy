import { NextResponse } from 'next/server';
import { prisma } from '../../../database/db';

// Simulated trades database when DB is unconfigured
let inMemoryTrades = [
  { id: 't1', clientName: 'Aman Sharma', symbol: 'TATAMOTORS', strategyName: 'Pre-Open Momentum', orderType: 'MIS', entryPrice: 638.10, exitPrice: 615.00, quantity: 43, stopLoss: 634.90, target: 647.60, pnl: -993.30, status: 'closed', entryTime: '2026-06-09T09:20:00Z', exitTime: '2026-06-09T09:45:00Z' },
  { id: 't2', clientName: 'Aman Sharma', symbol: 'ADANIPORTS', strategyName: 'Pre-Open Momentum', orderType: 'MIS', entryPrice: 810.90, exitPrice: 815.00, quantity: 24, stopLoss: 806.80, target: 823.00, pnl: 98.40, status: 'closed', entryTime: '2026-06-09T09:20:00Z', exitTime: '2026-06-09T10:12:00Z' },
  { id: 't3', clientName: 'Rahul Kumar', symbol: 'SBIN', strategyName: 'Pre-Open Momentum', orderType: 'MIS', entryPrice: 585.50, exitPrice: null, quantity: 21, stopLoss: 582.50, target: 594.20, pnl: -283.50, status: 'open', entryTime: '2026-06-09T09:20:00Z', exitTime: null },
];

export async function GET() {
  try {
    const dbTrades = await prisma.trade.findMany({
      include: {
        client: { include: { user: true } },
        strategy: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, trades: dbTrades });
  } catch (error) {
    return NextResponse.json({ success: true, trades: inMemoryTrades, isDemoMode: true });
  }
}
export { inMemoryTrades };
