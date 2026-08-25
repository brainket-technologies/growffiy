import { API_ENDPOINTS } from '../../core/constants';

export const NSE_INDICES_CATEGORIES = {
  "Indices Eligible in Derivatives": [
    "NIFTY 50",
    "NIFTY BANK",
    "NIFTY FINANCIAL SERVICES",
    "NIFTY INDIA FPI 150",
    "NIFTY MIDCAP SELECT",
    "NIFTY NEXT 50"
  ],
  "Broad Market Indices": [
    "NIFTY 100",
    "NIFTY 200",
    "NIFTY 500",
    "NIFTY LARGEMIDCAP 250",
    "NIFTY MICROCAP 250",
    "NIFTY MIDCAP 100",
    "NIFTY MIDCAP 150",
    "NIFTY MIDCAP 50",
    "NIFTY MIDSMALLCAP400 50:50",
    "NIFTY MIDSMALLCAP 400",
    "NIFTY SMALLCAP 500",
    "NIFTY SMALLCAP 100",
    "NIFTY SMALLCAP 250",
    "NIFTY SMALLCAP 50",
    "NIFTY TOTAL MARKET",
    "NIFTY500 LARGEMIDSMALL EQUAL-CAP WEIGHTED",
    "NIFTY500 MULTICAP 50:25:25"
  ],
  "Sectoral Market Indices": [
    "NIFTY AUTO",
    "NIFTY CEMENT",
    "NIFTY CHEMICALS",
    "NIFTY CONSUMER DURABLES",
    "NIFTY FINANCIAL SERVICES EX-BANK",
    "NIFTY FINANCIAL SERVICES 25/50",
    "NIFTY FMCG",
    "NIFTY HEALTHCARE INDEX",
    "NIFTY IT",
    "NIFTY MEDIA",
    "NIFTY METAL",
    "NIFTY MIDSMALL HEALTHCARE",
    "NIFTY MIDSMALL FINANCIAL SERVICES",
    "NIFTY MIDSMALL IT & TELECOM",
    "NIFTY OIL & GAS",
    "NIFTY PHARMA",
    "NIFTY PSU BANK",
    "NIFTY PRIVATE BANK",
    "NIFTY REALTY",
    "NIFTY REITS & REALTY",
    "NIFTY500 HEALTHCARE"
  ],
  "Thematic Market Indices": [
    "NIFTY CAPITAL MARKETS",
    "NIFTY COMMODITIES",
    "NIFTY INDIA CONSUMPTION",
    "NIFTY CORE HOUSING",
    "NIFTY INDIA SELECT 5 CORPORATE GROUPS (MAATR)",
    "NIFTY CPSE",
    "NIFTY ENERGY",
    "NIFTY EV & NEW AGE AUTOMOTIVE",
    "NIFTY HOUSING",
    "NIFTY INDIA DEFENCE",
    "NIFTY INDIA DIGITAL",
    "NIFTY INDIA TOURISM",
    "NIFTY INDIA MANUFACTURING",
    "NIFTY INFRASTRUCTURE",
    "NIFTY INDIA INFRASTRUCTURE & LOGISTICS",
    "NIFTY INDIA INTERNET",
    "NIFTY IPO",
    "NIFTY MIDCAP LIQUID 15",
    "NIFTY MNC",
    "NIFTY MOBILITY",
    "NIFTY MIDSMALL INDIA CONSUMPTION",
    "NIFTY500 MULTICAP INFRASTRUCTURE 50:30:20",
    "NIFTY500 MULTICAP INDIA MANUFACTURING 50:30:20",
    "NIFTY INDIA NEW AGE CONSUMPTION",
    "NIFTY NON-CYCLICAL CONSUMER",
    "NIFTY PSE",
    "NIFTY INDIA RAILWAYS PSU",
    "NIFTY RURAL",
    "NIFTY SERVICES SECTOR",
    "NIFTY SHARIAH 25",
    "NIFTY SME EMERGE",
    "NIFTY INDIA CORPORATE GROUP INDEX - TATA GROUP 25% CAP",
    "NIFTY TRANSPORTATION & LOGISTICS",
    "NIFTY WAVES",
    "NIFTY100 ENHANCED ESG",
    "NIFTY100 ESG",
    "NIFTY100 LIQUID 15",
    "NIFTY50 SHARIAH",
    "NIFTY500 SHARIAH",
    "NIFTY CONGLOMERATE 50"
  ],
  "Strategy Market Indices": [
    "NIFTY ALPHA 50",
    "NIFTY ALPHA LOW-VOLATILITY 30",
    "NIFTY ALPHA QUALITY LOW-VOLATILITY 30",
    "NIFTY ALPHA QUALITY VALUE LOW-VOLATILITY 30",
    "NIFTY DIVIDEND OPPORTUNITIES 50",
    "NIFTY GROWTH SECTORS 15",
    "NIFTY HIGH BETA 50",
    "NIFTY LOW VOLATILITY 50",
    "NIFTY MIDCAP150 QUALITY 50",
    "NIFTY500 MULTICAP MOMENTUM QUALITY 50",
    "NIFTY QUALITY LOW-VOLATILITY 30",
    "NIFTY SMALLCAP250 QUALITY 50",
    "NIFTY TOTAL MARKET MOMENTUM QUALITY 50",
    "NIFTY TOP 10 EQUAL WEIGHT",
    "NIFTY TOP 15 EQUAL WEIGHT",
    "NIFTY TOP 20 EQUAL WEIGHT",
    "NIFTY100 ALPHA 30",
    "NIFTY100 EQUAL WEIGHT",
    "NIFTY100 LOW VOLATILITY 30",
    "NIFTY100 QUALITY 30",
    "NIFTY200 ALPHA 30",
    "NIFTY200 QUALITY 30",
    "NIFTY200 VALUE 30",
    "NIFTY200 MOMENTUM 30",
    "NIFTY50 EQUAL WEIGHT",
    "NIFTY50 VALUE 20",
    "NIFTY500 EQUAL WEIGHT",
    "NIFTY500 FLEXICAP QUALITY 30",
    "NIFTY500 LOW VOLATILITY 50",
    "NIFTY500 MULTIFACTOR MQVLV 50",
    "NIFTY500 QUALITY 50",
    "NIFTY500 VALUE 50",
    "NIFTY500 MOMENTUM 50",
    "NIFTY MIDCAP150 MOMENTUM 50",
    "NIFTY MIDSMALLCAP400 MOMENTUM QUALITY 100",
    "NIFTY SMALLCAP250 MOMENTUM QUALITY 100"
  ],
  "Others": [
    "PERMITTED TO TRADE",
    "SECURITIES IN F&O"
  ]
};

