import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/database/db';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const symbol = url.searchParams.get('symbol');
  const date = url.searchParams.get('date');
  const timeSlot = url.searchParams.get('timeSlot');

  if (!symbol || !date || !timeSlot) {
    return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 });
  }

  try {
    const snapshot = await prisma.marketWatchSnapshot.findUnique({
      where: {
        indexName_date_timeSlot: {
          indexName: symbol,
          date,
          timeSlot,
        }
      }
    });

    if (!snapshot) {
      return NextResponse.json({ success: false, error: 'No snapshot found for this time' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        data: snapshot.data
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
