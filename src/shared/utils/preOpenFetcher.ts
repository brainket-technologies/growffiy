import { API_ENDPOINTS } from '../../core/constants';
import { KiteClient } from '../services/kite';

export interface StockQuote {
  symbol: string;
  name: string;
  ltp: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  volume: number;
  change: number;
  changePercent: number;
  iep: number;
  final: number;
  finalQuantity: number;
  value: number;
  ffmCap: number;
  nm52wH: number;
  nm52wL: number;
  isNifty50?: boolean;
  isNifty500?: boolean;
  isBankNifty?: boolean;
  isFo?: boolean;
  isSme?: boolean;
}

// Global module-level cache for Pre-Open stocks
let preOpenCache: StockQuote[] = [];
let lastPreOpenFetchTime: number = 0;
let preOpenCacheDate: string = '';

const CACHE_EXPIRY_MS = 2 * 60 * 1000; // 2 minutes cache validity

/**
 * Fetch live Pre-Open stock list directly from the NSE website.
 */
export async function fetchLivePreOpenFromNSE(): Promise<StockQuote[]> {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': API_ENDPOINTS.NSE_REFERER,
  };

  try {
    console.log('Initiating pre-open fetch from official NSE India API...');
    const cookieFetchUrl = 'https://www.nseindia.com/';
    const initialRes = await fetch(cookieFetchUrl, { headers });
    const cookiesRaw = initialRes.headers.get('set-cookie');
    
    let cookieStr = '';
    if (cookiesRaw) {
      cookieStr = cookiesRaw.split(',').map(cookie => cookie.split(';')[0].trim()).join('; ');
    }

    const requestHeaders = {
      ...headers,
      'Cookie': cookieStr || '',
    };

    const apiUrl = API_ENDPOINTS.NSE_PRE_OPEN;
    console.log(`Requesting NSE pre-open data from: ${apiUrl}`);
    
    const apiRes = await fetch(apiUrl, { headers: requestHeaders });
    if (!apiRes.ok) {
      throw new Error(`NSE pre-open API returned status code ${apiRes.status}`);
    }

    const parsedJson = await apiRes.json();
    if (!parsedJson || !Array.isArray(parsedJson.data)) {
      throw new Error('NSE pre-open response data is not in expected array format');
    }

    const fetchIndexSymbols = async (key: string): Promise<string[]> => {
      try {
        const res = await fetch(`https://www.nseindia.com/api/market-data-pre-open?key=${key}`, {
          headers: requestHeaders
        });
        if (!res.ok) return [];
        const json = await res.json();
        if (json && Array.isArray(json.data)) {
          return json.data.map((item: any) => item.metadata?.symbol).filter(Boolean);
        }
      } catch (e) {
        console.error(`Failed to fetch symbols for index key ${key}:`, e);
      }
      return [];
    };

    const fetchWithRetry = async (key: string, retries = 3): Promise<string[]> => {
      for (let i = 0; i < retries; i++) {
        const result = await fetchIndexSymbols(key);
        if (result.length > 0) return result;
        if (i < retries - 1) {
          const delay = 1000 * (i + 1);
          console.log(`Retry ${i + 1}/${retries - 1} for key=${key} in ${delay}ms`);
          await new Promise(r => setTimeout(r, delay));
        }
      }
      return [];
    };

    const fetchNifty500Symbols = async (): Promise<string[]> => {
      try {
        const csvRes = await fetch('https://archives.nseindia.com/content/indices/ind_nifty500list.csv');
        if (csvRes.ok) {
          const csvText = await csvRes.text();
          const lines = csvText.split('\n');
          const symbols: string[] = [];
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',');
            if (cols.length >= 3) {
              const sym = cols[cols.length - 3];
              if (sym) symbols.push(sym.trim());
            }
          }
          return symbols;
        }
      } catch (e) {
        console.error('Failed to fetch Nifty 500 symbols from archives:', e);
      }
      return [];
    };

    const [foSymbols, niftySymbols, bankNiftySymbols, smeSymbols, nifty500Symbols] = await Promise.all([
      fetchWithRetry('FO'),
      fetchIndexSymbols('NIFTY'),
      fetchIndexSymbols('BANKNIFTY'),
      fetchIndexSymbols('SME'),
      fetchNifty500Symbols()
    ]);

    const records: any[] = parsedJson.data;
    const formattedQuotes: StockQuote[] = [];

    for (const record of records) {
      const meta = record.metadata;
      if (!meta || !meta.symbol || meta.symbol === 'NIFTY') continue;

      const symbol = meta.symbol;
      const detail = record.detailInfo;
      const ffShares = 50.0; 
      const volumeVal = record.volume || (detail?.sumVal && detail?.iep ? Math.round(detail.sumVal / detail.iep) : 0) || Math.round(ffShares * 15000);

      formattedQuotes.push({
        symbol,
        name: meta.companyName || symbol,
        ltp: meta.lastPrice || detail?.iep || 0,
        open: meta.openPrice || detail?.iep || 0,
        high: meta.yearHigh || meta.highPrice || detail?.iep || 0,
        low: meta.yearLow || meta.lowPrice || detail?.iep || 0,
        prevClose: meta.previousClose || 0,
        volume: volumeVal,
        change: meta.change || 0,
        changePercent: meta.pChange || 0,
        iep: detail?.iep || meta.lastPrice || 0,
        final: detail?.iep || meta.lastPrice || 0,
        finalQuantity: volumeVal,
        value: (volumeVal * (detail?.iep || meta.lastPrice || 0)) / 10000000, 
        ffmCap: (detail?.iep || meta.lastPrice || 0) * ffShares,
        nm52wH: meta.yearHigh || parseFloat((meta.previousClose * 1.25).toFixed(2)),
        nm52wL: meta.yearLow || parseFloat((meta.previousClose * 0.75).toFixed(2)),
        isNifty50: niftySymbols.includes(symbol),
        isNifty500: nifty500Symbols.includes(symbol),
        isBankNifty: bankNiftySymbols.includes(symbol),
        isFo: foSymbols.includes(symbol),
        isSme: smeSymbols.includes(symbol),
      });
    }

    // Cache the parsed response
    preOpenCache = formattedQuotes;
    lastPreOpenFetchTime = Date.now();
    preOpenCacheDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    });

    console.log(`NSE Pre-Open list loaded successfully. Captured ${formattedQuotes.length} active stocks.`);
    return formattedQuotes;
  } catch (err) {
    console.error('fetchLivePreOpenFromNSE: Web request execution failed:', err);
    throw err;
  }
}

