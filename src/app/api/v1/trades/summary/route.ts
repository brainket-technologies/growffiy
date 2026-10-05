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
      clientId: client.id
      // Removed pnl: { not: 0 } to include break-even trades in total
    };

    // Time Period Filter
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    let prevStartDate: Date | null = null;
    let prevEndDate: Date | null = null;

    if (period === 'Daily') {
      const today = new Date();
      startDate = new Date(today.setHours(0, 0, 0, 0));
      endDate = new Date(today.setHours(23, 59, 59, 999));
      prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - 1);
      prevEndDate = new Date(endDate);
      prevEndDate.setDate(prevEndDate.getDate() - 1);
    } else if (period === 'Weekly') {
      const today = new Date();
      const firstDay = today.getDate() - today.getDay();
      startDate = new Date(today.setDate(firstDay));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(today.setDate(firstDay + 6));
      endDate.setHours(23, 59, 59, 999);
      prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - 7);
      prevEndDate = new Date(endDate);
      prevEndDate.setDate(prevEndDate.getDate() - 7);
    } else if (period === 'Monthly') {
      const today = new Date();
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
      prevStartDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      prevEndDate = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
    } else if (period === 'Yearly') {
      const today = new Date();
      startDate = new Date(today.getFullYear(), 0, 1);
      endDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
      prevStartDate = new Date(today.getFullYear() - 1, 0, 1);
      prevEndDate = new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
    } else if (period === 'Custom' && startDateParam && endDateParam) {
      startDate = new Date(startDateParam);
      endDate = new Date(endDateParam);
      endDate.setHours(23, 59, 59, 999);
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - diffDays);
      prevEndDate = new Date(startDate);
      prevEndDate.setMilliseconds(prevEndDate.getMilliseconds() - 1);
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    const totalTrades = await prisma.trade.count({ where });

    const winningTrades = await prisma.trade.count({
      where: {
        ...where,
        pnl: { gt: 0 }
      }
    });

    const losingTrades = await prisma.trade.count({
      where: {
        ...where,
        pnl: { lt: 0 }
      }
    });

    const agg = await prisma.trade.aggregate({
      where,
      _sum: { pnl: true }
    });

    const netPnl = Number(agg._sum.pnl || 0);

    const winningTradesPercent = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const losingTradesPercent = totalTrades > 0 ? (losingTrades / totalTrades) * 100 : 0;

    // Formatting netPnl
    const formattedNetPnl = `₹${netPnl.toFixed(2)}`;

    let prevTotalTrades = 0;
    let prevNetPnl = 0;

    if (prevStartDate && prevEndDate) {
      const prevWhere = {
        ...where,
        createdAt: {
          gte: prevStartDate,
          lte: prevEndDate,
        }
      };

      prevTotalTrades = await prisma.trade.count({ where: prevWhere });
      
      const prevAgg = await prisma.trade.aggregate({
        where: prevWhere,
        _sum: { pnl: true }
      });
      prevNetPnl = Number(prevAgg._sum.pnl || 0);
    }
    
    let totalTradesChange = 0.0;
    let netPnlChange = 0.0;

    if (prevStartDate && prevEndDate) {
      if (prevTotalTrades === 0) {
        totalTradesChange = totalTrades > 0 ? 100.0 : 0.0;
      } else {
        totalTradesChange = ((totalTrades - prevTotalTrades) / prevTotalTrades) * 100;
      }

      if (prevNetPnl === 0) {
        netPnlChange = netPnl > 0 ? 100.0 : (netPnl < 0 ? -100.0 : 0.0);
      } else {
        netPnlChange = ((netPnl - prevNetPnl) / Math.abs(prevNetPnl)) * 100;
      }
    }

    totalTradesChange = parseFloat(totalTradesChange.toFixed(1));
    netPnlChange = parseFloat(netPnlChange.toFixed(1));

    return NextResponse.json({
      success: true,
      data: {
        totalTrades,
        totalTradesChange,
        winningTrades,
        winningTradesPercent: parseFloat(winningTradesPercent.toFixed(1)),
        losingTrades,
        losingTradesPercent: parseFloat(losingTradesPercent.toFixed(1)),
        netPnl: formattedNetPnl,
        netPnlChange,
      },
    });

  } catch (error: any) {
    console.error('Error fetching trade summary:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
