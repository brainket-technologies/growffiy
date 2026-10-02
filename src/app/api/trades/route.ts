export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';



import { getCachedData } from '../../../shared/utils/redis';

export async function GET() {
  try {
    const dbTrades = await getCachedData('all_trades', async () => {
      return await prisma.trade.findMany({
        take: 1000,
        include: {
          client: { include: { user: true } },
          strategy: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }, 10);
    
    return NextResponse.json({ success: true, trades: dbTrades });
  } catch (error) {
    console.error("Trades API Error:", error);
    return NextResponse.json({ success: false, error: 'Database query failed' }, { status: 500 });
  }
}

