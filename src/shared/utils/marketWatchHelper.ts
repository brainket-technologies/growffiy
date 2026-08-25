/**
 * marketWatchHelper.ts
 * NSE Index constituent symbols using public NSE CSV archives.
 * No cookies required.
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
    "NIFTY CORE HOUSING", "NIFTY INDIA SELECT 5 CORPORATE GROUPS (MAATR)",
    "NIFTY CPSE", "NIFTY ENERGY", "NIFTY EV & NEW AGE AUTOMOTIVE",
    "NIFTY HOUSING", "NIFTY INDIA DEFENCE", "NIFTY INDIA DIGITAL",
    "NIFTY INDIA TOURISM", "NIFTY INDIA MANUFACTURING", "NIFTY INFRASTRUCTURE",
    "NIFTY INDIA INFRASTRUCTURE & LOGISTICS", "NIFTY INDIA INTERNET",
    "NIFTY IPO", "NIFTY MIDCAP LIQUID 15", "NIFTY MNC", "NIFTY MOBILITY",
    "NIFTY MIDSMALL INDIA CONSUMPTION",
    "NIFTY500 MULTICAP INFRASTRUCTURE 50:30:20", "NIFTY500 MULTICAP INDIA MANUFACTURING 50:30:20",
    "NIFTY INDIA NEW AGE CONSUMPTION", "NIFTY NON-CYCLICAL CONSUMER",
    "NIFTY PSE", "NIFTY INDIA RAILWAYS PSU", "NIFTY RURAL", "NIFTY SERVICES SECTOR",
    "NIFTY SHARIAH 25", "NIFTY SME EMERGE",
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

const INDEX_CSV_MAP: Record<string, string> = {
  // Derivatives eligible
  "NIFTY 50":                                           "https://archives.nseindia.com/content/indices/ind_nifty50list.csv",
  "NIFTY BANK":                                         "https://archives.nseindia.com/content/indices/ind_niftybankindexlist.csv",
  "NIFTY FINANCIAL SERVICES":                           "https://archives.nseindia.com/content/indices/ind_niftyfinancelist.csv",
  "NIFTY NEXT 50":                                      "https://archives.nseindia.com/content/indices/ind_niftynext50list.csv",
  "NIFTY MIDCAP SELECT":                                "https://archives.nseindia.com/content/indices/ind_niftymidcapselectlist.csv",
  "NIFTY INDIA FPI 150":                                "https://archives.nseindia.com/content/indices/ind_niftyindiafpi150list.csv",

  // Broad Market
  "NIFTY 100":                                          "https://archives.nseindia.com/content/indices/ind_nifty100list.csv",
  "NIFTY 200":                                          "https://archives.nseindia.com/content/indices/ind_nifty200list.csv",
  "NIFTY 500":                                          "https://archives.nseindia.com/content/indices/ind_nifty500list.csv",
  "NIFTY LARGEMIDCAP 250":                              "https://archives.nseindia.com/content/indices/ind_niftylargemidcap250list.csv",
  "NIFTY MICROCAP 250":                                 "https://archives.nseindia.com/content/indices/ind_niftymicrocap250_list.csv",
  "NIFTY MIDCAP 100":                                   "https://archives.nseindia.com/content/indices/ind_niftymidcap100list.csv",
  "NIFTY MIDCAP 150":                                   "https://archives.nseindia.com/content/indices/ind_niftymidcap150list.csv",
  "NIFTY MIDCAP 50":                                    "https://archives.nseindia.com/content/indices/ind_niftymidcap50list.csv",
  "NIFTY MIDSMALLCAP400 50:50":                         "https://archives.nseindia.com/content/indices/ind_niftymidsmallcap400_5050list.csv",
  "NIFTY MIDSMALLCAP 400":                              "https://archives.nseindia.com/content/indices/ind_niftymidsmallcap400list.csv",
  "NIFTY SMALLCAP 500":                                 "https://archives.nseindia.com/content/indices/ind_niftysmallcap500list.csv",
  "NIFTY SMALLCAP 100":                                 "https://archives.nseindia.com/content/indices/ind_niftysmallcap100list.csv",
  "NIFTY SMALLCAP 250":                                 "https://archives.nseindia.com/content/indices/ind_niftysmallcap250list.csv",
  "NIFTY SMALLCAP 50":                                  "https://archives.nseindia.com/content/indices/ind_niftysmallcap50list.csv",
  "NIFTY TOTAL MARKET":                                 "https://archives.nseindia.com/content/indices/ind_niftytotalmarket_list.csv",
  "NIFTY500 LARGEMIDSMALL EQUAL-CAP WEIGHTED":          "https://archives.nseindia.com/content/indices/ind_nifty500_largemidsmall_equalcap_weighted_list.csv",
  "NIFTY500 MULTICAP 50:25:25":                         "https://archives.nseindia.com/content/indices/ind_nifty500_multicap_502525_list.csv",

  // Sectoral
  "NIFTY AUTO":                                         "https://archives.nseindia.com/content/indices/ind_niftyautolist.csv",
  "NIFTY CEMENT":                                       "https://archives.nseindia.com/content/indices/ind_niftycementanditsconstituents_list.csv",
  "NIFTY CHEMICALS":                                    "https://archives.nseindia.com/content/indices/ind_niftychemicalslist.csv",
  "NIFTY CONSUMER DURABLES":                            "https://archives.nseindia.com/content/indices/ind_niftyconsumerdurables_list.csv",
  "NIFTY FINANCIAL SERVICES EX-BANK":                   "https://archives.nseindia.com/content/indices/ind_niftyfinancialservicesexbank_list.csv",
  "NIFTY FINANCIAL SERVICES 25/50":                     "https://archives.nseindia.com/content/indices/ind_niftyfinancialservices25_50list.csv",
  "NIFTY FMCG":                                         "https://archives.nseindia.com/content/indices/ind_niftyfmcglist.csv",
  "NIFTY HEALTHCARE INDEX":                             "https://archives.nseindia.com/content/indices/ind_niftyhealthcarelist.csv",
  "NIFTY IT":                                           "https://archives.nseindia.com/content/indices/ind_niftyitlist.csv",
  "NIFTY MEDIA":                                        "https://archives.nseindia.com/content/indices/ind_niftymedialist.csv",
  "NIFTY METAL":                                        "https://archives.nseindia.com/content/indices/ind_niftymetallist.csv",
  "NIFTY MIDSMALL HEALTHCARE":                          "https://archives.nseindia.com/content/indices/ind_niftymidsmallhealthcarelist.csv",
  "NIFTY MIDSMALL FINANCIAL SERVICES":                  "https://archives.nseindia.com/content/indices/ind_niftymidsmallfinancialservices_list.csv",
  "NIFTY MIDSMALL IT & TELECOM":                        "https://archives.nseindia.com/content/indices/ind_niftymidsmallittelecom_list.csv",
  "NIFTY OIL & GAS":                                    "https://archives.nseindia.com/content/indices/ind_niftyoilgaslist.csv",
  "NIFTY PHARMA":                                       "https://archives.nseindia.com/content/indices/ind_niftypharmalist.csv",
  "NIFTY PSU BANK":                                     "https://archives.nseindia.com/content/indices/ind_niftypsubanklist.csv",
  "NIFTY PRIVATE BANK":                                 "https://archives.nseindia.com/content/indices/ind_nifty_privatebanklist.csv",
  "NIFTY REALTY":                                       "https://archives.nseindia.com/content/indices/ind_niftyrealtylist.csv",
  "NIFTY REITS & REALTY":                               "https://archives.nseindia.com/content/indices/ind_niftyreitsandinvits_list.csv",
  "NIFTY500 HEALTHCARE":                                "https://archives.nseindia.com/content/indices/ind_nifty500healthcare_list.csv",

  // Thematic
  "NIFTY CAPITAL MARKETS":                              "https://archives.nseindia.com/content/indices/ind_niftycapitalmarketslist.csv",
  "NIFTY COMMODITIES":                                  "https://archives.nseindia.com/content/indices/ind_niftycommoditieslist.csv",
  "NIFTY INDIA CONSUMPTION":                            "https://archives.nseindia.com/content/indices/ind_niftyindiaconsumptionlist.csv",
  "NIFTY CORE HOUSING":                                 "https://archives.nseindia.com/content/indices/ind_niftycorehousinglist.csv",
  "NIFTY INDIA SELECT 5 CORPORATE GROUPS (MAATR)":     "https://archives.nseindia.com/content/indices/ind_niftyindiaselect5corporategroupsmaatrlist.csv",
  "NIFTY CPSE":                                         "https://archives.nseindia.com/content/indices/ind_niftycpselist.csv",
  "NIFTY ENERGY":                                       "https://archives.nseindia.com/content/indices/ind_niftyenergylist.csv",
  "NIFTY EV & NEW AGE AUTOMOTIVE":                      "https://archives.nseindia.com/content/indices/ind_niftyevnewageautomotivelist.csv",
  "NIFTY HOUSING":                                      "https://archives.nseindia.com/content/indices/ind_niftyhousinglist.csv",
  "NIFTY INDIA DEFENCE":                                "https://archives.nseindia.com/content/indices/ind_niftyindiadefencelist.csv",
  "NIFTY INDIA DIGITAL":                                "https://archives.nseindia.com/content/indices/ind_niftyindiadigitallist.csv",
  "NIFTY INDIA TOURISM":                                "https://archives.nseindia.com/content/indices/ind_niftyindiatourismlist.csv",
  "NIFTY INDIA MANUFACTURING":                          "https://archives.nseindia.com/content/indices/ind_niftyindiamanufacturinglist.csv",
  "NIFTY INFRASTRUCTURE":                               "https://archives.nseindia.com/content/indices/ind_niftyinfrastructurelist.csv",
  "NIFTY INDIA INFRASTRUCTURE & LOGISTICS":             "https://archives.nseindia.com/content/indices/ind_niftyindiainfrastructurelogisticslist.csv",
  "NIFTY INDIA INTERNET":                               "https://archives.nseindia.com/content/indices/ind_niftyindiainternetlist.csv",
  "NIFTY IPO":                                          "https://archives.nseindia.com/content/indices/ind_niftyipolist.csv",
  "NIFTY MIDCAP LIQUID 15":                             "https://archives.nseindia.com/content/indices/ind_niftymidcapliquid15list.csv",
  "NIFTY MNC":                                          "https://archives.nseindia.com/content/indices/ind_niftymnclist.csv",
  "NIFTY MOBILITY":                                     "https://archives.nseindia.com/content/indices/ind_niftymobilitylist.csv",
  "NIFTY MIDSMALL INDIA CONSUMPTION":                   "https://archives.nseindia.com/content/indices/ind_niftymidsmallindiaconsumptionlist.csv",
  "NIFTY500 MULTICAP INFRASTRUCTURE 50:30:20":          "https://archives.nseindia.com/content/indices/ind_nifty500multicapinfrastructure503020list.csv",
  "NIFTY500 MULTICAP INDIA MANUFACTURING 50:30:20":     "https://archives.nseindia.com/content/indices/ind_nifty500multicapindiamanufacturing503020list.csv",
  "NIFTY INDIA NEW AGE CONSUMPTION":                    "https://archives.nseindia.com/content/indices/ind_niftyndiaNewAgeConsumptionlist.csv",
  "NIFTY NON-CYCLICAL CONSUMER":                        "https://archives.nseindia.com/content/indices/ind_niftynoncyclicalconsumerlist.csv",
  "NIFTY PSE":                                          "https://archives.nseindia.com/content/indices/ind_niftypselist.csv",
  "NIFTY INDIA RAILWAYS PSU":                           "https://archives.nseindia.com/content/indices/ind_niftyindiarailwayspsulist.csv",
  "NIFTY RURAL":                                        "https://archives.nseindia.com/content/indices/ind_niftyrurallist.csv",
  "NIFTY SERVICES SECTOR":                              "https://archives.nseindia.com/content/indices/ind_niftyservicesectorlist.csv",
  "NIFTY SHARIAH 25":                                   "https://archives.nseindia.com/content/indices/ind_niftyshariah25list.csv",
  "NIFTY SME EMERGE":                                   "https://archives.nseindia.com/content/indices/ind_niftysmeemergelist.csv",
  "NIFTY INDIA CORPORATE GROUP INDEX - TATA GROUP 25% CAP": "https://archives.nseindia.com/content/indices/ind_niftyindiacorporategroupindextatagrouplist.csv",
  "NIFTY TRANSPORTATION & LOGISTICS":                   "https://archives.nseindia.com/content/indices/ind_niftytransportationlogisticslist.csv",
  "NIFTY WAVES":                                        "https://archives.nseindia.com/content/indices/ind_niftywaveslist.csv",
  "NIFTY100 ENHANCED ESG":                              "https://archives.nseindia.com/content/indices/ind_nifty100enhancedesglist.csv",
  "NIFTY100 ESG":                                       "https://archives.nseindia.com/content/indices/ind_nifty100esglist.csv",
  "NIFTY100 LIQUID 15":                                 "https://archives.nseindia.com/content/indices/ind_nifty100liquid15list.csv",
  "NIFTY50 SHARIAH":                                    "https://archives.nseindia.com/content/indices/ind_nifty50shariahlist.csv",
  "NIFTY500 SHARIAH":                                   "https://archives.nseindia.com/content/indices/ind_nifty500shariahlist.csv",
  "NIFTY CONGLOMERATE 50":                              "https://archives.nseindia.com/content/indices/ind_niftyconglomerate50list.csv",

  // Strategy
  "NIFTY ALPHA 50":                                     "https://archives.nseindia.com/content/indices/ind_niftyalpha50list.csv",
  "NIFTY ALPHA LOW-VOLATILITY 30":                      "https://archives.nseindia.com/content/indices/ind_niftyalphalowvol30list.csv",
  "NIFTY ALPHA QUALITY LOW-VOLATILITY 30":              "https://archives.nseindia.com/content/indices/ind_niftyalphaqualitylowvol30list.csv",
  "NIFTY ALPHA QUALITY VALUE LOW-VOLATILITY 30":        "https://archives.nseindia.com/content/indices/ind_niftyalphaqualityvaluelowvol30list.csv",
  "NIFTY DIVIDEND OPPORTUNITIES 50":                    "https://archives.nseindia.com/content/indices/ind_niftydividendopportunities50list.csv",
  "NIFTY GROWTH SECTORS 15":                            "https://archives.nseindia.com/content/indices/ind_niftygrowthsectors15list.csv",
  "NIFTY HIGH BETA 50":                                 "https://archives.nseindia.com/content/indices/ind_niftyhighbeta50list.csv",
  "NIFTY LOW VOLATILITY 50":                            "https://archives.nseindia.com/content/indices/ind_niftylowvolatility50list.csv",
  "NIFTY MIDCAP150 QUALITY 50":                         "https://archives.nseindia.com/content/indices/ind_niftymidcap150quality50list.csv",
  "NIFTY500 MULTICAP MOMENTUM QUALITY 50":              "https://archives.nseindia.com/content/indices/ind_nifty500multicapmomentumquality50list.csv",
  "NIFTY QUALITY LOW-VOLATILITY 30":                    "https://archives.nseindia.com/content/indices/ind_niftyqualitylowvol30list.csv",
  "NIFTY SMALLCAP250 QUALITY 50":                       "https://archives.nseindia.com/content/indices/ind_niftysmallcap250quality50list.csv",
  "NIFTY TOTAL MARKET MOMENTUM QUALITY 50":             "https://archives.nseindia.com/content/indices/ind_niftytotalmarketmomentumquality50list.csv",
  "NIFTY TOP 10 EQUAL WEIGHT":                          "https://archives.nseindia.com/content/indices/ind_niftytop10equalweightlist.csv",
  "NIFTY TOP 15 EQUAL WEIGHT":                          "https://archives.nseindia.com/content/indices/ind_niftytop15equalweightlist.csv",
  "NIFTY TOP 20 EQUAL WEIGHT":                          "https://archives.nseindia.com/content/indices/ind_niftytop20equalweightlist.csv",
  "NIFTY100 ALPHA 30":                                  "https://archives.nseindia.com/content/indices/ind_nifty100alpha30list.csv",
  "NIFTY100 EQUAL WEIGHT":                              "https://archives.nseindia.com/content/indices/ind_nifty100_equalwt_list.csv",
  "NIFTY100 LOW VOLATILITY 30":                         "https://archives.nseindia.com/content/indices/ind_nifty100lowvol30list.csv",
  "NIFTY100 QUALITY 30":                                "https://archives.nseindia.com/content/indices/ind_nifty100quality30list.csv",
  "NIFTY200 ALPHA 30":                                  "https://archives.nseindia.com/content/indices/ind_nifty200alpha30list.csv",
  "NIFTY200 QUALITY 30":                                "https://archives.nseindia.com/content/indices/ind_nifty200quality30list.csv",
  "NIFTY200 VALUE 30":                                  "https://archives.nseindia.com/content/indices/ind_nifty200value30list.csv",
  "NIFTY200 MOMENTUM 30":                               "https://archives.nseindia.com/content/indices/ind_nifty200momentum30list.csv",
  "NIFTY50 EQUAL WEIGHT":                               "https://archives.nseindia.com/content/indices/ind_nifty50_equalwt_list.csv",
  "NIFTY50 VALUE 20":                                   "https://archives.nseindia.com/content/indices/ind_nifty50value20list.csv",
  "NIFTY500 EQUAL WEIGHT":                              "https://archives.nseindia.com/content/indices/ind_nifty500_equalwt_list.csv",
  "NIFTY500 FLEXICAP QUALITY 30":                       "https://archives.nseindia.com/content/indices/ind_nifty500flexicapquality30list.csv",
  "NIFTY500 LOW VOLATILITY 50":                         "https://archives.nseindia.com/content/indices/ind_nifty500lowvol50list.csv",
  "NIFTY500 MULTIFACTOR MQVLV 50":                      "https://archives.nseindia.com/content/indices/ind_nifty500multifactormqvlv50list.csv",
  "NIFTY500 QUALITY 50":                                "https://archives.nseindia.com/content/indices/ind_nifty500quality50list.csv",
  "NIFTY500 VALUE 50":                                  "https://archives.nseindia.com/content/indices/ind_nifty500value50list.csv",
  "NIFTY500 MOMENTUM 50":                               "https://archives.nseindia.com/content/indices/ind_nifty500momentum50list.csv",
  "NIFTY MIDCAP150 MOMENTUM 50":                        "https://archives.nseindia.com/content/indices/ind_niftymidcap150momentum50list.csv",
  "NIFTY MIDSMALLCAP400 MOMENTUM QUALITY 100":          "https://archives.nseindia.com/content/indices/ind_niftymidsmallcap400momentumquality100list.csv",
  "NIFTY SMALLCAP250 MOMENTUM QUALITY 100":             "https://archives.nseindia.com/content/indices/ind_niftysmallcap250momentumquality100list.csv",

  // Others
  "PERMITTED TO TRADE":                                 "https://archives.nseindia.com/content/fo/fo_mktlots.csv",
  "SECURITIES IN F&O":                                  "https://archives.nseindia.com/content/fo/fo_mktlots.csv",
};

function parseNSECsv(csvText: string): string[] {
  const lines = csvText.replace(/\r/g, '').trim().split('\n');
  if (lines.length === 0) return [];
  
  // Find "Symbol" column index dynamically from header
  const headerCols = lines[0].split(',').map(c => c.trim().replace(/"/g, '').toLowerCase());
  let symbolColIndex = headerCols.indexOf('symbol');
  
  // Fallback to column index 2 if not found explicitly
  if (symbolColIndex === -1) {
    symbolColIndex = 2;
  }

  const symbols: string[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(',');
    const sym = cols[symbolColIndex]?.trim().replace(/"/g, '');
    if (sym && sym.length > 0 && sym !== 'Symbol') {
      symbols.push(sym);
    }
  }
  return symbols;
}

export async function fetchStocksByNSEIndex(indexName: string): Promise<string[]> {
  const csvUrl = INDEX_CSV_MAP[indexName];
  if (!csvUrl) {
    console.warn(`marketWatchHelper: No CSV URL mapped for index "${indexName}"`);
    return [];
  }
  try {
    const res = await fetch(csvUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
    });
    if (!res.ok) throw new Error(`CSV fetch failed: ${res.status}`);
    const csvText = await res.text();
    const symbols = parseNSECsv(csvText);
    console.log(`marketWatchHelper: ${symbols.length} symbols for "${indexName}"`);
    return symbols;
  } catch (e: any) {
    console.error(`marketWatchHelper: Error for "${indexName}":`, e.message);
    return [];
  }
}
