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
    const period = searchParams.get('period') || 'All'; // Daily, Weekly, Monthly, Yearly, Custom, All
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Build the "where" clause
    let where: any = { 
      clientId: client.id,
      pnl: { not: 0 } // Only include profit or loss trades
    };

    // Time Period Filter
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

    // Query DB for trades
    const trades = await prisma.trade.findMany({
      where,
      select: {
        pnl: true,
      },
    });

    const totalTrades = trades.length;
    let winningTrades = 0;
    let losingTrades = 0;
    let netPnl = 0;

    for (const trade of trades) {
      const pnlValue = trade.pnl ? Number(trade.pnl) : 0;
      netPnl += pnlValue;

      if (pnlValue > 0) {
        winningTrades++;
      } else if (pnlValue < 0) {
        losingTrades++;
      }
    }

    const winningTradesPercent = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const losingTradesPercent = totalTrades > 0 ? (losingTrades / totalTrades) * 100 : 0;

    // Formatting netPnl
    const formattedNetPnl = `₹${netPnl.toFixed(2)}`;

    return NextResponse.json({
      success: true,
      data: {
        totalTrades,
        totalTradesChange: 0.0, // Hardcoded for now
        winningTrades,
        winningTradesPercent: parseFloat(winningTradesPercent.toFixed(1)),
        losingTrades,
        losingTradesPercent: parseFloat(losingTradesPercent.toFixed(1)),
        netPnl: formattedNetPnl,
        netPnlChange: 0.0, // Hardcoded for now
      },
    });

  } catch (error: any) {
    console.error('Error fetching trade summary:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
