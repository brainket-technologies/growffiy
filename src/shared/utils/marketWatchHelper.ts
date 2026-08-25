/**
 * marketWatchHelper.ts
 * Fetches NSE index constituent symbols using public NSE CSV archives.
 * No cookies required — publicly accessible files.
 */

export const NSE_INDICES_CATEGORIES = {
  "Indices Eligible in Derivatives": [
    "NIFTY 50", "NIFTY BANK", "NIFTY FINANCIAL SERVICES",
    "NIFTY INDIA FPI 150", "NIFTY MIDCAP SELECT", "NIFTY NEXT 50"
  ],
  "Broad Market Indices": [
    "NIFTY 100", "NIFTY 200", "NIFTY 500",
    "NIFTY LARGEMIDCAP 250", "NIFTY MICROCAP 250",
    "NIFTY MIDCAP 100", "NIFTY MIDCAP 150", "NIFTY MIDCAP 50",
    "NIFTY SMALLCAP 100", "NIFTY SMALLCAP 250", "NIFTY SMALLCAP 50",
    "NIFTY TOTAL MARKET"
  ],
  "Sectoral Market Indices": [
    "NIFTY AUTO", "NIFTY CEMENT", "NIFTY CHEMICALS",
    "NIFTY CONSUMER DURABLES", "NIFTY FMCG", "NIFTY HEALTHCARE INDEX",
    "NIFTY IT", "NIFTY MEDIA", "NIFTY METAL", "NIFTY OIL & GAS",
    "NIFTY PHARMA", "NIFTY PSU BANK", "NIFTY PRIVATE BANK", "NIFTY REALTY"
  ],
  "Thematic Market Indices": [
    "NIFTY COMMODITIES", "NIFTY CPSE", "NIFTY ENERGY",
    "NIFTY INDIA DEFENCE", "NIFTY INDIA DIGITAL", "NIFTY INFRASTRUCTURE",
    "NIFTY MNC", "NIFTY PSE", "NIFTY SERVICES SECTOR"
  ],
  "Strategy Market Indices": [
    "NIFTY ALPHA 50", "NIFTY DIVIDEND OPPORTUNITIES 50",
    "NIFTY HIGH BETA 50", "NIFTY LOW VOLATILITY 50",
    "NIFTY100 QUALITY 30", "NIFTY200 MOMENTUM 30",
    "NIFTY50 EQUAL WEIGHT", "NIFTY50 VALUE 20"
  ]
};

/**
 * Maps index name to NSE CSV archive URL.
 * These CSV files are publicly accessible — no cookies needed.
 */
