import { NextRequest, NextResponse } from 'next/server';
import { getMasterClient } from '../../../shared/utils/masterClient';
import { KiteClient } from '../../../shared/services/kite';
import { fetchStocksByNSEIndex } from '../../../shared/utils/marketWatchHelper';

const BATCH_SIZE = 200; // Kite max per request

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const indexName = url.searchParams.get('index') || 'NIFTY 50';

    // Step 1: Get master client credentials
    const master = await getMasterClient();
    if (!master) {
      return NextResponse.json({ success: false, error: 'Master client not configured or not logged in.' }, { status: 503 });
    }

    // Step 2: Fetch list of symbols for the selected index from NSE
    const symbols = await fetchStocksByNSEIndex(indexName);
    if (!symbols || symbols.length === 0) {
      return NextResponse.json({ success: false, error: `No symbols found for index: ${indexName}` }, { status: 404 });
    }

    // Step 3: Format instruments for Kite (e.g. "NSE:INFY")
    const instruments = symbols.map((sym: string) => `NSE:${sym}`);

    // Step 4: Fetch live quotes in batches of 200 (Kite limit)
    const allQuotes: Record<string, any> = {};
    for (let i = 0; i < instruments.length; i += BATCH_SIZE) {
      const batch = instruments.slice(i, i + BATCH_SIZE);
      try {
        const res = await KiteClient.getQuotes(master.zerodhaApiKey, master.accessToken, batch);
        if (res && res.data) {
          Object.assign(allQuotes, res.data);
        }
      } catch (batchErr: any) {
        console.error(`market-watch: Batch ${i / BATCH_SIZE + 1} quote fetch failed:`, batchErr.message);
      }
    }

    // Step 5: Format response into clean stock objects
    const stocks = Object.entries(allQuotes).map(([instrument, q]: [string, any]) => {
      const symbol = instrument.replace('NSE:', '');
      const ltp = q.last_price || 0;
      const prevClose = q.ohlc?.close || 0;
      const open = q.ohlc?.open || 0;
      const high = q.ohlc?.high || 0;
      const low = q.ohlc?.low || 0;
      const change = ltp - prevClose;
      const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

      return {
        symbol,
        name: symbol,
        ltp,
        open,
        high,
        low,
        prevClose,
        volume: q.volume || 0,
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(changePercent.toFixed(2)),
        buyQty: q.depth?.buy?.[0]?.quantity || 0,
        sellQty: q.depth?.sell?.[0]?.quantity || 0,
        avgPrice: q.average_price || 0,
        oi: q.oi || 0,
        upperCircuit: q.upper_circuit_limit || 0,
        lowerCircuit: q.lower_circuit_limit || 0,
        weekHigh52: q['52_week_high'] || q.upper_circuit_limit || 0,
        weekLow52: q['52_week_low'] || q.lower_circuit_limit || 0,
      };
    });

    // Sort by changePercent desc
    stocks.sort((a, b) => b.changePercent - a.changePercent);

    return NextResponse.json({
      success: true,
      index: indexName,
      count: stocks.length,
      stocks,
    });

  } catch (error: any) {
    console.error('market-watch API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
