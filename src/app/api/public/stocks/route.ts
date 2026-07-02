import { NextResponse } from 'next/server';

const SYMBOLS = [
  { symbol: 'RELIANCE',   yahoo: 'RELIANCE.NS',  name: 'Reliance Industries' },
  { symbol: 'TCS',        yahoo: 'TCS.NS',        name: 'Tata Consultancy' },
  { symbol: 'INFY',       yahoo: 'INFY.NS',       name: 'Infosys Ltd.' },
  { symbol: 'TATAMOTORS', yahoo: 'TATAMOTORS.NS', name: 'Tata Motors' },
  { symbol: 'HDFCBANK',   yahoo: 'HDFCBANK.NS',   name: 'HDFC Bank' },
  { symbol: 'ICICIBANK',  yahoo: 'ICICIBANK.NS',  name: 'ICICI Bank' },
  { symbol: 'NIFTY50',    yahoo: '^NSEI',         name: 'Nifty 50' },
  { symbol: 'SENSEX',     yahoo: '^BSESN',        name: 'Sensex' },
];

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/125.0 Safari/537.36';

// In-memory crumb cache (per server process)
let _crumb = '';
let _cookie = '';
let _crumbAt = 0;

async function refreshCrumb() {
  try {
    // 1. Get cookies
    const init = await fetch('https://fc.yahoo.com', {
      headers: { 'User-Agent': UA },
      redirect: 'follow',
    });
    const raw = init.headers.get('set-cookie') || '';
    _cookie = raw.split(',').map((c: string) => c.split(';')[0].trim()).filter(Boolean).join('; ');

    // 2. Get crumb
    const cr = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
      headers: { 'User-Agent': UA, Cookie: _cookie },
    });
    const crumbText = await cr.text();
    if (crumbText && crumbText.length > 2 && !crumbText.includes('<')) {
      _crumb = crumbText.trim();
      _crumbAt = Date.now();
      return true;
    }
  } catch { /* ignore */ }
  return false;
}

async function fetchQuotes(symbols: string[]): Promise<any[]> {
  const joined = symbols.join(',');

  // Need fresh crumb?
  if (!_crumb || Date.now() - _crumbAt > 20 * 60 * 1000) {
    await refreshCrumb();
  }

  if (_crumb) {
    try {
      const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(joined)}&crumb=${encodeURIComponent(_crumb)}`;
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, Cookie: _cookie },
      });
      if (res.ok) {
        const data = await res.json();
        const results = data?.quoteResponse?.result || [];
        if (results.length > 0) return results;
      }
      // crumb may have expired — reset
      _crumb = '';
    } catch { _crumb = ''; }
  }

  // Fallback: batch chart requests in parallel (up to 6 concurrent)
  const batchFetch = async (s: typeof SYMBOLS[0]) => {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(s.yahoo)}?interval=1m&range=1d`;
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!r.ok) return null;
      const d = await r.json();
      const meta = d?.chart?.result?.[0]?.meta;
      if (!meta?.regularMarketPrice) return null;
      const prev = meta.previousClose || meta.chartPreviousClose || meta.regularMarketPrice;
      return {
        symbol: s.yahoo,
        regularMarketPrice: meta.regularMarketPrice,
        regularMarketChangePercent: prev ? ((meta.regularMarketPrice - prev) / prev) * 100 : 0,
        regularMarketChange: meta.regularMarketPrice - prev,
        regularMarketDayHigh: meta.regularMarketDayHigh,
        regularMarketDayLow: meta.regularMarketDayLow,
        regularMarketVolume: meta.regularMarketVolume,
      };
    } catch { return null; }
  };

  const results = await Promise.allSettled(SYMBOLS.map(batchFetch));
  return results
    .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value !== null)
    .map(r => r.value);
}

export async function GET() {
  try {
    const yahooSymbols = SYMBOLS.map(s => s.yahoo);
    const results = await fetchQuotes(yahooSymbols);

    const stocks = SYMBOLS.map(s => {
      const q = results.find((r: any) => r.symbol === s.yahoo);
      if (!q?.regularMarketPrice) return null;
      const vol = q.regularMarketVolume;
      return {
        symbol: s.symbol,
        name:   s.name,
        ltp:    parseFloat((q.regularMarketPrice).toFixed(2)),
        change: parseFloat((q.regularMarketChangePercent ?? 0).toFixed(2)),
        chgAmt: parseFloat((q.regularMarketChange ?? 0).toFixed(2)),
        high:   parseFloat((q.regularMarketDayHigh ?? 0).toFixed(2)),
        low:    parseFloat((q.regularMarketDayLow ?? 0).toFixed(2)),
        volume: vol
          ? vol > 1_000_000 ? `${(vol / 1_000_000).toFixed(1)}M`
            : vol > 1_000 ? `${(vol / 1_000).toFixed(0)}K`
            : String(vol)
          : '-',
      };
    }).filter(Boolean);

    if (stocks.length === 0) {
      return NextResponse.json({ success: false, error: 'No data available' }, { status: 502 });
    }

    return NextResponse.json({ success: true, stocks }, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
