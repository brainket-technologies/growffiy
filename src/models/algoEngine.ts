import dotenv from 'dotenv';
import path from 'path';

// Force load .env from multiple potential directory contexts
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../../../.env') });

import WebSocket from 'ws';
import { prisma } from '../lib/db';
import { API_ENDPOINTS } from '../lib/constants';
import { KiteClient } from '../lib/kite';
import { performKiteAutoLogin } from '../lib/kiteAutoLogin';



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
  value: number; // in Crores
  ffmCap: number; // in Crores
  nm52wH: number;
  nm52wL: number;
  // Dynamic Index Tagging
  isNifty50?: boolean;
  isBankNifty?: boolean;
  isFo?: boolean;
  isSme?: boolean;
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
    this.initializeKiteLiveFeed();
    this.startDailyTokenRefreshScheduler();
    this.startDailyPreOpenStrategyScheduler();
    this.startActiveTradesMonitoringScheduler();
  }

  private async getAlgoSetting(key: string, defaultValue: string): Promise<string> {
    try {
      const setting = await prisma.appSettings.findUnique({ where: { settingKey: key } });
      return setting?.settingValue || defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private startDailyPreOpenStrategyScheduler() {
    console.log('AlgoEngine: Initialized Daily Pre-Open Strategy Execution Scheduler');
    
    if ((global as any).preOpenStrategyInterval) {
      clearInterval((global as any).preOpenStrategyInterval);
    }

    let lastExecutedDate = '';
    let lastFetchedDate = '';
    let cachedFetchTime = '09:08';
    let cachedEntryTime = '09:20';

    const checkAndExecute = async () => {
      try {
        cachedFetchTime = await this.getAlgoSetting('algo_preopen_fetch_time', '09:08');
        cachedEntryTime = await this.getAlgoSetting('algo_entry_time', '09:20');

        const istDateStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
        const istDate = new Date(istDateStr);
        const hours = istDate.getHours();
        const minutes = istDate.getMinutes();
        const currentDateKey = istDate.toLocaleDateString();
        const currentTimeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

        // Stage 1: Fetch and cache NSE pre-open data
        if (currentTimeStr === cachedFetchTime && lastFetchedDate !== currentDateKey) {
          console.log(`AlgoEngine Scheduler: Pre-open fetch time ${cachedFetchTime} reached. Fetching NSE pre-open data...`);
          lastFetchedDate = currentDateKey;
          await this.getPreOpenStocks();
        }

        // Stage 2: Execute trades at entry time
        if (currentTimeStr === cachedEntryTime && lastExecutedDate !== currentDateKey) {
          console.log(`AlgoEngine Scheduler: Entry time ${cachedEntryTime} reached. Starting daily strategy execution...`);
          lastExecutedDate = currentDateKey;

          const firstAdmin = await prisma.user.findFirst({
            where: { role: 'admin' }
          });
          const adminId = firstAdmin ? firstAdmin.id : 'system-scheduler';

          await this.executePreOpenTrades(adminId);
        }
      } catch (err) {
        console.error('AlgoEngine Scheduler: Error in Pre-Open Strategy cron interval execution:', err);
      }
    };

    (global as any).preOpenStrategyInterval = setInterval(checkAndExecute, 60 * 1000);
  }

  private startDailyTokenRefreshScheduler() {
    console.log('AlgoEngine: Initialized Daily Token Refresh Scheduler');
    
    if ((global as any).tokenRefreshInterval) {
      clearInterval((global as any).tokenRefreshInterval);
    }

    let lastRefreshedDate = '';
    let cachedRefreshTime = '08:00';

    const checkAndRefresh = async () => {
      try {
        if (process.env.KITE_AUTO_LOGIN_ENABLED !== 'true') {
          return;
        }

        cachedRefreshTime = await this.getAlgoSetting('algo_token_refresh_time', '08:00');

        const istDateStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
        const istDate = new Date(istDateStr);
        const hours = istDate.getHours();
        const minutes = istDate.getMinutes();
        const currentDateKey = istDate.toLocaleDateString();
        const currentTimeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

        if (currentTimeStr === cachedRefreshTime && lastRefreshedDate !== currentDateKey) {
          console.log(`AlgoEngine Scheduler: Token refresh time ${cachedRefreshTime} reached. Starting daily token refresh...`);
          lastRefreshedDate = currentDateKey;

          const clients = await prisma.client.findMany({
            where: {
              tradingStatus: 'active',
              subscriptionStatus: 'active',
              zerodhaPassword: { not: null },
              zerodhaTotpSecret: { not: null },
              zerodhaClientId: { not: null }
            },
            include: { user: true }
          });

          console.log(`AlgoEngine Scheduler: Found ${clients.length} clients to auto-login.`);

          for (const client of clients) {
            try {
              console.log(`AlgoEngine Scheduler: Auto-logging in client ${client.user.name} (${client.zerodhaClientId})...`);
              const loginRes = await performKiteAutoLogin(client.id);
              console.log(`AlgoEngine Scheduler: Auto-login result for ${client.user.name}:`, loginRes.success);
            } catch (err: any) {
              console.error(`AlgoEngine Scheduler: Error auto-logging in client ${client.user.name}:`, err);
            }
          }
        }
      } catch (err) {
        console.error('AlgoEngine Scheduler: Error in cron interval execution:', err);
      }
    };

    // Run check every 60 seconds
    (global as any).tokenRefreshInterval = setInterval(checkAndRefresh, 60 * 1000);
  }

  private startActiveTradesMonitoringScheduler() {
    console.log('AlgoEngine: Initialized Active Trades Exit Monitoring Scheduler (running SL/Target checks every 1 minute on 5m candle)');

    if ((global as any).activeTradesMonitoringInterval) {
      clearInterval((global as any).activeTradesMonitoringInterval);
    }

    const checkOpenTradesExits = async () => {
      try {
        const openTrades = await prisma.trade.findMany({
          where: { status: 'open' },
          include: {
            client: { include: { user: true } },
            strategy: true
          }
        });

        if (openTrades.length === 0) {
          return;
        }

        console.log(`AlgoEngine Monitor: Checking exit conditions for ${openTrades.length} open trade(s)...`);

        for (const trade of openTrades) {
          try {
            const client = trade.client;
            const strategy = trade.strategy;

            if (!client.zerodhaApiKey || !client.accessToken) {
              console.warn(`AlgoEngine Monitor: Skipping trade ${trade.id} - missing client API key or access token.`);
              continue;
            }

            // Find the instrument token from instrumentToSymbol mapping
            const instrumentTokenStr = Object.entries(this.instrumentToSymbol).find(([token, sym]) => sym === trade.symbol)?.[0];
            if (!instrumentTokenStr) {
              console.warn(`AlgoEngine Monitor: Skipping trade ${trade.id} - could not find instrument token for symbol ${trade.symbol}.`);
              continue;
            }

            const today = new Date();
            const formatKiteDate = (date: Date) => {
              const y = date.getFullYear();
              const m = String(date.getMonth() + 1).padStart(2, '0');
              const d = String(date.getDate()).padStart(2, '0');
              return `${y}-${m}-${d}`;
            };
            const fromDateStr = formatKiteDate(new Date(today.getTime() - 24 * 60 * 60 * 1000));
            const toDateStr = formatKiteDate(today);

            // Parse configuration
            const config = strategy.configJson ? JSON.parse(strategy.configJson) : null;
            const slPercent = config?.stoploss?.fixedPercent || 0.5;
            const targetPercent = config?.target?.profitPercent || 2.0;

            // Determine timeframe dynamically from config, default to 5minute
            let intervalParam = '5minute';
            const tf = config?.basicInfo?.timeframe;
            if (tf === '1m' || tf === '1minute' || tf === 'minute') intervalParam = 'minute';
            else if (tf === '3m' || tf === '3minute') intervalParam = '3minute';
            else if (tf === '5m' || tf === '5minute') intervalParam = '5minute';
            else if (tf === '10m' || tf === '10minute') intervalParam = '10minute';
            else if (tf === '15m' || tf === '15minute') intervalParam = '15minute';
            else if (tf === '30m' || tf === '30minute') intervalParam = '30minute';
            else if (tf === '60m' || tf === '60minute' || tf === 'hour') intervalParam = '60minute';
            else if (tf === '1d' || tf === 'day') intervalParam = 'day';

            const res = await KiteClient.getHistoricalData(
              client.zerodhaApiKey,
              client.accessToken,
              instrumentTokenStr,
              intervalParam,
              fromDateStr,
              toDateStr
            );

            if (res.status !== 'success' || !Array.isArray(res.data?.candles)) {
              console.warn(`AlgoEngine Monitor: Failed to fetch candles for ${trade.symbol}:`, res.message);
              continue;
            }

            const candles = res.data.candles;
            if (candles.length === 0) {
              continue;
            }

            const latestCandle = candles[candles.length - 1];
            const currentClosePrice = Number(latestCandle[4]);

            // Calculate SL and Target based on DB configuration
            const entryPrice = Number(trade.entryPrice);
            const stopLossLevel = entryPrice * (1 - slPercent / 100);
            const targetLevel = entryPrice * (1 + targetPercent / 100);

            console.log(`AlgoEngine Monitor: Trade ${trade.id} (${trade.symbol}) | Entry: ₹${entryPrice.toFixed(2)} | Current: ₹${currentClosePrice.toFixed(2)} | SL: ₹${stopLossLevel.toFixed(2)} | Target: ₹${targetLevel.toFixed(2)}`);

            let exitTriggered = false;
            let exitPrice = currentClosePrice;
            let exitReason = '';

            if (currentClosePrice <= stopLossLevel) {
              exitTriggered = true;
              exitPrice = stopLossLevel;
              exitReason = `Stop Loss (${slPercent}%) hit`;
            } else if (currentClosePrice >= targetLevel) {
              exitTriggered = true;
              exitPrice = targetLevel;
              exitReason = `Target (${targetPercent}%) hit`;
            }

            if (exitTriggered) {
              console.log(`AlgoEngine Monitor: EXIT TRIGGERED for trade ${trade.id} (${trade.symbol}) due to ${exitReason} at ₹${exitPrice.toFixed(2)}.`);

              const exchangeParam = config?.basicInfo?.exchange || 'NSE';
              const sellParams = {
                exchange: exchangeParam,
                tradingsymbol: trade.symbol,
                transaction_type: 'SELL' as const,
                quantity: trade.quantity,
                order_type: 'MARKET' as const,
                product: trade.orderType as any,
                validity: 'DAY' as const
              };

              const sellRes = await KiteClient.placeOrder(
                client.zerodhaApiKey,
                client.accessToken,
                sellParams
              );

              if (sellRes && sellRes.status === 'success') {
                const sellOrderId = sellRes.data?.order_id || 'manual-exit';
                const pnlValue = (exitPrice - entryPrice) * trade.quantity;

                await prisma.trade.update({
                  where: { id: trade.id },
                  data: {
                    status: 'closed',
                    exitPrice: exitPrice,
                    exitTime: new Date(),
                    pnl: pnlValue,
                    kiteResponse: sellRes
                  }
                });

                await prisma.strategyLog.create({
                  data: {
                    strategyId: strategy.id,
                    message: `Intraday Trade Closed for ${client.user.name}: Sold ${trade.quantity} shares of ${trade.symbol} at exit price ₹${exitPrice.toFixed(2)} due to ${exitReason}. Total P&L: ₹${pnlValue.toFixed(2)}. Order ID: ${sellOrderId}`,
                    logType: 'trade'
                  }
                });

                await prisma.auditLog.create({
                  data: {
                    adminId: 'system-scheduler',
                    action: 'AUTO TRADE CLOSED',
                    oldValue: `Trade ID: ${trade.id}`,
                    newValue: `Sold ${trade.quantity} shares of ${trade.symbol} @ ₹${exitPrice.toFixed(2)} | P&L: ₹${pnlValue.toFixed(2)}`
                  }
                }).catch(() => {});
              } else {
                console.error(`AlgoEngine Monitor: Failed to place sell order for ${trade.symbol}:`, sellRes.message);
                await prisma.strategyLog.create({
                  data: {
                    strategyId: strategy.id,
                    message: `Failed to place exit order for ${client.user.name} (${trade.symbol}): ${sellRes.message || 'Unknown Zerodha error'}`,
                    logType: 'error'
                  }
                });
              }
            }
          } catch (tradeErr: any) {
            console.error(`AlgoEngine Monitor: Error processing trade ${trade.id}:`, tradeErr);
          }
        }
      } catch (err) {
        console.error('AlgoEngine Monitor: Error in open trades monitoring cron loop:', err);
      }
    };

    (global as any).activeTradesMonitoringInterval = setInterval(checkOpenTradesExits, 60 * 1000);
  }

  // Initialize Kite Live Socket feed from Environment variables or Database
  public async initializeKiteLiveFeed() {
    try {
      const envApiKey = process.env.ZERODHA_API_KEY || process.env.KITE_API_KEY;
      const envAccessToken = process.env.ZERODHA_ACCESS_TOKEN || process.env.KITE_ACCESS_TOKEN;

      if (envApiKey && envAccessToken) {
        console.log('Using master Zerodha credentials configured in .env variables');
        this.connectKiteWebSocket(envApiKey, envAccessToken);
        return;
      }

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
      const res = await fetch(API_ENDPOINTS.KITE_INSTRUMENTS);
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
      
      await this.ensureInstrumentMapping();
      
      // Seed stocksState from preOpenCache if empty
      if (this.stocksState.length === 0 && this.preOpenCache.length > 0) {
        this.stocksState = [...this.preOpenCache];
      }

      // Get the symbols in our current pre-open cache or state
      let symbols = this.preOpenCache.map(s => s.symbol);
      if (symbols.length === 0) {
        symbols = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'LT', 'ITC'];
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

  public isWsConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  public getStocks(): StockQuote[] {
    // If stocksState is empty, seed it with the current pre-open cache
    if (this.stocksState.length === 0 && this.preOpenCache.length > 0) {
      this.stocksState = [...this.preOpenCache];
    }
    return this.stocksState;
  }

  public async toggleTrading(status: boolean): Promise<void> {
    this.isTradingActive = status;
    try {
      await prisma.appSettings.upsert({
        where: { settingKey: 'isTradingActive' },
        update: { settingValue: String(status) },
        create: { settingKey: 'isTradingActive', settingValue: String(status), type: 'boolean' }
      });
    } catch (e) {
      console.error('Failed to save trading status to DB:', e);
    }
  }

  public async getTradingStatus(): Promise<boolean> {
    try {
      const setting = await prisma.appSettings.findUnique({
        where: { settingKey: 'isTradingActive' }
      });
      if (setting) {
        this.isTradingActive = setting.settingValue === 'true';
      }
    } catch (e) {
      console.error('Failed to load trading status from DB:', e);
    }
    return this.isTradingActive;
  }

  private async ensureApiKeyAndToken() {
    return this.getActiveCredentials();
  }

  public async executePreOpenTrades(adminId: string, mockStocks?: StockQuote[]): Promise<void> {
    console.log('AlgoEngine: executePreOpenTrades started.');
    try {
      // 1. Fetch pre-open stocks
      const preOpenStocks = mockStocks && mockStocks.length > 0 
        ? mockStocks 
        : await this.getPreOpenStocks();
        
      if (!preOpenStocks || preOpenStocks.length === 0) {
        console.log('AlgoEngine: No pre-open stocks fetched. Aborting.');
        return;
      }

      // 2. Find active clients assigned to a strategy with an active subscription
      const clients = await prisma.client.findMany({
        where: {
          tradingStatus: 'active',
          subscriptionStatus: 'active',
          strategyId: { not: null }
        },
        include: {
          user: true,
          strategy: true
        }
      });

      if (clients.length === 0) {
        console.log('AlgoEngine: No active clients assigned to any strategy.');
        return;
      }

      console.log(`AlgoEngine: Processing strategies for ${clients.length} active client(s).`);

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // Find an admin user in the system to log the action under if none is provided
      let finalAdminId = adminId;
      if (!finalAdminId || finalAdminId === 'system-admin-mock') {
        const firstAdmin = await prisma.user.findFirst({
          where: { role: 'admin' }
        });
        if (firstAdmin) {
          finalAdminId = firstAdmin.id;
        }
      }

      for (const client of clients) {
        try {
          const strategy = client.strategy;
          if (!strategy || strategy.status !== 'active') {
            console.log(`AlgoEngine: Skipping client ${client.user.name} - Strategy "${strategy?.name || 'Unknown'}" is missing or status is not active.`);
            continue;
          }

          // Parse config from the strategy record in the database
          const config = strategy.configJson ? JSON.parse(strategy.configJson) : null;
          if (!config) {
            console.log(`AlgoEngine: Skipping client ${client.user.name} - Strategy configJson is missing.`);
            continue;
          }

          const exchangeParam = config.basicInfo?.exchange || 'NSE';
          const tradeType = config.basicInfo?.tradeType || 'Intraday';
          const productParam = tradeType === 'Delivery' ? 'CNC' : (tradeType === 'Carry Forward' || tradeType === 'Normal' || tradeType === 'NRML') ? 'NRML' : 'MIS';

          // 3. Filter preOpenStocks dynamically based on database strategy segment and conditions
          const segment = config.basicInfo?.segment || 'NSE F&O';

          const matchingStocks = preOpenStocks.filter(stock => {
            // Apply segment filter dynamically based on DB strategy configuration
            if (segment === 'NSE F&O' || segment === 'Futures' || segment === 'Options') {
              if (!stock.isFo) return false;
            } else if (segment === 'Nifty 50' || segment === 'Nifty') {
              if (!stock.isNifty50) return false;
            } else if (segment === 'Bank Nifty' || segment === 'BankNifty') {
              if (!stock.isBankNifty) return false;
            }
            
            if (config.conditions && Array.isArray(config.conditions)) {
              for (const cond of config.conditions) {
                if (cond.indicator === 'Pre Open Change %') {
                  const val = Number(cond.value);
                  if (cond.operator === '<' && !(stock.changePercent < val)) return false;
                  if (cond.operator === '>' && !(stock.changePercent > val)) return false;
                  if (cond.operator === '<=' && !(stock.changePercent <= val)) return false;
                  if (cond.operator === '>=' && !(stock.changePercent >= val)) return false;
                  if (cond.operator === '===' && !(stock.changePercent === val)) return false;
                  if (cond.operator === '==' && !(stock.changePercent == val)) return false;
                } else if (cond.indicator === 'Price Action') {
                  if (cond.value === 'Previous 5m High') {
                    const prevHigh = stock.high || stock.prevClose || stock.ltp;
                    if (cond.operator === '>' && !(stock.ltp > prevHigh)) return false;
                    if (cond.operator === '>=' && !(stock.ltp >= prevHigh)) return false;
                  }
                }
              }
            }
            return true;
          });

          if (matchingStocks.length === 0) {
            console.log(`AlgoEngine: No F&O stocks matched strategy conditions for client ${client.user.name}.`);
            continue;
          }

          // 4. Select position-based target stock (Long = sorted by changePercent ascending, Short = descending)
          const action = config.tradeAction?.action || 'Long';
          const selectPosition = config.basicInfo?.selectPosition || 1;

          const sortedStocks = [...matchingStocks].sort((a, b) =>
            action === 'Long' ? a.changePercent - b.changePercent : b.changePercent - a.changePercent
          );

          if (sortedStocks.length < selectPosition) {
            console.log(`AlgoEngine: Only ${sortedStocks.length} stocks available, cannot pick position #${selectPosition} for client ${client.user.name}. Skipping.`);
            continue;
          }

          const candidateStock = sortedStocks[selectPosition - 1];

          console.log(`AlgoEngine: Client ${client.user.name} | Strategy "${strategy.name}" | Position #${selectPosition} (${action === 'Long' ? 'Long/Loser' : 'Short/Gainer'}): ${candidateStock.symbol}(${candidateStock.changePercent}%)`);

          // 5. Candle breakout check for the selected stock
          let targetStock: StockQuote | null = null;
          let breakoutEntryPrice = 0;

          try {
            const existingTrade = await prisma.trade.findFirst({
              where: {
                clientId: client.id,
                strategyId: strategy.id,
                symbol: candidateStock.symbol,
                createdAt: { gte: todayStart }
              }
            });
            if (existingTrade) {
              console.log(`AlgoEngine: Trade already exists today for ${candidateStock.symbol} (${client.user.name}). Skipping.`);
              continue;
            }

            // Fetch minute candles from Kite for candle high check
            let candleHigh = 0;
            if (client.zerodhaApiKey && client.accessToken) {
              const instTokenStr = Object.entries(this.instrumentToSymbol).find(([, sym]) => sym === candidateStock.symbol)?.[0];
              if (instTokenStr) {
                try {
                  const today = new Date();
                  const formatKiteDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                  const from = `${formatKiteDate(today)}%2009:15`;
                  const to = `${formatKiteDate(today)}%20${(await this.getAlgoSetting('algo_entry_time', '09:20')).replace(':', '%20')}`;
                  const res = await KiteClient.getHistoricalData(client.zerodhaApiKey, client.accessToken, instTokenStr, 'minute', from, to);
                  if (res.status === 'success' && Array.isArray(res.data?.candles) && res.data.candles.length > 0) {
                    candleHigh = Math.max(...res.data.candles.map((c: any) => Number(c[2])));
                  }
                } catch {}
              }
            }

            if (candleHigh === 0) {
              candleHigh = candidateStock.high || candidateStock.ltp || candidateStock.prevClose || 100;
            }

            const bufferPct = config.tradeAction?.bufferPercent || 0.1;
            breakoutEntryPrice = candleHigh * (1 + bufferPct / 100);

            // Check if current LTP breaks candle high
            const currentLtp = candidateStock.ltp || candidateStock.iep || breakoutEntryPrice;
            const hasPriceAction = config.conditions?.some((c: any) => c.indicator === 'Price Action');

            if (!hasPriceAction || currentLtp >= candleHigh) {
              targetStock = candidateStock;
              console.log(`AlgoEngine: Breakout confirmed for ${candidateStock.symbol} | Candle High: ${candleHigh} | LTP: ${currentLtp} | Entry: ${breakoutEntryPrice}`);
            } else {
              console.log(`AlgoEngine: Breakout not met for ${candidateStock.symbol} | Candle High: ${candleHigh} | LTP: ${currentLtp}. Skipping.`);
            }
          } catch (checkErr) {
            console.error(`AlgoEngine: Error checking breakout for ${candidateStock.symbol}:`, checkErr);
          }

          if (!targetStock) {
            console.log(`AlgoEngine: No breakout candidate found for client ${client.user.name}. Skipping trades for today.`);
            continue;
          }

          const entryPrice = breakoutEntryPrice;
          const slPercent = config?.stoploss?.fixedPercent || 0.5;
          const targetPercent = config?.target?.profitPercent || 2.0;

          let activeAccessToken = client.accessToken;
          const isAutoLoginPossible = process.env.KITE_AUTO_LOGIN_ENABLED === 'true' && client.zerodhaPassword && client.zerodhaTotpSecret;

          if (!activeAccessToken && !isAutoLoginPossible) {
            const errMsg = `Skipped: No active Kite connection session, and auto-login credentials (password/TOTP) are not configured.`;
            console.log(`AlgoEngine: Skipping client ${client.user.name} - ${errMsg}`);
            
            await prisma.trade.create({
              data: {
                clientId: client.id,
                strategyId: strategy.id,
                symbol: targetStock.symbol,
                orderType: productParam,
                entryPrice: entryPrice,
                quantity: 0,
                status: 'FAILED',
                entryTime: new Date(),
                kiteResponse: { message: errMsg }
              }
            });

            await prisma.strategyLog.create({
              data: {
                strategyId: strategy.id,
                message: `Skipped trade execution for ${client.user.name}: No active Kite connection session, and auto-login credentials (password/TOTP) are not configured.`,
                logType: 'warning'
              }
            });
            continue;
          }

          if (process.env.KITE_AUTO_LOGIN_ENABLED === 'true') {
            if (client.zerodhaPassword && client.zerodhaTotpSecret) {
              console.log(`AlgoEngine: Auto-login is enabled. Refreshing session dynamically for client: ${client.user.name}`);
              const autoLoginRes = await performKiteAutoLogin(client.id);
              if (autoLoginRes.success && autoLoginRes.accessToken) {
                activeAccessToken = autoLoginRes.accessToken;
              } else {
                console.warn(`AlgoEngine: Dynamic auto-login failed for ${client.user.name}: ${autoLoginRes.error}`);
              }
            } else {
              console.log(`AlgoEngine: Auto-login is enabled but client ${client.user.name} is missing password or TOTP secret. Skipping dynamic auto-refresh.`);
            }
          }

          if (!activeAccessToken) {
            const errMsg = `Skipped: Kite session could not be established (auto-login failed or manual login required).`;
            console.log(`AlgoEngine: Skipping client ${client.user.name} - ${errMsg}`);
            
            await prisma.trade.create({
              data: {
                clientId: client.id,
                strategyId: strategy.id,
                symbol: targetStock.symbol,
                orderType: productParam,
                entryPrice: entryPrice,
                quantity: 0,
                status: 'FAILED',
                entryTime: new Date(),
                kiteResponse: { message: errMsg }
              }
            });

            await prisma.strategyLog.create({
              data: {
                strategyId: strategy.id,
                message: `Skipped trade execution for ${client.user.name}: Kite session could not be established (auto-login failed or manual login required).`,
                logType: 'error'
              }
            });
            continue;
          }

          // 6. Position sizing: perday 1% amount stock me lagana (allocate 1% of client's live Zerodha Net Cash Balance)
          let clientCapital = Number(client.capital);
          try {
            console.log(`AlgoEngine: Fetching live Zerodha margins for client ${client.user.name}...`);
            const marginRes = await KiteClient.getMargins(client.zerodhaApiKey!, activeAccessToken);
            if (marginRes && marginRes.status === 'success' && marginRes.data?.equity?.net !== undefined) {
              clientCapital = Number(marginRes.data.equity.net);
              console.log(`AlgoEngine: Successfully fetched live Net Cash Balance for ${client.user.name}: ₹${clientCapital}`);
            } else {
              console.warn(`AlgoEngine: Margin API response unsuccessful for ${client.user.name}. Falling back to DB capital: ₹${clientCapital}`);
            }
          } catch (marginErr: any) {
            console.error(`AlgoEngine: Error fetching live Zerodha margins for ${client.user.name}. Falling back to DB capital: ₹${clientCapital}`, marginErr);
          }

          const riskPercent = config?.riskManagement?.riskPerTrade || config?.stoploss?.riskPercent || 1;
          let allocatedAmount = clientCapital * (riskPercent / 100); 

          // Cap the allocated trade size at the configured database capital limit
          const dbCapitalLimit = Number(client.capital);
          if (allocatedAmount > dbCapitalLimit) {
            allocatedAmount = dbCapitalLimit;
          }

          // Calculate quantity based on direct capital allocation (allocatedAmount / entryPrice)
          let quantity = Math.floor(allocatedAmount / entryPrice);
          if (quantity <= 0) {
            const errMsg = `Skipped: Calculated quantity is 0 (Allocated amount ₹${allocatedAmount.toFixed(2)} is less than entry price ₹${entryPrice.toFixed(2)}).`;
            console.log(`AlgoEngine: Calculated quantity is 0 for client ${client.user.name} (Allocated: ₹${allocatedAmount.toFixed(2)}, Entry Price: ₹${entryPrice.toFixed(2)}). Skipping trade.`);
            
            await prisma.trade.create({
              data: {
                clientId: client.id,
                strategyId: strategy.id,
                symbol: targetStock.symbol,
                orderType: productParam,
                entryPrice: entryPrice,
                quantity: 0,
                status: 'FAILED',
                entryTime: new Date(),
                kiteResponse: { message: errMsg }
              }
            });

            await prisma.strategyLog.create({
              data: {
                strategyId: strategy.id,
                message: errMsg,
                logType: 'info'
              }
            });
            continue;
          }

          const marketProtectionVal = config?.tradeAction?.marketProtection !== undefined 
            ? Number(config.tradeAction.marketProtection) 
            : -1;

          const stopLoss = entryPrice * (1 - slPercent / 100);
          const target = entryPrice * (1 + targetPercent / 100);

          let orderTypeParam: 'MARKET' | 'LIMIT' | 'SL' | 'SL-M' = 'MARKET';
          let priceParam: number | undefined = undefined;
          let triggerPriceParam: number | undefined = undefined;
          const configOrderType = config?.tradeAction?.orderType || 'Market';

          if (configOrderType === 'Limit') {
            orderTypeParam = 'LIMIT';
            priceParam = Number(entryPrice.toFixed(2));
          } else if (configOrderType === 'SL-Limit') {
            orderTypeParam = 'SL';
            triggerPriceParam = Number(entryPrice.toFixed(2));
            const bufferPercent = config?.tradeAction?.bufferPercent || 0.1;
            priceParam = Number((entryPrice * (1 + bufferPercent / 100)).toFixed(2));
          } else if (configOrderType === 'SL-Market') {
            orderTypeParam = 'SL-M';
            triggerPriceParam = Number(entryPrice.toFixed(2));
          } else {
            orderTypeParam = 'MARKET';
          }

          console.log(`AlgoEngine: Placing trade for ${client.user.name} under database strategy "${strategy.name}" - Buy ${quantity} qty of ${targetStock.symbol} @ ${entryPrice} using ${orderTypeParam} order`);

          let orderId = '';
          let orderStatus = 'open';
          let orderRes: any = null;

          if (client.zerodhaApiKey && activeAccessToken) {
            try {
              const orderParams = {
                exchange: exchangeParam,
                tradingsymbol: targetStock.symbol,
                transaction_type: 'BUY' as const,
                quantity: quantity,
                order_type: orderTypeParam as any,
                product: productParam as any,
                validity: 'DAY' as const,
                price: priceParam,
                trigger_price: triggerPriceParam,
                ...(orderTypeParam === 'MARKET' ? { market_protection: marketProtectionVal } : {})
              };

              orderRes = await KiteClient.placeOrder(
                client.zerodhaApiKey,
                activeAccessToken,
                orderParams
              );

              // If it fails because the market is closed or needs to be placed as AMO
              if (orderRes && orderRes.status === 'error' && 
                  (orderRes.message?.includes('After Market Order') || 
                   orderRes.message?.includes('AMO') || 
                   orderRes.message?.includes('closed') ||
                   orderRes.message?.includes('variety'))) {
                console.log(`AlgoEngine: Retrying order as AMO (After Market Order) because market is closed.`);
                orderRes = await KiteClient.placeOrder(
                  client.zerodhaApiKey,
                  activeAccessToken,
                  { ...orderParams, variety: 'amo' }
                );
              }

              console.log('AlgoEngine: Kite order placement response:', orderRes);
              if (orderRes && orderRes.status === 'success' && orderRes.data?.order_id) {
                orderId = orderRes.data.order_id;
              } else {
                const errMsg = orderRes?.message || 'Zerodha API returned error status';
                console.warn(`AlgoEngine: Kite order response status was not success for ${client.user.name}. Error: ${errMsg}`);
                
                // Save failed trade in Database so it shows up in UI
                await prisma.trade.create({
                  data: {
                    clientId: client.id,
                    strategyId: strategy.id,
                    symbol: targetStock.symbol,
                    orderType: productParam,
                    entryPrice: entryPrice,
                    quantity: quantity,
                    stopLoss: stopLoss,
                    target: target,
                    status: 'FAILED',
                    entryTime: new Date(),
                    kiteResponse: orderRes || { error: errMsg }
                  }
                });

                await prisma.strategyLog.create({
                  data: {
                    strategyId: strategy.id,
                    message: `Kite order failed for ${client.user.name}: ${errMsg}`,
                    logType: 'error'
                  }
                });
                continue;
              }
            } catch (kiteErr: any) {
              console.error(`AlgoEngine: Failed to place order on Zerodha Kite for ${client.user.name}:`, kiteErr);
              
              // Save failed trade in Database so it shows up in UI
              await prisma.trade.create({
                data: {
                  clientId: client.id,
                  strategyId: strategy.id,
                  symbol: targetStock.symbol,
                  orderType: productParam,
                  entryPrice: entryPrice,
                  quantity: quantity,
                  stopLoss: stopLoss,
                  target: target,
                  status: 'FAILED',
                  entryTime: new Date(),
                  kiteResponse: { error: kiteErr.message || String(kiteErr) }
                }
              });

              await prisma.strategyLog.create({
                data: {
                  strategyId: strategy.id,
                  message: `Kite order failed for ${client.user.name}: ${kiteErr.message || 'API error'}. Trade aborted.`,
                  logType: 'error'
                }
              });
              continue;
            }
          } else {
            console.warn(`AlgoEngine: Missing API key or access token for ${client.user.name}. Aborting trade.`);
            continue;
          }

          // 6. Save trade in Database referencing the database strategy ID
          await prisma.trade.create({
            data: {
              clientId: client.id,
              strategyId: strategy.id,
              symbol: targetStock.symbol,
              orderType: productParam,
              entryPrice: entryPrice,
              quantity: quantity,
              stopLoss: stopLoss,
              target: target,
              status: orderStatus,
              entryTime: new Date(),
              kiteResponse: orderRes
            }
          });

          // 7. Write strategy log referencing the database strategy ID
          await prisma.strategyLog.create({
            data: {
              strategyId: strategy.id,
              message: `Intraday Trade Initiated for ${client.user.name}: Bought ${quantity} shares of ${targetStock.symbol} at entry price ₹${entryPrice.toFixed(2)} using config from DB strategy "${strategy.name}". Capital allocated (1%): ₹${allocatedAmount.toFixed(2)}. Target: ₹${target.toFixed(2)} (${targetPercent}%), Stop Loss: ₹${stopLoss.toFixed(2)} (${slPercent}%).`,
              logType: 'trade'
            }
          });

          // 8. Write audit log
          if (finalAdminId) {
            await prisma.auditLog.create({
              data: {
                adminId: finalAdminId,
                action: 'AUTO TRADE INITIATED',
                oldValue: null,
                newValue: `Client: ${client.user.name} | Strategy: ${strategy.name} | Stock: ${targetStock.symbol} | Qty: ${quantity} | Entry: ${entryPrice.toFixed(2)}`
              }
            }).catch(() => {});
          }

        } catch (clientErr: any) {
          console.error(`AlgoEngine: Error executing pre-open trade for client ${client.id}:`, clientErr);
        }
      }

    } catch (e: any) {
      console.error('AlgoEngine: executePreOpenTrades error:', e);
    }
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
      const homeRes = await fetch(API_ENDPOINTS.NSE_HOME, { headers });
      const rawCookies = homeRes.headers.get('set-cookie') || '';
      const cookies = rawCookies.split(',').map(c => c.split(';')[0]).join('; ');

      const fetchIndexSymbols = async (key: string): Promise<string[]> => {
        try {
          const res = await fetch(`https://www.nseindia.com/api/market-data-pre-open?key=${key}`, {
            headers: { ...headers, 'Cookie': cookies }
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

      const [dataRes, niftySymbols, bankNiftySymbols, foSymbols, smeSymbols] = await Promise.all([
        fetch(API_ENDPOINTS.NSE_PRE_OPEN, { headers: { ...headers, 'Cookie': cookies } }),
        fetchIndexSymbols('NIFTY'),
        fetchIndexSymbols('BANKNIFTY'),
        fetchIndexSymbols('FO'),
        fetchIndexSymbols('SME')
      ]);

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
          const prevClose = nseItem.metadata.previousClose || 100.0;
          const iep = nseItem.metadata.iep || nseItem.metadata.lastPrice || prevClose;
          const change = nseItem.metadata.change || 0;
          const changePercent = nseItem.metadata.pChange || 0;
          const ltp = iep;
          const open = iep;
          const high = nseItem.metadata.yearHigh || iep;
          const low = nseItem.metadata.yearLow || iep;
          const volume = nseItem.metadata.finalQuantity || nseItem.detail?.preOpenMarket?.totalTradedVolume || 0;
          const ffmCap = ltp * 50.0;
          const value = (nseItem.metadata.totalTurnover || (volume * ltp)) / 10000000;

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
            nm52wH: nseItem.metadata.yearHigh || parseFloat((prevClose * 1.25).toFixed(2)),
            nm52wL: nseItem.metadata.yearLow || parseFloat((prevClose * 0.75).toFixed(2)),
            isNifty50: niftySymbols.includes(symbol),
            isBankNifty: bankNiftySymbols.includes(symbol),
            isFo: foSymbols.includes(symbol),
            isSme: smeSymbols.includes(symbol)
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

      // Dynamically re-subscribe WebSocket to newly fetched pre-open symbols
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.log('NSE pre-open fetch completed. Re-subscribing WebSocket to dynamic symbols...');
        const symbols = freshStocks.map(s => s.symbol);
        const tokens: number[] = [];
        for (const [tokenStr, sym] of Object.entries(this.instrumentToSymbol)) {
          if (symbols.includes(sym)) {
            tokens.push(Number(tokenStr));
          }
        }
        if (tokens.length > 0) {
          this.ws.send(JSON.stringify({ a: 'subscribe', v: tokens }));
          this.ws.send(JSON.stringify({ a: 'mode', v: ['quote', tokens] }));
        }
      }

      return freshStocks;
    } catch (err) {
      console.error('NSE API pre-open fetch failed:', err);
      return this.preOpenCache;
    }
  }

  public async fetchLivePreOpenFromKite(): Promise<StockQuote[]> {
    return this.fetchLivePreOpenFromNSE();
  }

  public async getPreOpenStocks(): Promise<StockQuote[]> {
    const todayDateStr = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    if (this.preOpenCache.length === 0 || this.preOpenCacheDate !== todayDateStr) {
      console.log(`AlgoEngine: Pre-open cache empty or expired for today. Fetching fresh NSE pre-open data...`);
      await this.fetchLivePreOpenFromNSE();
    }
    return this.preOpenCache;
  }

  private lastHttpFetchTime = 0;

  public async updateLiveQuotesFromKiteHTTP() {
    if (process.env.USE_HTTP_POLLING !== 'true') {
      return;
    }

    if (Date.now() - this.lastHttpFetchTime < 3000) {
      return;
    }

    const creds = await this.ensureApiKeyAndToken();
    if (!creds) {
      console.log('No active Kite credentials found to fetch HTTP live quotes.');
      return;
    }

    if (this.stocksState.length === 0 && this.preOpenCache.length > 0) {
      this.stocksState = [...this.preOpenCache];
    }

    const symbols = this.stocksState.map(s => s.symbol);
    if (symbols.length === 0) return;

    try {
      console.log(`Fetching HTTP live quotes for ${symbols.length} symbols from Kite API...`);
      const queryParams = symbols.map(sym => `i=NSE:${sym}`).join('&');
      const url = `${API_ENDPOINTS.KITE_BASE}/quote?${queryParams}`;

      const res = await fetch(url, {
        headers: {
          'Authorization': `token ${creds.apiKey}:${creds.accessToken}`,
          'X-Kite-Version': '3'
        }
      });

      if (!res.ok) {
        throw new Error(`Kite HTTP quote fetch failed with status ${res.status}`);
      }

      const json = await res.json();
      if (json && json.status === 'success' && json.data) {
        this.stocksState = this.stocksState.map(stock => {
          const key = `NSE:${stock.symbol}`;
          const tick = json.data[key];
          if (tick) {
            const ltp = tick.last_price;
            const close = tick.ohlc?.close || stock.prevClose || ltp;
            const change = parseFloat((ltp - close).toFixed(2));
            const changePercent = close ? parseFloat(((change / close) * 100).toFixed(2)) : 0;
            const ffShares = 50.0;
            const volumeVal = tick.volume || stock.volume || Math.round(ffShares * 15000);
            return {
              ...stock,
              ltp,
              open: tick.ohlc?.open || stock.open || ltp,
              high: tick.ohlc?.high || stock.high || ltp,
              low: tick.ohlc?.low || stock.low || ltp,
              prevClose: close,
              volume: volumeVal,
              change,
              changePercent,
              iep: ltp,
              final: ltp,
              finalQuantity: volumeVal,
              value: (volumeVal * ltp) / 10000000,
              ffmCap: ltp * ffShares,
            };
          }
          return stock;
        });

        this.lastHttpFetchTime = Date.now();
        console.log('Successfully updated stocksState with live quotes from Kite HTTP API.');
      }
    } catch (err) {
      console.error('Failed to update live quotes from Kite HTTP API:', err);
    }
  }

  public getPreOpenDate(): string {
    return this.preOpenCacheDate || new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
}

const globalForAlgo = global as unknown as { algoEngine: AlgoEngineService };
export const algoEngine = globalForAlgo.algoEngine || new AlgoEngineService();
if (process.env.NODE_ENV !== 'production') globalForAlgo.algoEngine = algoEngine;
