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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const filter = searchParams.get('filter') || 'All'; // All, Profit, Loss, Buy, Sell
    const period = searchParams.get('period') || 'Monthly'; // Daily, Weekly, Monthly, Yearly, Custom
    const searchStr = searchParams.get('search') || '';
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Pagination bounds
    const skip = (page - 1) * limit;

    const client = await prisma.client.findUnique({ where: { userId } });
    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    // Build the "where" clause
    let where: any = { 
      clientId: client.id,
      pnl: { not: 0 } // Only show profit or loss trades (+ or -)
    };
    // Symbol Search
    if (searchStr.trim() !== '') {
      where.symbol = { contains: searchStr.trim(), mode: 'insensitive' };
    }

    // Profit/Loss & Buy/Sell Filters
    const lowerFilter = filter?.toLowerCase();
    if (lowerFilter === 'profit') {
      where.pnl = { gt: 0 };
    } else if (lowerFilter === 'loss') {
      where.pnl = { lt: 0 };
    } else if (lowerFilter === 'buy') {
      where.direction = { in: ['LONG', 'BUY', 'long', 'buy'] };
    } else if (lowerFilter === 'sell') {
      where.direction = { in: ['SHORT', 'SELL', 'short', 'sell'] };
    }

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

    // Query DB
    const [trades, total] = await Promise.all([
      prisma.trade.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.trade.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        trades,
        pagination: {
          total,
          page,
          limit,
          totalPages,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching trades:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch trades' },
      { status: 500 }
    );
  }
}