/**
 * Normalise index name key mapping to query NSE API keys
 */
export function getNSEIndexSlug(indexName: string): string {
  // Convert standard name to URL parameters
  let cleanName = indexName.toUpperCase().replace(/\s+/g, '-');
  if (cleanName === 'SECURITIES-IN-F&O') return 'SECURITIES-IN-F-O';
  return cleanName;
}

/**
 * Fetch stocks list belonging to a specific NSE index.
 */
export async function fetchStocksByNSEIndex(indexName: string): Promise<string[]> {
  const slug = getNSEIndexSlug(indexName);
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.nseindia.com/market-data/live-equity-market',
  };

  try {
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

    const apiUrl = `https://www.nseindia.com/api/equity-stockIndices?index=${encodeURIComponent(slug)}`;
    console.log(`marketWatchHelper: Requesting NSE stocks list for index: ${slug}`);

    const res = await fetch(apiUrl, { headers: requestHeaders });
    if (!res.ok) {
      throw new Error(`NSE index api returned status ${res.status}`);
    }

    const json = await res.json();
    if (json && Array.isArray(json.data)) {
      // Extract stock symbols from data
      return json.data.map((item: any) => item.symbol).filter(Boolean);
    }
  } catch (e) {
    console.error(`marketWatchHelper: Error fetching index stocks for ${indexName}:`, e);
  }
  return [];
}
