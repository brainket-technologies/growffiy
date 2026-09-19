import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/database/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'growffi-secret-key-fallback';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const tokenUserId = decoded.id || decoded.userId;
    if (!tokenUserId) {
      return NextResponse.json({ success: false, error: 'Invalid token payload' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: tokenUserId },
      include: { client: true }
    });

    if (!user || !user.client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    const period = req.nextUrl.searchParams.get('period') || 'Weekly';
    const client = user.client;

    const allTrades = await prisma.trade.findMany({
      where: { clientId: client.id },
      select: { pnl: true, createdAt: true },
    });

    let dataPoints: any[] = [];
    const now = new Date();

    if (period === 'Weekly') {
      // Last 7 days including today
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const startOfDay = new Date(d);
        startOfDay.setHours(0,0,0,0);
        const endOfDay = new Date(d);
        endOfDay.setHours(23,59,59,999);

        // Sat and Sun logic (marketClosed)
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;

        let dayPnl = 0;
        let tradeCount = 0;
        allTrades.forEach(t => {
          if (t.createdAt >= startOfDay && t.createdAt <= endOfDay) {
            dayPnl += Number(t.pnl) || 0;
            tradeCount++;
          }
        });

        let state = "noTrade";
        if (tradeCount > 0) {
          state = dayPnl >= 0 ? "profit" : "loss";
        } else if (isWeekend) {
          state = "marketClosed";
        }

        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const label = `${days[d.getDay()]} ${d.getDate()}`;
        
        dataPoints.push({ label, value: dayPnl, state });
      }
    } else if (period === 'Monthly') {
      // Current year months
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const currentYear = now.getFullYear();

      for (let i = 0; i <= now.getMonth(); i++) {
        let monthPnl = 0;
        let tradeCount = 0;
        allTrades.forEach(t => {
          if (t.createdAt.getFullYear() === currentYear && t.createdAt.getMonth() === i) {
            monthPnl += Number(t.pnl) || 0;
            tradeCount++;
          }
        });

        let state = "noTrade";
        if (tradeCount > 0) {
          state = monthPnl >= 0 ? "profit" : "loss";
        }

        dataPoints.push({ label: months[i], value: monthPnl, state });
      }
    } else if (period === 'Yearly') {
      // Last 3 years
      const currentYear = now.getFullYear();
      for (let y = currentYear - 2; y <= currentYear; y++) {
        let yearPnl = 0;
        let tradeCount = 0;
        allTrades.forEach(t => {
          if (t.createdAt.getFullYear() === y) {
            yearPnl += Number(t.pnl) || 0;
            tradeCount++;
          }
        });

        let state = "noTrade";
        if (tradeCount > 0) {
          state = yearPnl >= 0 ? "profit" : "loss";
        }

        dataPoints.push({ label: y.toString(), value: yearPnl, state });
      }
    } else {
      return NextResponse.json({ success: false, error: 'Invalid period' }, { status: 400 });
    }

    const formatDate = (d: Date) => {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    };

    let dateRange = "";
    if (period === 'Weekly') {
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      dateRange = `${formatDate(start)} - ${formatDate(now)}`;
    } else if (period === 'Monthly') {
      const start = new Date(now.getFullYear(), 0, 1);
      dateRange = `${formatDate(start)} - ${formatDate(now)}`;
    } else if (period === 'Yearly') {
      const start = new Date(now.getFullYear() - 2, 0, 1);
      dateRange = `${formatDate(start)} - ${formatDate(now)}`;
    }

    return NextResponse.json({
      success: true,
      data: {
        dateRange,
        data: dataPoints
      }
    });

  } catch (error: any) {
    console.error('P&L Overview API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
