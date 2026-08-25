/**
 * marketWatchHelper.ts
 * Dynamic NSE Index constituents fetch system with offline fallbacks for 404 URLs.
 */

export const NSE_INDICES_CATEGORIES: Record<string, string[]> = {
  "Indices Eligible in Derivatives": [
    "NIFTY 50", "NIFTY BANK", "NIFTY FINANCIAL SERVICES",
    "NIFTY INDIA FPI 150", "NIFTY MIDCAP SELECT", "NIFTY NEXT 50"
  ],
  "Broad Market Indices": [
    "NIFTY 100", "NIFTY 200", "NIFTY 500",
    "NIFTY LARGEMIDCAP 250", "NIFTY MICROCAP 250",
    "NIFTY MIDCAP 100", "NIFTY MIDCAP 150", "NIFTY MIDCAP 50",
    "NIFTY MIDSMALLCAP400 50:50", "NIFTY MIDSMALLCAP 400",
    "NIFTY SMALLCAP 500", "NIFTY SMALLCAP 100", "NIFTY SMALLCAP 250", "NIFTY SMALLCAP 50",
    "NIFTY TOTAL MARKET",
    "NIFTY500 LARGEMIDSMALL EQUAL-CAP WEIGHTED", "NIFTY500 MULTICAP 50:25:25"
  ],
  "Sectoral Market Indices": [
    "NIFTY AUTO", "NIFTY CEMENT", "NIFTY CHEMICALS", "NIFTY CONSUMER DURABLES",
    "NIFTY FINANCIAL SERVICES EX-BANK", "NIFTY FINANCIAL SERVICES 25/50",
    "NIFTY FMCG", "NIFTY HEALTHCARE INDEX", "NIFTY IT", "NIFTY MEDIA", "NIFTY METAL",
    "NIFTY MIDSMALL HEALTHCARE", "NIFTY MIDSMALL FINANCIAL SERVICES",
    "NIFTY MIDSMALL IT & TELECOM", "NIFTY OIL & GAS", "NIFTY PHARMA",
    "NIFTY PSU BANK", "NIFTY PRIVATE BANK", "NIFTY REALTY",
    "NIFTY REITS & REALTY", "NIFTY500 HEALTHCARE"
  ],
  "Thematic Market Indices": [
    "NIFTY CAPITAL MARKETS", "NIFTY COMMODITIES", "NIFTY INDIA CONSUMPTION",
    "NIFTY CORE HOUSING", "NIFTY CPSE", "NIFTY ENERGY", "NIFTY EV & NEW AGE AUTOMOTIVE",
    "NIFTY HOUSING", "NIFTY INDIA DEFENCE", "NIFTY INDIA DIGITAL",
    "NIFTY INDIA TOURISM", "NIFTY INDIA MANUFACTURING", "NIFTY INFRASTRUCTURE",
    "NIFTY INDIA INFRASTRUCTURE & LOGISTICS", "NIFTY INDIA INTERNET",
    "NIFTY IPO", "NIFTY MIDCAP LIQUID 15", "NIFTY MNC", "NIFTY MOBILITY",
    "NIFTY MIDSMALL INDIA CONSUMPTION", "NIFTY500 MULTICAP INFRASTRUCTURE 50:30:20",
    "NIFTY500 MULTICAP INDIA MANUFACTURING 50:30:20", "NIFTY INDIA NEW AGE CONSUMPTION",
    "NIFTY NON-CYCLICAL CONSUMER", "NIFTY PSE", "NIFTY INDIA RAILWAYS PSU", "NIFTY RURAL",
    "NIFTY SERVICES SECTOR", "NIFTY SHARIAH 25", "NIFTY SME EMERGE",
    "NIFTY INDIA CORPORATE GROUP INDEX - TATA GROUP 25% CAP",
    "NIFTY TRANSPORTATION & LOGISTICS", "NIFTY WAVES",
    "NIFTY100 ENHANCED ESG", "NIFTY100 ESG", "NIFTY100 LIQUID 15",
    "NIFTY50 SHARIAH", "NIFTY500 SHARIAH", "NIFTY CONGLOMERATE 50"
  ],
  "Strategy Market Indices": [
    "NIFTY ALPHA 50", "NIFTY ALPHA LOW-VOLATILITY 30",
    "NIFTY ALPHA QUALITY LOW-VOLATILITY 30", "NIFTY ALPHA QUALITY VALUE LOW-VOLATILITY 30",
    "NIFTY DIVIDEND OPPORTUNITIES 50", "NIFTY GROWTH SECTORS 15",
    "NIFTY HIGH BETA 50", "NIFTY LOW VOLATILITY 50",
    "NIFTY MIDCAP150 QUALITY 50", "NIFTY500 MULTICAP MOMENTUM QUALITY 50",
    "NIFTY QUALITY LOW-VOLATILITY 30", "NIFTY SMALLCAP250 QUALITY 50",
    "NIFTY TOTAL MARKET MOMENTUM QUALITY 50",
    "NIFTY TOP 10 EQUAL WEIGHT", "NIFTY TOP 15 EQUAL WEIGHT", "NIFTY TOP 20 EQUAL WEIGHT",
    "NIFTY100 ALPHA 30", "NIFTY100 EQUAL WEIGHT", "NIFTY100 LOW VOLATILITY 30", "NIFTY100 QUALITY 30",
    "NIFTY200 ALPHA 30", "NIFTY200 QUALITY 30", "NIFTY200 VALUE 30", "NIFTY200 MOMENTUM 30",
    "NIFTY50 EQUAL WEIGHT", "NIFTY50 VALUE 20",
    "NIFTY500 EQUAL WEIGHT", "NIFTY500 FLEXICAP QUALITY 30", "NIFTY500 LOW VOLATILITY 50",
    "NIFTY500 MULTIFACTOR MQVLV 50", "NIFTY500 QUALITY 50", "NIFTY500 VALUE 50",
    "NIFTY500 MOMENTUM 50", "NIFTY MIDCAP150 MOMENTUM 50",
    "NIFTY MIDSMALLCAP400 MOMENTUM QUALITY 100", "NIFTY SMALLCAP250 MOMENTUM QUALITY 100"
  ],
  "Others": [
    "PERMITTED TO TRADE", "SECURITIES IN F&O"
  ]
};

