import { NextResponse } from 'next/server';
import { algoEngine } from '../../../models/algoEngine';

export async function GET() {
  try {
    const stocks = algoEngine.getStocks();
    const isTradingActive = algoEngine.getTradingStatus();
    return NextResponse.json({ success: true, stocks, isTradingActive });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
