import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/database/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'growffi-secret-key-fallback';
export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate user
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const tokenUserId = decoded.id || decoded.userId;
    if (!tokenUserId) {
      return NextResponse.json({ success: false, error: 'Invalid token payload' }, { status: 401 });
    }

    // 2. Fetch User with Client
    const user = await prisma.user.findUnique({
      where: { id: tokenUserId },
      include: { client: true }
    });

    if (!user || !user.client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    const client = user.client;

    // 3. Get Filters
    const searchParams = req.nextUrl.searchParams;
    const period = searchParams.get('period') || 'Today'; // Today, Week, Month, Year

    let where: any = { clientId: client.id };
    
    // Time Period Filter
    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (period === 'Today') {
      startDate = new Date(now.setHours(0, 0, 0, 0));
      endDate = new Date(now.setHours(23, 59, 59, 999));
    } else if (period === 'Week') {
      const firstDay = now.getDate() - now.getDay();
      startDate = new Date(now.setDate(firstDay));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now.setDate(firstDay + 6));
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'Month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (period === 'Year') {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    // 4. Calculate Metrics via Aggregation
    const totalTrades = await prisma.trade.count({ where });
    
    const winningTrades = await prisma.trade.count({
      where: {
        ...where,
        pnl: { gt: 0 }
      }
    });

    const agg = await prisma.trade.aggregate({
      where,
      _sum: { pnl: true }
    });

    const realizedPnl = Number(agg._sum.pnl || 0);
    const winAccuracy = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        realizedPnl,
        winAccuracy: Number(winAccuracy.toFixed(2)),
        period,
      },
    });
  } catch (error: any) {
    console.error('P&L Summary API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
