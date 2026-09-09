import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const snapshots = await prisma.historicalPreOpen.findMany({
      select: { date: true },
      distinct: ['date'],
      orderBy: { date: 'desc' }
    });

    // Extract dates and convert "DD MMM YYYY" to JS Date objects or string format
    // for easier use in frontend
    const availableDates = snapshots.map(s => s.date).filter(Boolean);

    return NextResponse.json({ success: true, data: availableDates });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
