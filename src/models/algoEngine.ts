import { prisma } from '../lib/db';
import WebSocket from 'ws';

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
  // F&O segment specific columns matching NSE Market Watch
  iep: number;
  final: number;
  finalQuantity: number;
  value: number; // in Crores
  ffmCap: number; // in Crores
  nm52wH: number;
  nm52wL: number;
}

const STOCK_NAMES: { [symbol: string]: string } = {
  ASHOKLEY: 'Ashok Leyland Ltd.',
  HINDPETRO: 'Hindustan Petroleum Corp. Ltd.',
  TATASTEEL: 'Tata Steel Ltd.',
  VEDL: 'Vedanta Limited',
  HINDZINC: 'Hindustan Zinc Ltd.',
  RVNL: 'Rail Vikas Nigam Ltd.',
  YESBANK: 'Yes Bank Ltd.',
  MOTILALOFS: 'Motilal Oswal Financial Services Ltd.',
  PNB: 'Punjab National Bank',
  CANBK: 'Canara Bank',
  ZEEL: 'Zee Entertainment Enterprises Ltd.',
  GMRINFRA: 'GMR Airports Infrastructure Ltd.',
  SAIL: 'Steel Authority of India Ltd.',
  NATIONALUM: 'National Aluminium Co. Ltd.',
  NMDC: 'NMDC Limited',
  TATAPOWER: 'Tata Power Co. Ltd.',
  PFC: 'Power Finance Corporation Ltd.',
  RECLTD: 'REC Limited',
  BHEL: 'Bharat Heavy Electricals Ltd.',
  GAIL: 'GAIL (India) Ltd.',
  ONGC: 'Oil & Natural Gas Corporation Ltd.',
  COALINDIA: 'Coal India Ltd.',
  BEL: 'Bharat Electronics Ltd.',
  WIPRO: 'Wipro Ltd.',
  HDFCBANK: 'HDFC Bank Ltd.',
  ICICIBANK: 'ICICI Bank Ltd.',
  SBIN: 'State Bank of India',
  RELIANCE: 'Reliance Industries Ltd.',
  TCS: 'Tata Consultancy Services Ltd.',
  INFY: 'Infosys Ltd.',
  AXISBANK: 'Axis Bank Ltd.',
  KOTAKBANK: 'Kotak Mahindra Bank Ltd.',
  TATAMOTORS: 'Tata Motors Ltd.',
  BAJFINANCE: 'Bajaj Finance Ltd.',
  BHARTIARTL: 'Bharti Airtel Ltd.',
  ITC: 'ITC Ltd.',
  HINDUNILVR: 'Hindustan Unilever Ltd.',
  LT: 'Larsen & Toubro Ltd.',
  SUNPHARMA: 'Sun Pharmaceutical Industries Ltd.',
  NTPC: 'NTPC Ltd.',
  MARUTI: 'Maruti Suzuki India Ltd.',
  JSWSTEEL: 'JSW Steel Ltd.',
  APOLLOTYRE: 'Apollo Tyres Ltd.',
  BIOCON: 'Biocon Ltd.',
  BANDHANBNK: 'Bandhan Bank Ltd.',
  DLF: 'DLF Ltd.',
  GLENMARK: 'Glenmark Pharmaceuticals Ltd.',
  METROPOLIS: 'Metropolis Healthcare Ltd.',
  SUNTV: 'Sun TV Network Ltd.',
  JUBLFOOD: 'Jubilant FoodWorks Ltd.',
  ESCORTS: 'Escorts Kubota Ltd.',
  IDEA: 'Vodafone Idea Ltd.',
  AMBUJACEM: 'Ambuja Cements Ltd.',
  ACC: 'ACC Ltd.',
  ADANIENT: 'Adani Enterprises Ltd.',
  ADANIPORTS: 'Adani Ports & SEZ Ltd.',
  AUROPHARMA: 'Aurobindo Pharma Ltd.',
  BALRAMCHIN: 'Balrampur Chini Mills Ltd.',
  BATAINDIA: 'Bata India Ltd.',
  BERGEPAINT: 'Berger Paints India Ltd.',
  BHARATFORG: 'Bharat Forge Ltd.',
  BOSCHLTD: 'Bosch Ltd.',
  CHAMBLFERT: 'Chambal Fertilisers & Chemicals Ltd.',
  CHOLAFIN: 'Cholamandalam Investment & Finance Co.',
  COFORGE: 'Coforge Ltd.',
  CONCOR: 'Container Corporation of India Ltd.',
  COROMANDEL: 'Coromandel International Ltd.',
  CUMMINSIND: 'Cummins India Ltd.',
  DABUR: 'Dabur India Ltd.',
  DEEPAKNTR: 'Deepak Nitrite Ltd.',
  DELTACORP: 'Delta Corp Ltd.',
  EXIDEIND: 'Exide Industries Ltd.',
  FEDERALBNK: 'The Federal Bank Ltd.',
  GODREJCP: 'Godrej Consumer Products Ltd.',
  GODREJPROP: 'Godrej Properties Ltd.',
  HAL: 'Hindustan Aeronautics Ltd.',
  HAVELLS: 'Havells India Ltd.',
  IBULHSGFIN: 'Indiabulls Housing Finance Ltd.',
  INDHOTEL: 'The Indian Hotels Co. Ltd.',
  IOC: 'Indian Oil Corporation Ltd.',
  IPCALAB: 'IPCA Laboratories Ltd.',
  JSWENERGY: 'JSW Energy Ltd.',
  'L&TFH': 'L&T Finance Holdings Ltd.',
  LICHSGFIN: 'LIC Housing Finance Ltd.',
  LTIM: 'LTIMindtree Ltd.',
  LUPIN: 'Lupin Ltd.',
  MANAPPURAM: 'Manappuram Finance Ltd.',
  MGL: 'Mahanagar Gas Ltd.',
  MPHASIS: 'Mphasis Ltd.',
  MRF: 'MRF Ltd.',
  MUTHOOTFIN: 'Muthoot Finance Ltd.',
  PEL: 'Piramal Enterprises Ltd.',
  PETRONET: 'Petronet LNG Ltd.',
  PIDILITIND: 'Pidilite Industries Ltd.',
  POLYCAB: 'Polycab India Ltd.',
  POWERGRID: 'Power Grid Corporation of India Ltd.',
  RAMCOCEM: 'The Ramco Cements Ltd.',
  SRF: 'SRF Ltd.',
  TATACHEM: 'Tata Chemicals Ltd.',
  TATACOMM: 'Tata Communications Ltd.',
  TCSC: 'TCS Group Ltd.',
  TECHM: 'Tech Mahindra Ltd.',
  TRENT: 'Trent Ltd.',
  TVSTRUCT: 'TVS Motor Company Ltd.',
  UBL: 'United Breweries Ltd.',
  ULTRACEMCO: 'UltraTech Cement Ltd.',
  VOLTAS: 'Voltas Ltd.',
  WHIRLPOOL: 'Whirlpool of India Ltd.'
};

