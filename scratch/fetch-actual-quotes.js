const fs = require('fs');

const INSTRUMENT_TO_SYMBOL = {
  5633: 'ACC',
  6401: 'ADANIENT',
  41729: 'APOLLOTYRE',
  54273: 'ASHOKLEY',
  70401: 'AUROPHARMA',
  81153: 'BAJFINANCE',
  87297: 'BALRAMCHIN',
  94977: 'BATAINDIA',
  98049: 'BEL',
  103425: 'BERGEPAINT',
  108033: 'BHARATFORG',
  112129: 'BHEL',
  163073: 'CHAMBLFERT',
  173057: 'EXIDEIND',
  175361: 'CHOLAFIN',
  189185: 'COROMANDEL',
  197633: 'DABUR',
  245249: 'ESCORTS',
  261889: 'FEDERALBNK',
  325121: 'AMBUJACEM',
  341249: 'HDFCBANK',
  356865: 'HINDUNILVR',
  359937: 'HINDPETRO',
  364545: 'HINDZINC',
  387073: 'INDHOTEL',
  408065: 'INFY',
  415745: 'IOC',
  418049: 'IPCALAB',
  424961: 'ITC',
  486657: 'CUMMINSIND',
  492033: 'KOTAKBANK',
  502785: 'TRENT',
  511233: 'LICHSGFIN',
  523009: 'RAMCOCEM',
  558337: 'BOSCHLTD',
  579329: 'BANDHANBNK',
  582913: 'MRF',
  589569: 'HAL',
  633601: 'ONGC',
  681985: 'PIDILITIND',
  738561: 'RELIANCE',
  758529: 'SAIL',
  779521: 'SBIN',
  784129: 'VEDL',
  837889: 'SRF',
  857857: 'SUNPHARMA',
  871681: 'TATACHEM',
  877057: 'TATAPOWER',
  895745: 'TATASTEEL',
  951809: 'VOLTAS',
  952577: 'TATACOMM',
  969473: 'WIPRO',
  975873: 'ZEEL',
  1152769: 'MPHASIS',
  1207553: 'GAIL',
  1215745: 'CONCOR',
  1270529: 'ICICIBANK',
  1510401: 'AXISBANK',
  1629185: 'NATIONALUM',
  1895937: 'GLENMARK',
  2170625: 'TVSTRUCT',
  2445313: 'RVNL',
  2452737: 'METROPOLIS',
  2455041: 'POLYCAB',
  2513665: 'HAVELLS',
  2585345: 'GODREJCP',
  2672641: 'LUPIN',
  2714625: 'BHARTIARTL',
  2730497: 'PNB',
  2763265: 'CANBK',
  2815745: 'MARUTI',
  2905857: 'PETRONET',
  2911489: 'BIOCON',
  2939649: 'LT',
  2952193: 'ULTRACEMCO',
  2953217: 'TCS',
  2955009: 'COFORGE',
  2977281: 'NTPC',
  3001089: 'JSWSTEEL',
  3050241: 'YESBANK',
  3431425: 'SUNTV',
  3463169: 'GMRINFRA',
  3465729: 'TECHM',
  3660545: 'PFC',
  3677697: 'IDEA',
  3771393: 'DLF',
  3826433: 'MOTILALOFS',
  3834113: 'POWERGRID',
  3851265: 'DELTACORP',
  3861249: 'ADANIPORTS',
  3924993: 'NMDC',
  3930881: 'RECLTD',
  4278529: 'UBL',
  4488705: 'MGL',
  4561409: 'LTIM',
  4574465: 'JSWENERGY',
  4576001: 'GODREJPROP',
  4610817: 'WHIRLPOOL',
  4632577: 'JUBLFOOD',
  4879617: 'MANAPPURAM',
  5105409: 'DEEPAKNTR',
  5215745: 'COALINDIA',
  6054401: 'MUTHOOTFIN',
  6386689: 'L&TFH',
  7712001: 'IBULHSGFIN',
  194445057: 'PEL',
  194504193: 'TATAMOTORS'
};