const INDEX_CSV_MAP: Record<string, string> = {
  // Derivatives eligible
  "NIFTY 50":                       "https://archives.nseindia.com/content/indices/ind_nifty50list.csv",
  "NIFTY BANK":                     "https://archives.nseindia.com/content/indices/ind_niftybankindexlist.csv",
  "NIFTY FINANCIAL SERVICES":       "https://archives.nseindia.com/content/indices/ind_niftyfinancialserviceslist.csv",
  "NIFTY NEXT 50":                  "https://archives.nseindia.com/content/indices/ind_niftynext50list.csv",
  "NIFTY MIDCAP SELECT":            "https://archives.nseindia.com/content/indices/ind_niftymidcapselectlist.csv",
  "NIFTY INDIA FPI 150":            "https://archives.nseindia.com/content/indices/ind_niftyindiafpi150list.csv",

  // Broad Market
  "NIFTY 100":                      "https://archives.nseindia.com/content/indices/ind_nifty100list.csv",
  "NIFTY 200":                      "https://archives.nseindia.com/content/indices/ind_nifty200list.csv",
  "NIFTY 500":                      "https://archives.nseindia.com/content/indices/ind_nifty500list.csv",
  "NIFTY LARGEMIDCAP 250":          "https://archives.nseindia.com/content/indices/ind_niftylargemidcap250list.csv",
  "NIFTY MICROCAP 250":             "https://archives.nseindia.com/content/indices/ind_niftymicrocap250_list.csv",
  "NIFTY MIDCAP 100":               "https://archives.nseindia.com/content/indices/ind_niftymidcap100list.csv",
  "NIFTY MIDCAP 150":               "https://archives.nseindia.com/content/indices/ind_niftymidcap150list.csv",
  "NIFTY MIDCAP 50":                "https://archives.nseindia.com/content/indices/ind_niftymidcap50list.csv",
  "NIFTY SMALLCAP 100":             "https://archives.nseindia.com/content/indices/ind_niftysmallcap100list.csv",
  "NIFTY SMALLCAP 250":             "https://archives.nseindia.com/content/indices/ind_niftysmallcap250list.csv",
  "NIFTY SMALLCAP 50":              "https://archives.nseindia.com/content/indices/ind_niftysmallcap50list.csv",
  "NIFTY TOTAL MARKET":             "https://archives.nseindia.com/content/indices/ind_niftytotalmarket_list.csv",

  // Sectoral
  "NIFTY AUTO":                     "https://archives.nseindia.com/content/indices/ind_niftyautolist.csv",
  "NIFTY CEMENT":                   "https://archives.nseindia.com/content/indices/ind_niftycementanditsconstituents_list.csv",
  "NIFTY CHEMICALS":                "https://archives.nseindia.com/content/indices/ind_niftychemicalslist.csv",
  "NIFTY CONSUMER DURABLES":        "https://archives.nseindia.com/content/indices/ind_niftyconsumerdurables_list.csv",
  "NIFTY FMCG":                     "https://archives.nseindia.com/content/indices/ind_niftyfmcglist.csv",
  "NIFTY HEALTHCARE INDEX":         "https://archives.nseindia.com/content/indices/ind_niftyhealthcarelist.csv",
  "NIFTY IT":                       "https://archives.nseindia.com/content/indices/ind_niftyitlist.csv",
  "NIFTY MEDIA":                    "https://archives.nseindia.com/content/indices/ind_niftymedialist.csv",
  "NIFTY METAL":                    "https://archives.nseindia.com/content/indices/ind_niftymetallist.csv",
  "NIFTY OIL & GAS":                "https://archives.nseindia.com/content/indices/ind_niftyoilgaslist.csv",
  "NIFTY PHARMA":                   "https://archives.nseindia.com/content/indices/ind_niftypharmalist.csv",
  "NIFTY PSU BANK":                 "https://archives.nseindia.com/content/indices/ind_niftypsubanklist.csv",
  "NIFTY PRIVATE BANK":             "https://archives.nseindia.com/content/indices/ind_nifty_privatebanklist.csv",
  "NIFTY REALTY":                   "https://archives.nseindia.com/content/indices/ind_niftyrealtylist.csv",

  // Thematic
  "NIFTY COMMODITIES":              "https://archives.nseindia.com/content/indices/ind_niftycommoditieslist.csv",
  "NIFTY CPSE":                     "https://archives.nseindia.com/content/indices/ind_niftycpselist.csv",
  "NIFTY ENERGY":                   "https://archives.nseindia.com/content/indices/ind_niftyenergylist.csv",
  "NIFTY INDIA DEFENCE":            "https://archives.nseindia.com/content/indices/ind_niftyindiadefencelist.csv",
  "NIFTY INDIA DIGITAL":            "https://archives.nseindia.com/content/indices/ind_niftyindiadigitallist.csv",
  "NIFTY INFRASTRUCTURE":           "https://archives.nseindia.com/content/indices/ind_niftyinfrastructurelist.csv",
  "NIFTY MNC":                      "https://archives.nseindia.com/content/indices/ind_niftymnclist.csv",
  "NIFTY PSE":                      "https://archives.nseindia.com/content/indices/ind_niftypselist.csv",
  "NIFTY SERVICES SECTOR":          "https://archives.nseindia.com/content/indices/ind_niftyservicesectorlist.csv",

  // Strategy
  "NIFTY ALPHA 50":                 "https://archives.nseindia.com/content/indices/ind_niftyalpha50list.csv",
  "NIFTY DIVIDEND OPPORTUNITIES 50":"https://archives.nseindia.com/content/indices/ind_niftydividendopportunities50list.csv",
  "NIFTY HIGH BETA 50":             "https://archives.nseindia.com/content/indices/ind_niftyhighbeta50list.csv",
  "NIFTY LOW VOLATILITY 50":        "https://archives.nseindia.com/content/indices/ind_niftylowvolatility50list.csv",
  "NIFTY100 QUALITY 30":            "https://archives.nseindia.com/content/indices/ind_nifty100quality30list.csv",
  "NIFTY200 MOMENTUM 30":           "https://archives.nseindia.com/content/indices/ind_nifty200momentum30list.csv",
  "NIFTY50 EQUAL WEIGHT":           "https://archives.nseindia.com/content/indices/ind_nifty50_equalwt_list.csv",
  "NIFTY50 VALUE 20":               "https://archives.nseindia.com/content/indices/ind_nifty50value20list.csv",
};

/**
 * Parse NSE CSV and extract Symbol column (column index 2 in most files).
 */
function parseNSECsv(csvText: string): string[] {
  const lines = csvText.trim().split('\n');
  const symbols: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(',');
    // NSE CSV format: Company Name, Industry, Symbol, Series, ISIN Code
    if (cols.length >= 3) {
      const sym = cols[2]?.trim().replace(/"/g, '');
      if (sym && sym.length > 0 && sym !== 'Symbol') {
        symbols.push(sym);
      }
    }
  }
  return symbols;
}

/**
 * Fetch all stock symbols for a given NSE index name.
 * Uses publicly accessible NSE CSV archive files.
 */
export async function fetchStocksByNSEIndex(indexName: string): Promise<string[]> {
  const csvUrl = INDEX_CSV_MAP[indexName];

  if (!csvUrl) {
    console.warn(`marketWatchHelper: No CSV URL mapped for index "${indexName}"`);
    return [];
  }

  try {
    console.log(`marketWatchHelper: Fetching symbols for "${indexName}" from CSV...`);
    const res = await fetch(csvUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/csv,text/plain,*/*',
      },
      // Cache for 1 hour — index constituents don't change intraday
      next: { revalidate: 3600 }
    });

    if (!res.ok) {
      throw new Error(`CSV fetch failed with status ${res.status} for ${csvUrl}`);
    }

    const csvText = await res.text();
    const symbols = parseNSECsv(csvText);
    console.log(`marketWatchHelper: Found ${symbols.length} symbols for "${indexName}"`);
    return symbols;

  } catch (e: any) {
    console.error(`marketWatchHelper: Error fetching CSV for "${indexName}":`, e.message);
    return [];
  }
}
