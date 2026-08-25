import { NextResponse } from 'next/server';
import { NSE_INDICES_CATEGORIES } from '../../../../shared/utils/marketWatchHelper';

export async function GET() {
  return NextResponse.json({
    success: true,
    categories: NSE_INDICES_CATEGORIES,
  });
}