const INSTRUMENT_TO_SYMBOL: { [key: number]: string } = {
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

const BASE_PRICES: { [symbol: string]: number } = {
  ACC: 2000.0,
  ADANIENT: 2500.0,
  APOLLOTYRE: 400.0,
  ASHOKLEY: 150.0,
  AUROPHARMA: 900.0,
  BAJFINANCE: 7000.0,
  BALRAMCHIN: 400.0,
  BATAINDIA: 1500.0,
  BEL: 130.0,
  BERGEPAINT: 600.0,
  BHARATFORG: 900.0,
  BHEL: 100.0,
  CHAMBLFERT: 300.0,
  EXIDEIND: 250.0,
  CHOLAFIN: 1100.0,
  COROMANDEL: 1000.0,
  DABUR: 550.0,
  ESCORTS: 2200.0,
  FEDERALBNK: 140.0,
  AMBUJACEM: 450.0,
  HDFCBANK: 1600.0,
  HINDUNILVR: 2500.0,
  HINDPETRO: 300.0,
  HINDZINC: 320.0,
  INDHOTEL: 400.0,
  INFY: 1500.0,
  IOC: 100.0,
  IPCALAB: 900.0,
  ITC: 450.0,
  CUMMINSIND: 1800.0,
  KOTAKBANK: 1800.0,
  TRENT: 2000.0,
  LICHSGFIN: 450.0,
  RAMCOCEM: 900.0,
  BOSCHLTD: 19000.0,
  BANDHANBNK: 230.0,
  MRF: 100000.0,
  HAL: 3000.0,
  ONGC: 180.0,
  PIDILITIND: 2500.0,
  RELIANCE: 2400.0,
  SAIL: 90.0,
  SBIN: 580.0,
  VEDL: 280.0,
  SRF: 2300.0,
  SUNPHARMA: 1150.0,
  TATACHEM: 1000.0,
  TATAPOWER: 240.0,
  TATASTEEL: 120.0,
  VOLTAS: 800.0,
  TATACOMM: 1600.0,
  WIPRO: 400.0,
  ZEEL: 200.0,
  MPHASIS: 2300.0,
  GAIL: 120.0,
  CONCOR: 700.0,
  ICICIBANK: 950.0,
  AXISBANK: 980.0,
  NATIONALUM: 90.0,
  GLENMARK: 750.0,
  TVSTRUCT: 1400.0,
  RVNL: 120.0,
  METROPOLIS: 1400.0,
  POLYCAB: 4300.0,
  HAVELLS: 1300.0,
  GODREJCP: 1000.0,
  LUPIN: 1000.0,
  BHARTIARTL: 880.0,
  PNB: 60.0,
  CANBK: 330.0,
  MARUTI: 9500.0,
  PETRONET: 230.0,
  BIOCON: 250.0,
  LT: 2400.0,
  ULTRACEMCO: 8200.0,
  TCS: 3400.0,
  COFORGE: 5000.0,
  NTPC: 210.0,
  JSWSTEEL: 780.0,
  YESBANK: 17.0,
  SUNTV: 500.0,
  GMRINFRA: 60.0,
  TECHM: 1150.0,
  PFC: 250.0,
  IDEA: 8.0,
  DLF: 500.0,
  MOTILALOFS: 800.0,
  POWERGRID: 240.0,
  DELTACORP: 140.0,
  ADANIPORTS: 750.0,
  NMDC: 120.0,
  RECLTD: 270.0,
  UBL: 1500.0,
  MGL: 1000.0,
  LTIM: 5000.0,
  JSWENERGY: 350.0,
  GODREJPROP: 1600.0,
  WHIRLPOOL: 1400.0,
  JUBLFOOD: 500.0,
  MANAPPURAM: 130.0,
  DEEPAKNTR: 2000.0,
  COALINDIA: 230.0,
  MUTHOOTFIN: 1300.0,
  'L&TFH': 100.0,
  IBULHSGFIN: 150.0,
  PEL: 900.0,
  TATAMOTORS: 600.0
};

const FREE_FLOAT_SHARES: { [symbol: string]: number } = {
  ACC: 12.0,
  ADANIENT: 40.0,
  APOLLOTYRE: 45.0,
  ASHOKLEY: 180.0,
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
  HINDPETRO: 72.0,
  HINDZINC: 30.0,
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
  VEDL: 140.0,
  SRF: 16.0,
  SUNPHARMA: 110.0,
  TATACHEM: 17.0,
  TATAPOWER: 170.0,
  TATASTEEL: 850.0,
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
  RVNL: 44.0,
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
  YESBANK: 2000.0,
  SUNTV: 10.0,
  GMRINFRA: 350.0,
  TECHM: 58.0,
  PFC: 140.0,
  IDEA: 1800.0,
  DLF: 100.0,
  MOTILALOFS: 10.0,
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

const uniqueSymbols = Array.from(new Set(Object.values(INSTRUMENT_TO_SYMBOL)));
const INITIAL_STOCKS: StockQuote[] = uniqueSymbols.map(symbol => {
  const name = STOCK_NAMES[symbol] || symbol;
  const basePrice = BASE_PRICES[symbol] || 100.0;
  const ffShares = FREE_FLOAT_SHARES[symbol] || 50.0;
  const baseVolume = Math.round(ffShares * 15000);
  const ffmCap = basePrice * ffShares;
  const value = (baseVolume * basePrice) / 10000000;
  return {
    symbol,
    name,
    ltp: basePrice,
    open: basePrice,
    high: basePrice,
    low: basePrice,
    prevClose: basePrice,
    volume: baseVolume,
    change: 0,
    changePercent: 0,
    iep: basePrice,
    final: basePrice,
    finalQuantity: baseVolume,
    value,
    ffmCap,
    nm52wH: basePrice * 1.2,
    nm52wL: basePrice * 0.8
  };
});

class AlgoEngineService {
  private stocksState: StockQuote[] = [...INITIAL_STOCKS];
  private isTradingActive: boolean = false;
  private ws: WebSocket | null = null;
  private lastUpdate: { [symbol: string]: number } = {};

  constructor() {
    this.initializeKiteLiveFeed();
  }

  // Initialize Kite Live Socket feed from Environment variables or Database
  public async initializeKiteLiveFeed() {
    try {
      // 1. Try env variables first
      const envApiKey = process.env.ZERODHA_API_KEY || process.env.KITE_API_KEY;
      const envAccessToken = process.env.ZERODHA_ACCESS_TOKEN || process.env.KITE_ACCESS_TOKEN;

      if (envApiKey && envAccessToken) {
        console.log('Using master Zerodha credentials configured in .env variables');
        this.connectKiteWebSocket(envApiKey, envAccessToken);
        return;
      }

      // 2. Fall back to Client credentials inside DB
      const client = await prisma.client.findFirst({
        where: {
          accessToken: { not: null },
          zerodhaApiKey: { not: null }
        }
      });

      if (client && client.zerodhaApiKey && client.accessToken) {
        console.log(`Using database configuration for Client: ${client.zerodhaClientId}`);
        this.connectKiteWebSocket(client.zerodhaApiKey, client.accessToken);
      } else {
        console.log('No Zerodha details found in .env or database. WebSocket ticker standby.');
      }
    } catch (err) {
      console.error('Failed to configure Kite Connect socket feed:', err);
    }
  }

  // Establish connection to Zerodha's wss streaming gateway
  private connectKiteWebSocket(apiKey: string, accessToken: string) {
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) { }
    }

    const wsUrl = `wss://ws.kite.trade?api_key=${apiKey}&access_token=${accessToken}`;
    console.log(`Connecting to Kite streaming endpoint...`);
    this.ws = new WebSocket(wsUrl);

    this.ws.on('open', () => {
      console.log('Kite WebSocket connection established.');
      // Subscribe to all mapped instruments
      const tokens = Object.keys(INSTRUMENT_TO_SYMBOL).map(Number);

      const subMsg = {
        a: 'subscribe',
        v: tokens
      };
      this.ws?.send(JSON.stringify(subMsg));

      const modeMsg = {
        a: 'mode',
        v: ['quote', tokens]
      };
      this.ws?.send(JSON.stringify(modeMsg));
    });

    this.ws.on('message', (data: any) => {
      if (Buffer.isBuffer(data)) {
        this.parseKiteBinaryPacket(data);
      }
    });

    this.ws.on('error', (err: any) => {
      console.error('Kite Socket error:', err);
    });

    this.ws.on('close', () => {
      console.log('Kite Socket disconnected. Reconnecting in 5 seconds...');
      setTimeout(() => {
        this.connectKiteWebSocket(apiKey, accessToken);
      }, 5000);
    });
  }

  // Parse standard 44-byte quote ticking package
  private parseKiteBinaryPacket(buffer: Buffer) {
    if (buffer.length < 4) return;
    try {
      const count = buffer.readUInt16BE(0);
      let offset = 2;

      for (let i = 0; i < count; i++) {
        if (offset + 2 > buffer.length) break;
        const packetLength = buffer.readUInt16BE(offset);
        offset += 2;

        if (offset + packetLength > buffer.length) break;

        if (packetLength === 44 || packetLength === 184) {
          const token = buffer.readUInt32BE(offset);
          const symbol = INSTRUMENT_TO_SYMBOL[token];
          if (symbol) {
            const ltp = buffer.readUInt32BE(offset + 4) / 100;
            const volume = buffer.readUInt32BE(offset + 16);
            const open = buffer.readUInt32BE(offset + 28) / 100;
            const high = buffer.readUInt32BE(offset + 32) / 100;
            const low = buffer.readUInt32BE(offset + 36) / 100;
            const close = buffer.readUInt32BE(offset + 40) / 100;

            this.updateStockFromTick(symbol, ltp, open, high, low, close, volume);
          }
        } else if (packetLength === 8) {
          const token = buffer.readUInt32BE(offset);
          const symbol = INSTRUMENT_TO_SYMBOL[token];
          if (symbol) {
            const ltp = buffer.readUInt32BE(offset + 4) / 100;
            this.updateStockLtp(symbol, ltp);
          }
        }
        offset += packetLength;
      }
    } catch (e) {
      console.error('Kite packet parsing error:', e);
    }
  }

  private async updateStockFromTick(symbol: string, ltp: number, open: number, high: number, low: number, close: number, volume: number) {
    this.lastUpdate[symbol] = Date.now();
    let exists = false;
    this.stocksState = this.stocksState.map(stock => {
      if (stock.symbol === symbol) {
        exists = true;
        const change = parseFloat((ltp - close).toFixed(2));
        const changePercent = close ? parseFloat(((change / close) * 100).toFixed(2)) : 0;
        const ffShares = FREE_FLOAT_SHARES[symbol] || 50.0;
        const volumeVal = volume || stock.volume || Math.round(ffShares * 15000);
        return {
          ...stock,
          ltp,
          open: open || stock.open,
          high: high || stock.high,
          low: low || stock.low,
          prevClose: close || stock.prevClose,
          volume: volumeVal,
          change,
          changePercent,
          iep: ltp,
          final: ltp,
          finalQuantity: volumeVal,
          value: (volumeVal * ltp) / 10000000,
          ffmCap: ltp * ffShares,
          nm52wH: high || stock.nm52wH,
          nm52wL: low || stock.nm52wL
        };
      }
      return stock;
    });

    if (!exists) {
      const name = STOCK_NAMES[symbol] || symbol;
      const change = parseFloat((ltp - close).toFixed(2));
      const changePercent = parseFloat(((change / close) * 100).toFixed(2));
      const ffShares = FREE_FLOAT_SHARES[symbol] || 50.0;
      const volumeVal = volume || Math.round(ffShares * 15000);
      this.stocksState.push({
        symbol,
        name,
        ltp,
        open,
        high,
        low,
        prevClose: close,
        volume: volumeVal,
        change,
        changePercent,
        iep: ltp,
        final: ltp,
        finalQuantity: volumeVal,
        value: (volumeVal * ltp) / 10000000,
        ffmCap: ltp * ffShares,
        nm52wH: high,
        nm52wL: low
      });
    }

    if (this.isTradingActive) {
      await this.monitorTrades();
    }
  }

  private async updateStockLtp(symbol: string, ltp: number) {
    this.lastUpdate[symbol] = Date.now();
    let exists = false;
    this.stocksState = this.stocksState.map(stock => {
      if (stock.symbol === symbol) {
        exists = true;
        const change = parseFloat((ltp - stock.prevClose).toFixed(2));
        const changePercent = stock.prevClose ? parseFloat(((change / stock.prevClose) * 100).toFixed(2)) : 0;
        const ffShares = FREE_FLOAT_SHARES[symbol] || 50.0;
        const volumeVal = stock.volume || Math.round(ffShares * 15000);
        return {
          ...stock,
          ltp,
          change,
          changePercent,
          iep: ltp,
          final: ltp,
          value: (volumeVal * ltp) / 10000000,
          ffmCap: ltp * ffShares
        };
      }
      return stock;
    });

    if (!exists) {
      const name = STOCK_NAMES[symbol] || symbol;
      const ffShares = FREE_FLOAT_SHARES[symbol] || 50.0;
      const volumeVal = Math.round(ffShares * 15000);
      this.stocksState.push({
        symbol,
        name,
        ltp,
        open: ltp,
        high: ltp,
        low: ltp,
        prevClose: ltp,
        volume: volumeVal,
        change: 0,
        changePercent: 0,
        iep: ltp,
        final: ltp,
        finalQuantity: volumeVal,
        value: (volumeVal * ltp) / 10000000,
        ffmCap: ltp * ffShares,
        nm52wH: ltp,
        nm52wL: ltp
      });
    }

    if (this.isTradingActive) {
      await this.monitorTrades();
    }
  }

  public isWsConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  public getStocks(): StockQuote[] {
    return this.stocksState;
  }

  public toggleTrading(status: boolean) {
    this.isTradingActive = status;
  }

  public getTradingStatus(): boolean {
    return this.isTradingActive;
  }

  // Scanner picks Top Losers for strategy selection
  public getScannerResults(): StockQuote[] {
    return [...this.stocksState]
      .sort((a, b) => a.changePercent - b.changePercent);
  }

  // Core execution: Runs Pre-Open scan and initiates trades
  public async executePreOpenTrades(adminId: string) {
    const losers = this.getScannerResults();
    if (losers.length === 0) return;

    const targetStock = losers[0];

    const candleHigh = targetStock.high;

    const entryPrice = parseFloat((candleHigh * 1.001).toFixed(2));
    const stopLoss = parseFloat((entryPrice * 0.995).toFixed(2));
    const target = parseFloat((entryPrice * 1.015).toFixed(2));

    const clients = await prisma.client.findMany({
      where: {
        tradingStatus: 'active',
        subscriptionStatus: 'active',
      },
      include: {
        user: true,
      },
    });

    for (const client of clients) {
      const capital = Number(client.capital);
      const riskAmount = capital * 0.01;
      const perShareRisk = entryPrice - stopLoss;
      const quantity = Math.floor(riskAmount / perShareRisk);

      if (quantity <= 0) continue;

      await prisma.trade.create({
        data: {
          clientId: client.id,
          strategyId: client.strategyId || 'pre-open-breakout',
          symbol: targetStock.symbol,
          orderType: 'MIS',
          entryPrice: entryPrice,
          quantity: quantity,
          stopLoss: stopLoss,
          target: target,
          status: 'open',
          entryTime: new Date(),
        },
      });

      await prisma.auditLog.create({
        data: {
          adminId,
          action: `AUTO_TRADE_EXECUTION: Order placed for ${client.user.name} - ${quantity} shares of ${targetStock.symbol}`,
        },
      });
    }
  }

  // Monitor live orders to execute Target / SL
  private async monitorTrades() {
    const activeTrades = await prisma.trade.findMany({
      where: { status: 'open' },
    });

    for (const trade of activeTrades) {
      const currentQuote = this.stocksState.find(s => s.symbol === trade.symbol);
      if (!currentQuote) continue;

      const entry = Number(trade.entryPrice);
      const sl = Number(trade.stopLoss);
      const target = Number(trade.target);
      const qty = trade.quantity;
      const currentPrice = currentQuote.ltp;

      let status = 'open';
      let exitPrice = null;
      let pnl = null;

      if (currentPrice >= target) {
        status = 'closed';
        exitPrice = target;
        pnl = (target - entry) * qty;
      } else if (currentPrice <= sl) {
        status = 'closed';
        exitPrice = sl;
        pnl = (sl - entry) * qty;
      }

      if (status === 'closed' && exitPrice !== null) {
        await prisma.trade.update({
          where: { id: trade.id },
          data: {
            status,
            exitPrice,
            pnl,
            exitTime: new Date(),
          },
        });
      }
    }
  }
}

const globalForAlgo = global as unknown as { algoEngine: AlgoEngineService };
export const algoEngine = globalForAlgo.algoEngine || new AlgoEngineService();
if (process.env.NODE_ENV !== 'production') globalForAlgo.algoEngine = algoEngine;
