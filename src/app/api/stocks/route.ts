import { NextRequest, NextResponse } from 'next/server';
import { algoEngine } from '../../../models/algoEngine';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';

    if (forceRefresh) {
      console.log('Force-refreshing live pre-open quotes from Zerodha Kite API...');
      await algoEngine.fetchLivePreOpenFromKite();
    }

    const stocks = algoEngine.getStocks();
    const preOpenStocks = algoEngine.getPreOpenStocks();
    const preOpenDate = algoEngine.getPreOpenDate();
    const isTradingActive = algoEngine.getTradingStatus();
    const isWsConnected = algoEngine.isWsConnected();
    return NextResponse.json({ success: true, stocks, preOpenStocks, preOpenDate, isTradingActive, isWsConnected });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