const FREE_FLOAT_SHARES = {
  ACC: 12.0,
  ADANIENT: 40.0,
  APOLLOTYRE: 45.0,
  ASHOKLEY: 285.315,
  AUROPHARMA: 35.0,
  BAJFINANCE: 38.0,
  BALRAMCHIN: 13.0,
  BATAINDIA: 6.0,
  BEL: 360.0,
  BERGEPAINT: 30.0,
  BHARATFORG: 25.0,
  BHEL: 170.0,
  CHAMBLFERT: 24.0,
  EXIDEIND: 46.0,
  CHOLAFIN: 48.0,
  COROMANDEL: 12.0,
  DABUR: 65.0,
  ESCORTS: 7.0,
  FEDERALBNK: 210.0,
  AMBUJACEM: 80.0,
  HDFCBANK: 550.0,
  HINDUNILVR: 85.0,
  HINDPETRO: 95.76,
  HINDZINC: 43.229,
  INDHOTEL: 88.0,
  INFY: 350.0,
  IOC: 650.0,
  IPCALAB: 14.0,
  ITC: 900.0,
  CUMMINSIND: 16.0,
  KOTAKBANK: 160.0,
  TRENT: 18.0,
  LICHSGFIN: 40.0,
  RAMCOCEM: 14.0,
  BOSCHLTD: 1.2,
  BANDHANBNK: 98.0,
  MRF: 0.2,
  HAL: 18.0,
  ONGC: 460.0,
  PIDILITIND: 15.0,
  RELIANCE: 330.0,
  SAIL: 160.0,
  SBIN: 430.0,
  VEDL: 169.442,
  SRF: 16.0,
  SUNPHARMA: 110.0,
  TATACHEM: 17.0,
  TATAPOWER: 170.0,
  TATASTEEL: 824.216,
  VOLTAS: 23.0,
  TATACOMM: 7.0,
  WIPRO: 160.0,
  ZEEL: 90.0,
  MPHASIS: 8.5,
  GAIL: 340.0,
  CONCOR: 27.0,
  ICICIBANK: 630.0,
  AXISBANK: 280.0,
  NATIONALUM: 110.0,
  GLENMARK: 18.0,
  TVSTRUCT: 35.0,
  RVNL: 56.607,
  METROPOLIS: 2.2,
  POLYCAB: 8.5,
  HAVELLS: 32.0,
  GODREJCP: 37.0,
  LUPIN: 28.0,
  BHARTIARTL: 290.0,
  PNB: 500.0,
  CANBK: 360.0,
  MARUTI: 14.0,
  PETRONET: 75.0,
  BIOCON: 48.0,
  LT: 110.0,
  ULTRACEMCO: 12.0,
  TCS: 110.0,
  COFORGE: 4.2,
  NTPC: 480.0,
  JSWSTEEL: 130.0,
  YESBANK: 1751.5,
  SUNTV: 10.0,
  GMRINFRA: 350.0,
  TECHM: 58.0,
  PFC: 140.0,
  IDEA: 1800.0,
  DLF: 100.0,
  MOTILALOFS: 1.283,
  POWERGRID: 360.0,
  DELTACORP: 17.0,
  ADANIPORTS: 80.0,
  NMDC: 120.0,
  RECLTD: 140.0,
  UBL: 11.0,
  MGL: 5.5,
  LTIM: 12.0,
  JSWENERGY: 42.0,
  GODREJPROP: 12.0,
  WHIRLPOOL: 3.2,
  JUBLFOOD: 40.0,
  MANAPPURAM: 55.0,
  DEEPAKNTR: 6.5,
  COALINDIA: 210.0,
  MUTHOOTFIN: 10.0,
  'L&TFH': 90.0,
  IBULHSGFIN: 35.0,
  PEL: 18.0,
  TATAMOTORS: 200.0
};

async function main() {
  const apiKey = '4y7j026qyv9lkacw';
  const accessToken = 'MHQGgllco1BXOfFejZkLbE2y4QursEuZ';

  const symbols = Object.values(INSTRUMENT_TO_SYMBOL).map(s => `NSE:${s}`);
  const chunkSize = 50;
  const quotes = {};

  for (let i = 0; i < symbols.length; i += chunkSize) {
    const chunk = symbols.slice(i, i + chunkSize);
    const query = chunk.join('&i=');
    const url = `https://api.kite.trade/quote?i=${query}`;
    
    console.log(`Fetching chunk ${i / chunkSize + 1}...`);
    const res = await fetch(url, {
      headers: {
        'X-Kite-Version': '3',
        'Authorization': `token ${apiKey}:${accessToken}`
      }
    });

    const data = await res.json();
    if (data.status === 'success') {
      Object.assign(quotes, data.data);
    } else {
      console.error("Failed to fetch quotes chunk:", data.message);
    }
  }

  console.log("Fetched actual quotes count:", Object.keys(quotes).length);
  
  const stockQuotes = {
    _meta: {
      date: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      timestamp: Date.now()
    }
  };

  for (const [key, quote] of Object.entries(quotes)) {
    const symbol = key.split(':')[1];
    const prevClose = quote.ohlc.close;
    const iep = quote.ohlc.open || prevClose;
    const change = parseFloat((iep - prevClose).toFixed(2));
    const changePercent = prevClose ? parseFloat(((change / prevClose) * 100).toFixed(2)) : 0;
    const ffShares = FREE_FLOAT_SHARES[symbol] || 50.0;
    
    stockQuotes[symbol] = {
      prevClose,
      iep,
      change,
      changePercent,
      high: quote.ohlc.high || iep,
      low: quote.ohlc.low || iep,
      volume: quote.volume || Math.round(ffShares * 15000),
      freeFloatShares: ffShares
    };
  }

  fs.writeFileSync('scratch/actual-quotes.json', JSON.stringify(stockQuotes, null, 2));
  console.log("Saved quotes to scratch/actual-quotes.json");
}

main().catch(console.error);