/**
 * Fetch Pre-Open Quotes using Kite credentials as a fallback backup.
 */
export async function fetchLivePreOpenFromKite(apiKey?: string, accessToken?: string): Promise<StockQuote[]> {
  try {
    let finalApiKey = apiKey;
    let finalToken = accessToken;

    if (!finalApiKey || !finalToken) {
      const { getMasterClient } = require('./masterClient');
      const master = await getMasterClient();
      if (master) {
        finalApiKey = master.zerodhaApiKey;
        finalToken = master.accessToken;
      }
    }

    if (!finalApiKey || !finalToken) {
      console.warn('fetchLivePreOpenFromKite: Master client credentials missing. Cannot fetch Kite fallback quotes.');
      return [];
    }

    const nseList = await fetchLivePreOpenFromNSE();
    if (nseList.length === 0) return [];

    const instTokens = nseList.slice(0, 100).map(s => `NSE:${s.symbol}`);
    console.log(`Requesting quote quotes for top ${instTokens.length} stocks from Zerodha Kite...`);
    
    const quoteRes = await KiteClient.getQuotes(finalApiKey, finalToken, instTokens);
    if (quoteRes?.status === 'success' && quoteRes.data) {
      const dataMap = quoteRes.data;
      const kiteQuotes: StockQuote[] = [];

      for (const stock of nseList) {
        const item = dataMap[`NSE:${stock.symbol}`];
        if (item) {
          const ltp = item.last_price || stock.ltp;
          const open = item.ohlc?.open || stock.open;
          const close = item.ohlc?.close || stock.prevClose;
          const chg = ltp - close;
          const pct = close ? (chg / close) * 100 : 0;
          const ffShares = 50.0;

          kiteQuotes.push({
            ...stock,
            ltp,
            open,
            high: item.ohlc?.high || stock.high,
            low: item.ohlc?.low || stock.low,
            prevClose: close,
            volume: item.volume || stock.volume,
            change: parseFloat(chg.toFixed(2)),
            changePercent: parseFloat(pct.toFixed(2)),
            iep: open,
            final: ltp,
            finalQuantity: item.volume || stock.volume,
            value: ((item.volume || stock.volume) * ltp) / 10000000,
            ffmCap: ltp * ffShares,
          });
        } else {
          kiteQuotes.push(stock);
        }
      }

      preOpenCache = kiteQuotes;
      lastPreOpenFetchTime = Date.now();
      preOpenCacheDate = new Date().toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
      });

      return kiteQuotes;
    }
  } catch (err) {
    console.error('fetchLivePreOpenFromKite: Failed to query Kite fallback quotes:', err);
  }
  return [];
}

/**
 * Fetch cache-valid Pre-Open stock quotes.
 */
export async function getPreOpenStocks(forceFetch = false, apiKey?: string, accessToken?: string): Promise<StockQuote[]> {
  const isExpired = (Date.now() - lastPreOpenFetchTime) > CACHE_EXPIRY_MS;
  const isDifferentDay = preOpenCacheDate !== new Date().toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  });

  if (forceFetch || preOpenCache.length === 0 || isExpired || isDifferentDay) {
    try {
      return await fetchLivePreOpenFromNSE();
    } catch {
      console.warn('NSE Pre-Open fetch failed, attempting Kite fallback quote fetch...');
      return await fetchLivePreOpenFromKite(apiKey, accessToken);
    }
  }
  return preOpenCache;
}

export function getCachedPreOpenStocks(): StockQuote[] {
  return preOpenCache;
}

export function getPreOpenDate(): string {
  return preOpenCacheDate || new Date().toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

if (typeof module !== 'undefined' && module.exports) {
// module.exports.getPreOpenStocks = getPreOpenStocks;
// module.exports.getCachedPreOpenStocks = getCachedPreOpenStocks;
// module.exports.getPreOpenDate = getPreOpenDate;
// module.exports.fetchLivePreOpenFromNSE = fetchLivePreOpenFromNSE;
// module.exports.getNifty50Snapshot = getNifty50Snapshot;
// module.exports.getBankNiftySnapshot = getBankNiftySnapshot;enFromKite;
}
