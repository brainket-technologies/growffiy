import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'growffi-secret-key-fallback';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.id;
    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID missing in token' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({ where: { userId } });
    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'Monthly'; // Daily, Weekly, Monthly, Yearly, Custom
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    let where: any = { 
      clientId: client.id,
      pnl: { not: 0 } // Only include profit or loss trades
    };

    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (period === 'Daily') {
      startDate = new Date(now.setHours(0, 0, 0, 0));
      endDate = new Date(now.setHours(23, 59, 59, 999));
    } else if (period === 'Weekly') {
      const firstDay = now.getDate() - now.getDay();
      startDate = new Date(now.setDate(firstDay));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now.setDate(firstDay + 6));
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'Monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (period === 'Yearly') {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else if (period === 'Custom' && startDateParam && endDateParam) {
      startDate = new Date(startDateParam);
      endDate = new Date(endDateParam);
      endDate.setHours(23, 59, 59, 999);
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    // Fetch trades in chronological order to calculate drawdown correctly
    const trades = await prisma.trade.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    let totalPnl = 0;
    let netProfit = 0;
    let netLoss = 0;
    let winningTrades = 0;
    let losingTrades = 0;
    let breakevenTrades = 0;
    let closedTrades = 0;
    let openTrades = 0;
    let bestTrade = 0;
    let worstTrade = 0;

    let cumulativePnl = 0;
    let peakCumulative = 0;
    let maxDrawdown = 0;

    for (const trade of trades) {
      if (trade.status === 'open') {
        openTrades++;
      } else {
        closedTrades++;
      }

      const pnl = trade.pnl ? Number(trade.pnl) : 0;
      totalPnl += pnl;

      if (pnl > 0) {
        netProfit += pnl;
        winningTrades++;
        if (pnl > bestTrade) bestTrade = pnl;
      } else if (pnl < 0) {
        netLoss += pnl;
        losingTrades++;
        if (pnl < worstTrade) worstTrade = pnl;
      } else {
        breakevenTrades++;
      }

      // Drawdown calculation
      cumulativePnl += pnl;
      if (cumulativePnl > peakCumulative) {
        peakCumulative = cumulativePnl;
      }
      const currentDrawdown = peakCumulative - cumulativePnl;
      if (currentDrawdown > maxDrawdown) {
        maxDrawdown = currentDrawdown;
      }
    }

    const totalTrades = trades.length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    
    const capital = Number(client.capital) || 100000; // Fallback to 1L if 0
    const capitalPercent = (totalPnl / capital) * 100;
    const netProfitPercent = (netProfit / capital) * 100;
    const netLossPercent = (netLoss / capital) * 100;
    const maxDrawdownPercent = (maxDrawdown / capital) * 100;

    const avgProfit = winningTrades > 0 ? netProfit / winningTrades : 0;
    const avgLoss = losingTrades > 0 ? netLoss / losingTrades : 0;
    const profitFactor = netLoss !== 0 ? Math.abs(netProfit / netLoss) : (netProfit > 0 ? netProfit : 0);
    const expectancy = (winRate / 100 * avgProfit) - ((1 - winRate / 100) * Math.abs(avgLoss));
    
    // Simplified Sharpe Ratio: Using Average PnL vs Standard Deviation of PnL
    let sharpeRatio = 0;
    if (totalTrades > 1) {
      const avgTradePnl = totalPnl / totalTrades;
      let varianceSum = 0;
      for (const trade of trades) {
        const pnl = trade.pnl ? Number(trade.pnl) : 0;
        varianceSum += Math.pow(pnl - avgTradePnl, 2);
      }
      const stdDev = Math.sqrt(varianceSum / (totalTrades - 1));
      if (stdDev > 0) {
        // Assume risk-free rate is 0 for simplicity, scale to rough annualization if needed
        sharpeRatio = avgTradePnl / stdDev;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalPnl,
          netProfit,
          netLoss,
          winRate,
          totalTrades,
          winningTrades,
          capitalPercent,
          netProfitPercent,
          netLossPercent,
          closedTrades,
          openTrades,
        },
        metrics: {
          avgProfit,
          avgLoss,
          profitFactor,
          sharpeRatio,
          maxDrawdown,
          maxDrawdownPercent,
          bestTrade,
          worstTrade,
          expectancy,
          winningCount: winningTrades,
          losingCount: losingTrades,
          breakevenCount: breakevenTrades,
        }
      }
    });

  } catch (error: any) {
    console.error('Error fetching performance summary:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch performance summary' },
      { status: 500 }
    );
  }
}