// Normalize names for URL matching exceptions
const EXCEPTION_URL_MAP: Record<string, string> = {
  "NIFTY BANK": "ind_niftybanklist.csv",
  "NIFTY FINANCIAL SERVICES": "ind_niftyfinancelist.csv",
  "NIFTY FINANCIAL SERVICES 25/50": "ind_niftyfinancialservices25_50list.csv",
  "NIFTY PRIVATE BANK": "ind_nifty_privatebanklist.csv",
  "NIFTY REITS & REALTY": "ind_niftyreitsandinvits_list.csv"
};

function parseNSECsv(csvText: string): string[] {
  const lines = csvText.replace(/\r/g, '').trim().split('\n');
  if (lines.length === 0) return [];
  
  const headerCols = lines[0].split(',').map(c => c.trim().replace(/"/g, '').toLowerCase());
  let symbolColIndex = headerCols.indexOf('symbol');
  
  if (symbolColIndex === -1) {
    symbolColIndex = 2;
  }

  const symbols: string[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    const sym = cols[symbolColIndex]?.trim().replace(/"/g, '');
    if (sym && sym.length > 0 && sym !== 'Symbol') {
      symbols.push(sym);
    }
  }
  return symbols;
}

export async function fetchStocksByNSEIndex(indexName: string): Promise<string[]> {
  // Check exception overrides first
  let fileName = EXCEPTION_URL_MAP[indexName];
  
  if (!fileName) {
    // Generate dynamic file name pattern
    const cleanName = indexName.toLowerCase()
      .replace(/\s+/g, '')
      .replace(/&/g, '')
      .replace(/\//g, '')
      .replace(/:/g, '')
      .replace(/-/g, '');
    fileName = `ind_${cleanName}list.csv`;
  }

  const csvUrl = `https://archives.nseindia.com/content/indices/${fileName}`;

  try {
    const res = await fetch(csvUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (res.status === 404) {
      console.warn(`marketWatchHelper: 404 on ${csvUrl} for ${indexName}, falling back to NIFTY 500`);
      // Fallback to NIFTY 500 constituents to prevent empty lists
      const fb = await fetch(`https://archives.nseindia.com/content/indices/ind_nifty500list.csv`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (fb.ok) {
        const fbText = await fb.text();
        return parseNSECsv(fbText);
      }
      return [];
    }

    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    const csvText = await res.text();
    return parseNSECsv(csvText);

  } catch (e: any) {
    console.error(`marketWatchHelper: Error for "${indexName}":`, e.message);
    // Silent fallback to NIFTY 500 on exceptions
    try {
      const fb = await fetch(`https://archives.nseindia.com/content/indices/ind_nifty500list.csv`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      if (fb.ok) {
        return parseNSECsv(await fb.text());
      }
    } catch {}
    return [];
  }
}
