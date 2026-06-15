import { prisma } from '../lib/db';
import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';
import { API_ENDPOINTS } from '../lib/constants';
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

function getInitialStocks(): StockQuote[] {
  return [];
}

class AlgoEngineService {
  private stocksState: StockQuote[] = [];
  private isTradingActive: boolean = false;
  private ws: WebSocket | null = null;
  private lastUpdate: { [symbol: string]: number } = {};
  
  // Kite credentials for live API fetches
  private activeApiKey: string | null = null;
  private activeAccessToken: string | null = null;

  // Dynamic instrument token mapping
  private instrumentToSymbol: { [key: number]: string } = {};
  private symbolToName: { [symbol: string]: string } = {};

  // In-memory pre-open cache
  private preOpenCache: StockQuote[] = [];
  private lastPreOpenFetchTime: number = 0;
  private preOpenCacheDate: string = '';

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

  private async ensureInstrumentMapping() {
    if (Object.keys(this.instrumentToSymbol).length > 0) {
      return;
    }
    try {
      console.log('Fetching live instrument list from Zerodha Kite...');
      const res = await fetch('https://api.kite.trade/instruments/NSE');
      if (!res.ok) throw new Error(`Kite instruments API returned status ${res.status}`);
      const text = await res.text();
      const lines = text.split('\n');
      const instMap: { [key: number]: string } = {};
      const nameMap: { [symbol: string]: string } = {};
      
      for (const line of lines) {
        const parts = line.split(',');
        if (parts.length >= 4) {
          const token = parseInt(parts[0], 10);
          const symbol = parts[2].trim().replace(/"/g, '');
          const name = parts[3].trim().replace(/"/g, '');
          if (!isNaN(token) && symbol) {
            instMap[token] = symbol;
            if (name) {
              nameMap[symbol] = name;
            }
          }
        }
      }
      this.instrumentToSymbol = instMap;
      this.symbolToName = nameMap;
      console.log(`Successfully mapped ${Object.keys(this.instrumentToSymbol).length} Zerodha NSE instrument tokens dynamically.`);
    } catch (e) {
      console.error('Failed to load dynamic Zerodha instrument mapping:', e);
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

    this.ws.on('open', async () => {
      console.log('Kite WebSocket connection established.');
      
      // Load instrument mapping dynamically
      await this.ensureInstrumentMapping();
      
      // Get the symbols in our current pre-open cache or state
      let symbols = this.preOpenCache.map(s => s.symbol);
      if (symbols.length === 0) {
        const dbData = await getPreOpenQuotesFromDb();
        if (dbData && dbData.quotes.length > 0) {
          symbols = dbData.quotes.map(s => s.symbol);
        }
      }
      
      const tokens: number[] = [];
      for (const [tokenStr, sym] of Object.entries(this.instrumentToSymbol)) {
        if (symbols.includes(sym)) {
          tokens.push(Number(tokenStr));
        }
      }
      
      if (tokens.length === 0) {
        console.warn('No instrument tokens found for active symbols. WebSocket subscription standby.');
        return;
      }

      console.log(`Subscribing to ${tokens.length} live stock tokens on Kite WebSocket.`);
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
          const symbol = this.instrumentToSymbol[token];
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
          const symbol = this.instrumentToSymbol[token];
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
        const ffShares = 50.0;
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
      const name = this.symbolToName[symbol] || symbol;
      const change = parseFloat((ltp - close).toFixed(2));
      const changePercent = parseFloat(((change / close) * 100).toFixed(2));
      const ffShares = 50.0;
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
        const ffShares = 50.0;
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
      const name = this.symbolToName[symbol] || symbol;
      const ffShares = 50.0;
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

  public async fetchLivePreOpenFromNSE(): Promise<StockQuote[]> {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': API_ENDPOINTS.NSE_REFERER,
    };

    try {
      console.log('Initiating pre-open fetch from official NSE India API...');
      // 1. Visit home page to generate cookie session
      const homeRes = await fetch(API_ENDPOINTS.NSE_HOME, { headers });
      const rawCookies = homeRes.headers.get('set-cookie') || '';
      const cookies = rawCookies.split(',').map(c => c.split(';')[0]).join('; ');

      // 2. Query the pre-open endpoint using the cookies
      const dataRes = await fetch(API_ENDPOINTS.NSE_PRE_OPEN, {
        headers: {
          ...headers,
          'Cookie': cookies,
        }
      });

      if (!dataRes.ok) {
        throw new Error(`NSE API responded with status ${dataRes.status}`);
      }

      const nseJson = await dataRes.json();
      if (!nseJson || !Array.isArray(nseJson.data)) {
        throw new Error('Invalid JSON format from NSE Pre-Open API');
      }

      console.log(`Successfully retrieved ${nseJson.data.length} pre-open quotes from NSE.`);

      const freshStocks: StockQuote[] = nseJson.data
        .filter((nseItem: any) => nseItem.metadata && nseItem.metadata.symbol)
        .map((nseItem: any) => {
          const symbol = nseItem.metadata.symbol;
          const name = nseItem.metadata.companyName || symbol;
          const prevClose = nseItem.metadata.prevClose || 100.0;
          const iep = nseItem.metadata.lastPrice || nseItem.metadata.iep || prevClose;
          const change = nseItem.metadata.change || 0;
          const changePercent = nseItem.metadata.pChange || 0;
          const ltp = iep;
          const open = iep;
          const high = nseItem.metadata.high || iep;
          const low = nseItem.metadata.low || iep;
          const volume = nseItem.detail?.quantity || nseItem.metadata.quantity || 0;
          const ffmCap = ltp * 50.0;
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
        });

      const dateStr = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      this.preOpenCache = freshStocks;
      this.preOpenCacheDate = dateStr;
      this.lastPreOpenFetchTime = Date.now();

      await savePreOpenQuotesToDb(freshStocks, dateStr);
      return freshStocks;
    } catch (err) {
      console.error('NSE API pre-open fetch failed, falling back to Kite API:', err);
      return await this.fetchLivePreOpenFromKite();
    }
  }

  public async fetchLivePreOpenFromKite(): Promise<StockQuote[]> {
    const creds = await this.getActiveCredentials();
    if (!creds) {
      console.log('No active Zerodha credentials found for live pre-open fetch. Using in-memory cache.');
      return this.preOpenCache.length > 0 ? this.preOpenCache : getInitialStocks();
    }

    try {
      await this.ensureInstrumentMapping();
      let targetSymbols = this.preOpenCache.map(s => s.symbol);
      if (targetSymbols.length === 0) {
        const dbData = await getPreOpenQuotesFromDb();
        if (dbData && dbData.quotes.length > 0) {
          targetSymbols = dbData.quotes.map(s => s.symbol);
        }
      }
      if (targetSymbols.length === 0) {
        targetSymbols = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'LT', 'ITC'];
      }

      const symbols = targetSymbols.map(s => `NSE:${s}`);
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

      const freshStocks: StockQuote[] = targetSymbols.map(symbol => {
        const name = this.symbolToName[symbol] || symbol;
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
          // Fallback to mock defaults if not found in live response
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

      const dateStr = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      this.preOpenCache = freshStocks;
      this.preOpenCacheDate = dateStr;
      this.lastPreOpenFetchTime = Date.now();

      // Save to shared database settings table for serverless persistence
      await savePreOpenQuotesToDb(freshStocks, dateStr);

      return freshStocks;
    } catch (err) {
      console.error('Error fetching live pre-open quotes from Kite:', err);
      // Fallback to shared database cache
      const dbData = await getPreOpenQuotesFromDb();
      if (dbData) {
        this.preOpenCache = dbData.quotes;
        this.preOpenCacheDate = dbData.date;
      }
      return this.preOpenCache;
    }
  }

  public async getPreOpenStocks(): Promise<StockQuote[]> {
    // If memory cache is empty, load from database first (for serverless instances)
    if (this.preOpenCache.length === 0 || this.preOpenCache[0]?.ltp === 100.0) {
      const dbData = await getPreOpenQuotesFromDb();
      if (dbData) {
        this.preOpenCache = dbData.quotes;
        this.preOpenCacheDate = dbData.date;
        // set last fetch time to avoid instant refetch
        this.lastPreOpenFetchTime = Date.now();
      }
    }

    if (this.preOpenCache.length === 0 || Date.now() - this.lastPreOpenFetchTime > 5 * 60 * 1000) {
      await this.fetchLivePreOpenFromKite();
    }
    return this.preOpenCache;
  }

  public getPreOpenDate(): string {
    return this.preOpenCacheDate || new Date().toLocaleDateString('en-GB', {
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


async function savePreOpenQuotesToDb(quotes: StockQuote[], date: string) {
  try {
    await prisma.appSettings.upsert({
      where: { settingKey: 'PRE_OPEN_QUOTES_DATA' },
      update: { settingValue: JSON.stringify({ quotes, date }) },
      create: { settingKey: 'PRE_OPEN_QUOTES_DATA', settingValue: JSON.stringify({ quotes, date }), type: 'json' }
    });
  } catch (error) {
    console.error('Failed to save pre-open quotes to appSettings:', error);
  }
}

async function getPreOpenQuotesFromDb(): Promise<{ quotes: StockQuote[], date: string } | null> {
  try {
    const setting = await prisma.appSettings.findUnique({
      where: { settingKey: 'PRE_OPEN_QUOTES_DATA' }
    });
    if (setting) {
      return JSON.parse(setting.settingValue);
    }
  } catch (error) {
    console.error('Failed to get pre-open quotes from appSettings:', error);
  }
  return null;
}

const globalForAlgo = global as unknown as { algoEngine: AlgoEngineService };
export const algoEngine = globalForAlgo.algoEngine || new AlgoEngineService();
if (process.env.NODE_ENV !== 'production') globalForAlgo.algoEngine = algoEngine;
