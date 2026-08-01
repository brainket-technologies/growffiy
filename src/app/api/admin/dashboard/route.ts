import { NextResponse } from 'next/server';
import { prisma } from '../../../../database/db';

export async function GET(request: Request) {
  try {

    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    const today = new Date();
    // Default to start of current month to end of current month
    const defaultStartDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const defaultEndDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    const startFilter = startDateStr ? new Date(`${startDateStr}T00:00:00.000`) : defaultStartDate;
    const endFilter = endDateStr ? new Date(`${endDateStr}T23:59:59.999`) : defaultEndDate;

    // 1. Client counts
    const totalClients = await prisma.client.count();
    const activeClients = await prisma.client.count({ where: { tradingStatus: 'active' } });
    const inactiveClients = totalClients - activeClients;

    const helperCalcPnl = (t: any) => {
      const status = (t.status || '').toLowerCase();
      if (status === 'cancelled' || status === 'failed' || status === 'rejected' || status === 'open') {
        return 0;
      }
      let val = Number(t.pnl || 0);
      if ((t.pnl === null || t.pnl === undefined || val === 0) && t.entryPrice && t.exitPrice && Number(t.quantity) > 0) {
        const isShort = (t.direction || '').toLowerCase() === 'short';
        const entry = Number(t.entryPrice);
        const exit = Number(t.exitPrice);
        const qty = Number(t.quantity);
        val = isShort ? (entry - exit) * qty : (exit - entry) * qty;
      }
      return val;
    };

    // 2. Strategy counts & performance
    const activeStrategies = await prisma.strategy.count({ where: { status: 'active' } });
    const strategies = await prisma.strategy.findMany({
      include: { 
        trades: true
      }
    });

    let winningStrategies = 0;
    let losingStrategies = 0;
    let breakevenStrategies = 0;

    strategies.forEach(strat => {
      const stratFilteredTrades = (strat.trades || []).filter(t => {
        const dStr = t.createdAt || t.entryTime;
        if (!dStr) return false;
        const d = new Date(dStr);
        return d >= startFilter && d <= endFilter;
      });
      const stratPnl = stratFilteredTrades.reduce((sum, t) => sum + helperCalcPnl(t), 0);
      if (stratPnl > 0) {
        winningStrategies++;
      } else if (stratPnl < 0) {
        losingStrategies++;
      } else {
        breakevenStrategies++;
      }
    });

    // 3. Trade metrics calculations
    const allDbTrades = await prisma.trade.findMany();

    // Date-filtered trades strictly matching startFilter and endFilter
    const filteredTrades = allDbTrades.filter(t => {
      const dStr = t.createdAt || t.entryTime;
      if (!dStr) return false;
      const d = new Date(dStr);
      return d >= startFilter && d <= endFilter;
    });

    let totalPnl = 0;
    let totalExposure = 0;
    let unrealizedPnl = 0;
    let realizedPnl = 0;
    let openPositions = 0;
    let closedTrades = 0;

    // Calculate real-time Open Positions & Exposure across all currently open trades
    allDbTrades.forEach(trade => {
      const entryPrice = Number(trade.entryPrice || 0);
      const qty = Number(trade.quantity || 0);
      const pnl = helperCalcPnl(trade);

      if ((trade.status || '').toLowerCase() === 'open') {
        openPositions++;
        totalExposure += entryPrice * qty;
        unrealizedPnl += pnl;
      }
    });

    // Calculate Total P&L and Realized P&L STRICTLY for the selected Date Filter period (including profits + losses)
    filteredTrades.forEach(trade => {
      const pnl = helperCalcPnl(trade);
      totalPnl += pnl;
      if ((trade.status || '').toLowerCase() !== 'open' && (trade.status || '').toLowerCase() !== 'cancelled' && (trade.status || '').toLowerCase() !== 'failed') {
        closedTrades++;
        realizedPnl += pnl;
      }
    });

    // 4. Historical curve strictly based on date-filtered trades
    let pnlHistoryData = [0];
    let pnlHistoryLabels = ['Start'];
    if (filteredTrades.length > 0) {
      let runningSum = 0;
      const sortedTrades = [...filteredTrades]
        .filter(t => (t.status || '').toLowerCase() !== 'open')
        .sort((a, b) => new Date(a.createdAt || a.entryTime || '').getTime() - new Date(b.createdAt || b.entryTime || '').getTime());
      
      sortedTrades.forEach((t) => {
        runningSum += helperCalcPnl(t);
        pnlHistoryData.push(runningSum);
        const date = t.createdAt || t.entryTime ? new Date(t.createdAt || t.entryTime) : new Date();
        pnlHistoryLabels.push(date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' }));
      });
    }

    if (pnlHistoryData.length <= 1) {
      pnlHistoryData = [0, 0];
      pnlHistoryLabels = ['Start', 'Today'];
    }

    const statsResult = {
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
      todayTrades: allDbTrades.length,
      pnlHistoryData,
      pnlHistoryLabels
    };

    return NextResponse.json({
      success: true,
      stats: statsResult
    });
  } catch (error: any) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch dashboard statistics'
    }, { status: 500 });
  }
}

