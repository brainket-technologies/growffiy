import { prisma } from '../lib/db';
import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';

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

const uniqueSymbols = Array.from(new Set(Object.values(INSTRUMENT_TO_SYMBOL)));

function getInitialStocks(): StockQuote[] {
  return uniqueSymbols.map(symbol => {
    const name = STOCK_NAMES[symbol] || symbol;
    const ffShares = 50.0;
    const basePrice = 100.0;
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
}

class AlgoEngineService {
  private stocksState: StockQuote[] = [];
  private isTradingActive: boolean = false;
  private ws: WebSocket | null = null;
  private lastUpdate: { [symbol: string]: number } = {};
  
  // Kite credentials for live API fetches
  private activeApiKey: string | null = null;
  private activeAccessToken: string | null = null;

  // In-memory pre-open cache
  private preOpenCache: StockQuote[] = [];
  private lastPreOpenFetchTime: number = 0;

  constructor() {
    this.stocksState = getInitialStocks();
    this.preOpenCache = [...this.stocksState];
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
    this.activeApiKey = apiKey;
    this.activeAccessToken = accessToken;

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
    const actualQuotes = getActualQuotes();
    let exists = false;
    this.stocksState = this.stocksState.map(stock => {
      if (stock.symbol === symbol) {
        exists = true;
        const change = parseFloat((ltp - close).toFixed(2));
        const changePercent = close ? parseFloat(((change / close) * 100).toFixed(2)) : 0;
        const ffShares = (actualQuotes as any)[symbol]?.freeFloatShares || 50.0;
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
      const ffShares = (actualQuotes as any)[symbol]?.freeFloatShares || 50.0;
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
    const actualQuotes = getActualQuotes();
    let exists = false;
    this.stocksState = this.stocksState.map(stock => {
      if (stock.symbol === symbol) {
        exists = true;
        const change = parseFloat((ltp - stock.prevClose).toFixed(2));
        const changePercent = stock.prevClose ? parseFloat(((change / stock.prevClose) * 100).toFixed(2)) : 0;
        const ffShares = (actualQuotes as any)[symbol]?.freeFloatShares || 50.0;
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
      const ffShares = (actualQuotes as any)[symbol]?.freeFloatShares || 50.0;
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

  private async getActiveCredentials() {
    if (this.activeApiKey && this.activeAccessToken) {
      return { apiKey: this.activeApiKey, accessToken: this.activeAccessToken };
    }
    const envApiKey = process.env.ZERODHA_API_KEY || process.env.KITE_API_KEY;
    const envAccessToken = process.env.ZERODHA_ACCESS_TOKEN || process.env.KITE_ACCESS_TOKEN;
    if (envApiKey && envAccessToken) {
      this.activeApiKey = envApiKey;
      this.activeAccessToken = envAccessToken;
      return { apiKey: envApiKey, accessToken: envAccessToken };
    }
    const client = await prisma.client.findFirst({
      where: {
        accessToken: { not: null },
        zerodhaApiKey: { not: null }
      }
    });
    if (client && client.zerodhaApiKey && client.accessToken) {
      this.activeApiKey = client.zerodhaApiKey;
      this.activeAccessToken = client.accessToken;
      return { apiKey: client.zerodhaApiKey, accessToken: client.accessToken };
    }
    return null;
  }

  public async fetchLivePreOpenFromKite(): Promise<StockQuote[]> {
    const creds = await this.getActiveCredentials();
    if (!creds) {
      console.log('No active Zerodha credentials found for live pre-open fetch. Using in-memory cache.');
      return this.preOpenCache.length > 0 ? this.preOpenCache : getInitialStocks();
    }

    try {
      const symbols = uniqueSymbols.map(s => `NSE:${s}`);
      const chunkSize = 50;
      const quotes: any = {};

      for (let i = 0; i < symbols.length; i += chunkSize) {
        const chunk = symbols.slice(i, i + chunkSize);
        const query = chunk.join('&i=');
        const url = `https://api.kite.trade/quote?i=${query}`;

        const res = await fetch(url, {
          headers: {
            'X-Kite-Version': '3',
            'Authorization': `token ${creds.apiKey}:${creds.accessToken}`
          }
        });

        const data = await res.json();
        if (data.status === 'success') {
          Object.assign(quotes, data.data);
        } else {
          console.error("Failed to fetch pre-open quotes chunk:", data.message);
        }
      }

      const freshStocks: StockQuote[] = uniqueSymbols.map(symbol => {
        const name = STOCK_NAMES[symbol] || symbol;
        const key = `NSE:${symbol}`;
        const quote = quotes[key];
        const ffShares = 50.0;

        if (quote) {
          const prevClose = quote.ohlc.close || 100.0;
          // In pre-open session, the indicative equilibrium price is ohlc.open
          const iep = quote.ohlc.open || prevClose;
          const change = parseFloat((iep - prevClose).toFixed(2));
          const changePercent = prevClose ? parseFloat(((change / prevClose) * 100).toFixed(2)) : 0;
          const ltp = iep;
          const open = iep;
          const high = quote.ohlc.high || iep;
          const low = quote.ohlc.low || iep;
          const volume = quote.volume || Math.round(ffShares * 15000);
          const ffmCap = ltp * ffShares;
          const value = (volume * ltp) / 10000000;

          return {
            symbol,
            name,
            ltp,
            open,
            high,
            low,
            prevClose,
            volume,
            change,
            changePercent,
            iep,
            final: ltp,
            finalQuantity: volume,
            value,
            ffmCap,
            nm52wH: parseFloat((prevClose * 1.25).toFixed(2)),
            nm52wL: parseFloat((prevClose * 0.75).toFixed(2))
          };
        } else {
          // Fallback to static if not found in live response
          const basePrice = 100.0;
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
        }
      });

      this.preOpenCache = freshStocks;
      this.lastPreOpenFetchTime = Date.now();
      return freshStocks;
    } catch (err) {
      console.error('Error fetching live pre-open quotes from Kite:', err);
      return this.preOpenCache.length > 0 ? this.preOpenCache : getInitialStocks();
    }
  }

  public async getPreOpenStocks(): Promise<StockQuote[]> {
    if (this.preOpenCache.length === 0 || Date.now() - this.lastPreOpenFetchTime > 5 * 60 * 1000) {
      await this.fetchLivePreOpenFromKite();
    }
    return this.preOpenCache;
  }

  public getPreOpenDate(): string {
    return new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
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
