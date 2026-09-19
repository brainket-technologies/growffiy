import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/database/db';
import jwt from 'jsonwebtoken';
import { KiteClient } from '@/shared/services/kite';

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

    const client = user.client;

    const allTrades = await prisma.trade.findMany({
      where: { clientId: client.id },
      select: { pnl: true, createdAt: true },
    });

    let totalPnl = 0;
    let todayPnl = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    allTrades.forEach((trade) => {
      const pnlValue = Number(trade.pnl) || 0;
      totalPnl += pnlValue;
      
      if (trade.createdAt >= today) {
        todayPnl += pnlValue;
      }
    });

    const isPnlPositive = totalPnl >= 0;
    
    let pnlSubtext = todayPnl > 0 ? "Positive Today" : (todayPnl < 0 ? "Negative Today" : "No Trades Today");

    let liveMargin: number | null = null;
    if (client.accessToken && client.zerodhaApiKey) {
      try {
        const mRes = await KiteClient.getMargins(client.zerodhaApiKey, client.accessToken);
        if (mRes.status === 'success' && mRes.data?.equity) {
          const eq = mRes.data.equity;
          liveMargin = eq.net ?? eq.available?.live_balance ?? eq.available?.cash ?? null;
        }
      } catch (err) {
        // Ignore margin fetch error
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        totalPnl,
        isPnlPositive,
        pnlSubtext,
        liveBalance: liveMargin,
      },
    });
  } catch (error: any) {
    console.error('Metrics API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

