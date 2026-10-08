import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';
import { getCachedData } from '../../../../shared/utils/redis';

import { KiteClient } from '../../../../shared/services/kite';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    const cacheKey = `admin_dashboard:${startDateStr || 'default'}:${endDateStr || 'default'}`;

    const result = await getCachedData(cacheKey, async () => {

    const today = new Date();
    // Default to start of current month to end of current month
    const defaultStartDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const defaultEndDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    const startFilter = startDateStr ? new Date(`${startDateStr}T00:00:00.000`) : defaultStartDate;
    const endFilter = endDateStr ? new Date(`${endDateStr}T23:59:59.999`) : defaultEndDate;

    // 1. Client & Subscription counts
    const allClientsData = await prisma.client.findMany({
      select: {
        tradingStatus: true,
        subscriptionStatus: true,
        capital: true,
        perDayTradeAmount: true,
        accessToken: true,
        zerodhaApiKey: true,
        zerodhaClientId: true
      }
    });

    const totalClients = allClientsData.length;
    const activeClients = allClientsData.filter(c => c.tradingStatus === 'active').length;
    const inactiveClients = totalClients - activeClients;
    const activeSubscriptions = allClientsData.filter(c => c.subscriptionStatus === 'active' || c.tradingStatus === 'active').length;
    
    // Fetch live margins
    let totalDemate = 0;
    await Promise.all(allClientsData.map(async (c) => {
      let margin = 0;
      if (c.accessToken && c.zerodhaApiKey) {
        try {
          const marginRes = await KiteClient.getMargins(c.zerodhaApiKey, c.accessToken);
          if (marginRes && marginRes.status === 'success' && marginRes.data?.equity?.net !== undefined) {
            margin = Number(marginRes.data.equity.net);
          }
        } catch (err) {
          // ignore
        }
      }
      totalDemate += margin;
    }));

    const totalPerDayAmount = allClientsData.reduce((acc, c) => acc + (Number(c.perDayTradeAmount) || 0), 0);

    const helperCalcPnl = (t: any) => {
      let val = Number(t.pnl || 0);
      if (val !== 0) return val;

      const status = (t.status || '').toLowerCase();
      if (status === 'cancelled' || status === 'failed' || status === 'rejected' || status === 'open') {
        return 0;
      }
      
      if ((t.pnl === null || t.pnl === undefined || val === 0) && t.entryPrice && t.exitPrice) {
        const isShort = (t.direction || '').toLowerCase() === 'short';
        const entry = Number(t.entryPrice);
        const exit = Number(t.exitPrice);
        const qty = Number(t.filledQuantity || t.quantity || 1);
        val = isShort ? (entry - exit) * qty : (exit - entry) * qty;
      }
      return val;
    };

    // 2. Strategy counts & performance
    const activeStrategies = await prisma.strategy.count({ where: { status: 'active' } });
    const strategies = await prisma.strategy.findMany({
      include: { 
        trades: {
          where: {
            createdAt: {
              gte: startFilter,
              lte: endFilter
            }
          }
        }
      }
    });

    let winningStrategies = 0;
    let losingStrategies = 0;
    let breakevenStrategies = 0;

    strategies.forEach(strat => {
      const stratPnl = strat.trades.reduce((sum, t) => sum + helperCalcPnl(t), 0);
      if (stratPnl > 0) {
        winningStrategies++;
      } else if (stratPnl < 0) {
        losingStrategies++;
      } else {
        breakevenStrategies++;
      }
    });

    // 3. Trade metrics calculations
    const filteredTrades = await prisma.trade.findMany({
      where: {
        createdAt: {
          gte: startFilter,
          lte: endFilter
        }
      },
      include: {
        client: {
          include: {
            user: true
          }
        },
        strategy: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const sanitizedTrades = filteredTrades.map(t => ({
      ...t,
      clientName: t.client?.user?.name || (t.clientId ? `Client #${t.clientId.slice(-4)}` : 'Client'),
      clientCode: t.clientId ? `CLI-${t.clientId.slice(-4).toUpperCase()}` : undefined,
      strategyName: t.strategy?.name || t.symbol
    }));

    let totalPnl = 0;
    let totalExposure = 0;
    let unrealizedPnl = 0;
    let realizedPnl = 0;
    let openPositions = 0;
    let closedTrades = 0;

    // Calculate real-time Open Positions & Exposure across all currently open trades
    const openDbTrades = await prisma.trade.findMany({
      where: { status: 'open' }
    });

    openDbTrades.forEach(trade => {
      const entryPrice = Number(trade.entryPrice || 0);
      const qty = Number(trade.quantity || 0);
      const pnl = helperCalcPnl(trade);

      openPositions++;
      totalExposure += entryPrice * qty;
      unrealizedPnl += pnl;
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

    // Count today's trades
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayTrades = await prisma.trade.count({
      where: { createdAt: { gte: startOfToday } }
    });

    const statsResult = {
      totalClients,
      activeClients,
      inactiveClients,
      activeSubscriptions,
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
      todayTrades,
      pnlHistoryData,
      pnlHistoryLabels,
      totalDemate,
      totalPerDayAmount
    };

      return { stats: statsResult, trades: sanitizedTrades };
    }, 10); // 10s TTL — dashboard has live-ish data

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch dashboard statistics'
    }, { status: 500 });
  }
}

