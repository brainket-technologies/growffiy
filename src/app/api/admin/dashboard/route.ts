import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';

export async function GET() {
  try {
    // 1. Client counts
    const totalClients = await prisma.client.count();
    const activeClients = await prisma.client.count({ where: { tradingStatus: 'active' } });
    const inactiveClients = totalClients - activeClients;

    // 2. Strategy counts & performance
    const activeStrategies = await prisma.strategy.count({ where: { status: 'active' } });
    const strategies = await prisma.strategy.findMany({
      include: { trades: true }
    });

    let winningStrategies = 0;
    let losingStrategies = 0;
    let breakevenStrategies = 0;

    strategies.forEach(strat => {
      const stratPnl = strat.trades.reduce((sum, t) => sum + Number(t.pnl || 0), 0);
      if (stratPnl > 0) {
        winningStrategies++;
      } else if (stratPnl < 0) {
        losingStrategies++;
      } else {
        breakevenStrategies++;
      }
    });

    // 3. Trade metrics calculations
    const allTrades = await prisma.trade.findMany();
    
    let totalPnl = 0;
    let totalExposure = 0;
    let unrealizedPnl = 0;
    let realizedPnl = 0;
    let openPositions = 0;
    let closedTrades = 0;

    allTrades.forEach(trade => {
      const entryPrice = Number(trade.entryPrice || 0);
      const qty = trade.quantity;
      const pnl = Number(trade.pnl || 0);

      totalPnl += pnl;

      if (trade.status.toLowerCase() === 'open') {
        openPositions++;
        totalExposure += entryPrice * qty;
      } else {
        closedTrades++;
        realizedPnl += pnl;
      }
    });

    // 4. Historical curve based on real trades
    let pnlHistoryData = [0];
    let pnlHistoryLabels = ['Start'];
    if (allTrades.length > 0) {
      let runningSum = 0;
      const sortedTrades = [...allTrades]
        .filter(t => t.status.toLowerCase() !== 'open')
        .sort((a, b) => new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime());
      
      sortedTrades.forEach((t) => {
        runningSum += Number(t.pnl || 0);
        pnlHistoryData.push(runningSum);
        const date = t.createdAt ? new Date(t.createdAt) : new Date();
        pnlHistoryLabels.push(date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' }));
      });
    }

    if (pnlHistoryData.length <= 1) {
      pnlHistoryData = [0, 0];
      pnlHistoryLabels = ['Start', 'Today'];
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalClients,
        activeClients,
        inactiveClients,
        activeStrategies,
        winningStrategies,
        losingStrategies,
        breakevenStrategies,
        totalPnl,
        totalExposure,
        unrealizedPnl,
        realizedPnl,
        openTrades: openPositions,
        closedTrades,
        todayTrades: allTrades.length,
        pnlHistoryData,
        pnlHistoryLabels
      }
    });
  } catch (error: any) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch dashboard statistics'
    }, { status: 500 });
  }
}
