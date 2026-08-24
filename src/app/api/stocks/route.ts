import { NextRequest, NextResponse } from 'next/server';
import { algoEngine } from '../../../shared/models/algoEngine';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    const dateParam = url.searchParams.get('date'); // e.g. "13 Jul 2026"

    if (forceRefresh && !dateParam) {
      console.log('Force-refreshing live pre-open quotes from Zerodha Kite API...');
      await algoEngine.fetchLivePreOpenFromKite();
    }

    // Call live HTTP poll updates if enabled in environment (only for current day)
    if (!dateParam) {
      await algoEngine.updateLiveQuotesFromKiteHTTP();
    }

    const stocks = algoEngine.getStocks();
    let preOpenStocks;
    let preOpenDate = algoEngine.getPreOpenDate();

    if (dateParam) {
      preOpenStocks = await algoEngine.getPreOpenStocksByDate(dateParam);
      preOpenDate = dateParam;
    } else {
      preOpenStocks = await algoEngine.getPreOpenStocks();
    }

    const isTradingActive = await algoEngine.getTradingStatus();
    const isWsConnected = algoEngine.isWsConnected();
    return NextResponse.json({ success: true, stocks, preOpenStocks, preOpenDate, isTradingActive, isWsConnected });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
