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

const INITIAL_STOCKS: StockQuote[] = [];

const INSTRUMENT_TO_SYMBOL: { [key: number]: string } = {
  341249: 'ASHOKLEY',
  3814401: 'HINDPETRO',
  897537: 'TATASTEEL',
  784129: 'VEDL',
  5633: 'HINDZINC',
  341201: 'RVNL',
  232961: 'YESBANK',
  857857: 'MOTILALOFS',
  340097: 'PNB',
  10763: 'CANBK',
  34057: 'ZEEL',
  10762: 'GMRINFRA',
  10761: 'SAIL',
  341233: 'NATIONALUM',
  341235: 'NMDC',
  878577: 'TATAPOWER',
  897539: 'PFC',
  897541: 'RECLTD',
  897543: 'BHEL',
  897545: 'GAIL',
  897547: 'ONGC',
  897549: 'COALINDIA',
  897551: 'BEL',
  897553: 'WIPRO',
  340101: 'HDFCBANK',
  1270503: 'ICICIBANK',
  340103: 'SBIN',
  738561: 'RELIANCE',
  340105: 'TCS',
  340107: 'INFY',
  340109: 'AXISBANK',
  340111: 'KOTAKBANK',
  340113: 'TATAMOTORS',
  340115: 'BAJFINANCE',
  340117: 'BHARTIARTL',
  340119: 'ITC',
  340121: 'HINDUNILVR',
  340123: 'LT',
  340125: 'SUNPHARMA',
  340127: 'NTPC',
  340129: 'MARUTI',
  340131: 'JSWSTEEL',
  340133: 'APOLLOTYRE',
  340135: 'BIOCON',
  340137: 'BANDHANBNK',
  340139: 'DLF',
  340141: 'GLENMARK',
  340143: 'METROPOLIS',
  340145: 'SUNTV',
  340147: 'JUBLFOOD',
  340149: 'ESCORTS',
  340151: 'IDEA',
  340153: 'AMBUJACEM',
  340155: 'ACC',
  340157: 'ADANIENT',
  340159: 'ADANIPORTS',
  340161: 'AUROPHARMA',
  340163: 'BALRAMCHIN',
  340165: 'BATAINDIA',
  340167: 'BERGEPAINT',
  340169: 'BHARATFORG',
  340171: 'BOSCHLTD',
  340173: 'CHAMBLFERT',
  340175: 'CHOLAFIN',
  340177: 'COFORGE',
  340179: 'CONCOR',
  340181: 'COROMANDEL',
  340183: 'CUMMINSIND',
  340185: 'DABUR',
  340187: 'DEEPAKNTR',
  340189: 'DELTACORP',
  340191: 'EXIDEIND',
  340193: 'FEDERALBNK',
  340195: 'GODREJCP',
  340197: 'GODREJPROP',
  340199: 'HAL',
  340201: 'HAVELLS',
  340203: 'IBULHSGFIN',
  340205: 'INDHOTEL',
  340207: 'IOC',
  340209: 'IPCALAB',
  340211: 'JSWENERGY',
  340213: 'L&TFH',
  340215: 'LICHSGFIN',
  340217: 'LTIM',
  340219: 'LUPIN',
  340221: 'MANAPPURAM',
  340223: 'MGL',
  340225: 'MPHASIS',
  340227: 'MRF',
  340229: 'MUTHOOTFIN',
  340231: 'PEL',
  340233: 'PETRONET',
  340235: 'PIDILITIND',
  340237: 'POLYCAB',
  340239: 'POWERGRID',
  340241: 'RAMCOCEM',
  340243: 'SRF',
  340245: 'TATACHEM',
  340247: 'TATACOMM',
  340249: 'TCSC',
  340251: 'TECHM',
  340253: 'TRENT',
  340255: 'TVSTRUCT',
  340257: 'UBL',
  340259: 'ULTRACEMCO',
  340261: 'VOLTAS',
  340263: 'WHIRLPOOL'
};

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
        const changePercent = parseFloat(((change / close) * 100).toFixed(2));
        return {
          ...stock,
          ltp,
          open,
          high,
          low,
          prevClose: close,
          volume: volume || stock.volume,
          change,
          changePercent,
          iep: ltp,
          final: ltp,
          finalQuantity: volume || stock.finalQuantity
        };
      }
      return stock;
    });

    if (!exists) {
      const name = STOCK_NAMES[symbol] || symbol;
      const change = parseFloat((ltp - close).toFixed(2));
      const changePercent = parseFloat(((change / close) * 100).toFixed(2));
      this.stocksState.push({
        symbol,
        name,
        ltp,
        open,
        high,
        low,
        prevClose: close,
        volume: volume || 0,
        change,
        changePercent,
        iep: ltp,
        final: ltp,
        finalQuantity: volume || 0,
        value: ((volume || 0) * ltp) / 10000000,
        ffmCap: (close * (volume || 0)) / 10000000,
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
        const changePercent = parseFloat(((change / stock.prevClose) * 100).toFixed(2));
        return {
          ...stock,
          ltp,
          change,
          changePercent,
          iep: ltp,
          final: ltp
        };
      }
      return stock;
    });

    if (!exists) {
      const name = STOCK_NAMES[symbol] || symbol;
      this.stocksState.push({
        symbol,
        name,
        ltp,
        open: ltp,
        high: ltp,
        low: ltp,
        prevClose: ltp,
        volume: 0,
        change: 0,
        changePercent: 0,
        iep: ltp,
        final: ltp,
        finalQuantity: 0,
        value: 0,
        ffmCap: 0,
        nm52wH: ltp,
        nm52wL: ltp
      });
    }

    if (this.isTradingActive) {
      await this.monitorTrades();
    }
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
