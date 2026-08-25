import { NextRequest, NextResponse } from 'next/server';
import { algoEngine } from '../../../shared/models/algoEngine';
import { StockQuote } from '../../../shared/utils/preOpenFetcher';

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

    const categoryParam = url.searchParams.get('category'); // e.g. "NIFTY BANK"

    const stocks = algoEngine.getStocks();
    let preOpenStocks: StockQuote[];
    let preOpenDate = algoEngine.getPreOpenDate();

    if (dateParam) {
      preOpenStocks = await algoEngine.getPreOpenStocksByDate(dateParam);
      preOpenDate = dateParam;
    } else {
      preOpenStocks = await algoEngine.getPreOpenStocks();
    }

    if (categoryParam && categoryParam !== 'All' && categoryParam !== 'F&O' && categoryParam !== 'SME') {
      const { fetchStocksByNSEIndex } = require('../../../shared/utils/marketWatchHelper');
      const symbolsFilter = await fetchStocksByNSEIndex(categoryParam);
      if (symbolsFilter && symbolsFilter.length > 0) {
        preOpenStocks = preOpenStocks.filter(s => symbolsFilter.includes(s.symbol));
      } else {
        preOpenStocks = [];
      }
    }

    const isTradingActive = await algoEngine.getTradingStatus();
    const isWsConnected = algoEngine.isWsConnected();
    return NextResponse.json({ success: true, stocks, preOpenStocks, preOpenDate, isTradingActive, isWsConnected });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
