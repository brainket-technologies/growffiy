import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/database/db';

export async function GET(req: NextRequest) {
  try {
    const symbol = req.nextUrl.searchParams.get('symbol');
    const where = symbol ? { indexName: symbol } : {};

    const snapshots = await prisma.marketWatchSnapshot.findMany({
      where,
      select: { date: true, timeSlot: true },
      distinct: ['date', 'timeSlot'],
      orderBy: { date: 'desc' }
    });

    const available: Record<string, string[]> = {};
    snapshots.forEach(s => {
      if (!available[s.date]) available[s.date] = [];
      available[s.date].push(s.timeSlot);
    });

    return NextResponse.json({ success: true, data: available });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
