import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../../../.env') });

import { prisma } from '../../database/db';
import { API_ENDPOINTS } from '../../core/constants';
import { KiteClient } from '../services/kite';
import { WsLiveFeed } from './wsLiveFeed';
import { TradingScheduler } from './tradingScheduler';
import { batchArray, concurrentMap } from '../../core/helpers';
import { getMasterClient } from '../utils/masterClient';
import { logFailedTrade } from '../utils/tradeLogger';
import { getFreshCircuitLimits } from '../utils/circuitLimitHelper';
import { matchesConditions } from '../utils/conditionEvaluator';
import { PreOpenStrategy } from './algo/strategies/preOpenStrategy';
import { TenAmStrategy } from './algo/strategies/tenAmStrategy';
import { FirstMinuteStrategy } from './algo/strategies/firstMinuteStrategy';


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
  value: number;
  ffmCap: number;
  nm52wH: number;
  nm52wL: number;
  isNifty50?: boolean;
  isNifty500?: boolean;
  isBankNifty?: boolean;
  isFo?: boolean;
  isSme?: boolean;
}

class AlgoEngineService {
  private isTradingActive: boolean = false;

  public preOpenCache: StockQuote[] = [];
  private lastPreOpenFetchTime: number = 0;
  private preOpenCacheDate: string = '';

  public preselectedStockByStrategy: Map<string, any> = new Map();
  todayTokenRefreshed: Set<string> = new Set();

  private conditionCache: Map<string, boolean> = new Map();
  private conditionCacheDate: string = '';

  public marginCache: Map<string, number> = new Map();
  private marginCacheDate: string = '';
  public entryLock: Set<string> = new Set();

  private lastHttpFetchTime = 0;
  private initialized = false;

  public wsLive: WsLiveFeed;
  private tradingScheduler: TradingScheduler;
  private preOpenStrategy: PreOpenStrategy;
  private tenAmStrategy: TenAmStrategy;
  private firstMinuteStrategy: FirstMinuteStrategy;

  constructor() {
    this.preOpenStrategy = new PreOpenStrategy(this);
    this.tenAmStrategy = new TenAmStrategy(this);
    this.firstMinuteStrategy = new FirstMinuteStrategy(this);
    this.wsLive = new WsLiveFeed(
      () => this.preOpenCache,
      () => this.preselectedStockByStrategy
    );
    this.tradingScheduler = new TradingScheduler(
      {
        todayTokenRefreshed: this.todayTokenRefreshed,
        getAlgoSetting: (key, defaultValue) => this.getAlgoSetting(key, defaultValue),
        getPreOpenStocks: (forceFetch) => this.getPreOpenStocks(forceFetch),
        preSelectAllClients: (strategyId) => this.preSelectAllClients(strategyId),
        executePreOpenTrades: (adminId, mockStocks, strategyId, legIndex, dualLegGroupId) => this.executePreOpenTrades(adminId, mockStocks, strategyId, legIndex, dualLegGroupId),
      },
      this.wsLive
    );
  }

  async init() {
    if (this.initialized) return;
    this.initialized = true;
    
    // Cleanup stale trade locks from previous days at startup
    // Also cleanup today's OLD-format locks (without 'leg' in key) from before the legIndex fix
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      console.log(`AlgoEngine init: Cleaning up stale trade locks (${todayStr})...`);
      const deletedLocks = await prisma.appSettings.deleteMany({
        where: {
          type: 'lock',
          settingKey: { startsWith: 'trade_lock_' },
          OR: [
            // Delete all locks from previous days
            { NOT: { settingKey: { endsWith: todayStr } } },
            // Delete today's old-format locks (don't contain '_leg')
            { AND: [
              { settingKey: { endsWith: todayStr } },
              { NOT: { settingKey: { contains: '_leg' } } }
            ]}
          ]
        }
      });
      console.log(`AlgoEngine init: Cleaned up ${deletedLocks.count} stale/old-format trade locks.`);
    } catch (e) {
      console.error('AlgoEngine init: Failed to cleanup stale trade locks:', e);
    }

    await this.wsLive.initialize();
    await this.restorePreselectedStocks();
    this.tradingScheduler.startDailyTokenRefreshScheduler();
    this.tradingScheduler.startDailyPreOpenStrategyScheduler();
    this.tradingScheduler.startActiveTradesMonitoringScheduler();
  }

  private async restorePreselectedStocks(): Promise<void> {
    try {
      const records = await prisma.strategyPreselect.findMany();
      for (const rec of records) {
        try {
          const stock: StockQuote = JSON.parse(rec.stockData);
          this.preselectedStockByStrategy.set(rec.strategyId, stock);
          console.log(`AlgoEngine init: Restored preselected stock ${stock.symbol} for strategy ${rec.strategyId}.`);
        } catch (e) {
          console.error(`AlgoEngine init: Failed to parse preselected stock for strategy ${rec.strategyId}:`, e);
        }
      }
    } catch (e) {
      console.error('AlgoEngine init: Failed to restore preselected stocks:', e);
    }
  }

  async getAlgoSetting(key: string, defaultValue: string): Promise<string> {
    try {
      const setting = await prisma.appSettings.findUnique({ where: { settingKey: key } });
      return setting?.settingValue || defaultValue;
    } catch {
      return defaultValue;
    }
  }

  public async getMasterClient(): Promise<{ id: string; zerodhaApiKey: string; accessToken: string } | null> {
    return getMasterClient();
  }

  public async getFreshCircuitLimits(client: any, exchange: string, symbol: string, accessToken?: string): Promise<{ upper: number; lower: number } | null> {
    return getFreshCircuitLimits(client, exchange, symbol, accessToken);
  }

  public async matchesConditions(stock: any, conditions: any[], client?: any): Promise<boolean> {
    const self = this;
    const cacheDateRef = {
      get date(): string { return self.conditionCacheDate; },
      set date(v: string) { self.conditionCacheDate = v; }
    };

    return matchesConditions(
      stock,
      conditions,
      this.wsLive,
      client,
      this.conditionCache,
      cacheDateRef
    );
  }

  async preSelectAllClients(strategyId?: string): Promise<void> {
    if (strategyId) {
      const strategy = await prisma.strategy.findUnique({ where: { id: strategyId } });
      let configObj: any = {};
      try { configObj = typeof strategy?.configJson === 'string' ? JSON.parse(strategy.configJson) : (strategy?.configJson || {}); } catch(e){}
      
      const engineType = configObj?.basicInfo?.engineType || '';
      const configName = configObj?.basicInfo?.name?.toLowerCase() || '';
      const dbName = strategy?.name?.toLowerCase() || '';
      
      if (engineType === 'TEN_AM' || (!engineType && (dbName.includes('ten am') || configName.includes('ten am')))) {
        return this.tenAmStrategy.preSelectAllClients(strategyId);
      } else if (engineType === 'FIRST_MINUTE' || (!engineType && (dbName.includes('first minute') || configName.includes('first minute') || dbName.includes('oh preopen') || configName.includes('oh preopen')))) {
        return this.firstMinuteStrategy.preSelectAllClients(strategyId);
      }
      return this.preOpenStrategy.preSelectAllClients(strategyId);
    } else {
      const strategies = await prisma.strategy.findMany({ where: { status: 'active' } });
      for (const st of strategies) {
        let configObj: any = {};
        try { configObj = typeof st.configJson === 'string' ? JSON.parse(st.configJson) : (st.configJson || {}); } catch(e){}
        
        const engineType = configObj?.basicInfo?.engineType || '';
        const configName = configObj?.basicInfo?.name?.toLowerCase() || '';
        const dbName = st.name.toLowerCase();

        if (engineType === 'TEN_AM' || (!engineType && (dbName.includes('ten am') || configName.includes('ten am')))) {
          await this.tenAmStrategy.preSelectAllClients(st.id);
        } else if (engineType === 'FIRST_MINUTE' || (!engineType && (dbName.includes('first minute') || configName.includes('first minute') || dbName.includes('oh preopen') || configName.includes('oh preopen')))) {
          await this.firstMinuteStrategy.preSelectAllClients(st.id);
        } else {
          await this.preOpenStrategy.preSelectAllClients(st.id);
        }
      }
    }
  }

  public async executePreOpenTrades(adminId: string, mockStocks?: StockQuote[], strategyId?: string, legIndex?: number, dualLegGroupId?: string | null): Promise<void> {
      if (strategyId) {
      const strategy = await prisma.strategy.findUnique({ where: { id: strategyId } });
      let configObj: any = {};
      try { configObj = typeof strategy?.configJson === 'string' ? JSON.parse(strategy.configJson) : (strategy?.configJson || {}); } catch(e){}
      
      const engineType = configObj?.basicInfo?.engineType || '';
      const configName = configObj?.basicInfo?.name?.toLowerCase() || '';
      const dbName = strategy?.name?.toLowerCase() || '';
      
      if (engineType === 'TEN_AM' || (!engineType && (dbName.includes('ten am') || configName.includes('ten am')))) {
        return this.tenAmStrategy.executePreOpenTrades(adminId, mockStocks, strategyId, legIndex, dualLegGroupId);
      } else if (engineType === 'FIRST_MINUTE' || (!engineType && (dbName.includes('first minute') || configName.includes('first minute') || dbName.includes('oh preopen') || configName.includes('oh preopen')))) {
        return this.firstMinuteStrategy.executePreOpenTrades(adminId, mockStocks, strategyId, legIndex, dualLegGroupId);
      }
      return this.preOpenStrategy.executePreOpenTrades(adminId, mockStocks, strategyId, legIndex, dualLegGroupId);
    } else {
      const strategies = await prisma.strategy.findMany({ where: { status: 'active' } });
      for (const st of strategies) {
        let configObj: any = {};
        try { configObj = typeof st.configJson === 'string' ? JSON.parse(st.configJson) : (st.configJson || {}); } catch(e){}
        
        const engineType = configObj?.basicInfo?.engineType || '';
        const configName = configObj?.basicInfo?.name?.toLowerCase() || '';
        const dbName = st.name.toLowerCase();

        if (engineType === 'TEN_AM' || (!engineType && (dbName.includes('ten am') || configName.includes('ten am')))) {
          await this.tenAmStrategy.executePreOpenTrades(adminId, mockStocks, st.id, legIndex, dualLegGroupId);
        } else if (engineType === 'FIRST_MINUTE' || (!engineType && (dbName.includes('first minute') || configName.includes('first minute') || dbName.includes('oh preopen') || configName.includes('oh preopen')))) {
          await this.firstMinuteStrategy.executePreOpenTrades(adminId, mockStocks, st.id, legIndex, dualLegGroupId);
        } else {
          await this.preOpenStrategy.executePreOpenTrades(adminId, mockStocks, st.id, legIndex, dualLegGroupId);
        }
      }
    }
  }

  public async fetchLivePreOpenFromNSE(): Promise<StockQuote[]> {
    const fetcher = require('../utils/preOpenFetcher');
    return fetcher.fetchLivePreOpenFromNSE();
  }

  public async getPreOpenStocksByDate(dateStr: string): Promise<StockQuote[]> {
    try {
      const records = await prisma.historicalPreOpen.findMany({
        where: { date: dateStr }
      });
      return records.map(r => r.data as unknown as StockQuote);
    } catch (err) {
      console.error(`Failed to get pre-open stocks for date ${dateStr}:`, err);
      return [];
    }
  }

  public async fetchLivePreOpenFromKite(): Promise<StockQuote[]> {
    const fetcher = require('../utils/preOpenFetcher');
    return fetcher.fetchLivePreOpenFromKite();
  }

  public async getPreOpenStocks(forceFetch = false): Promise<StockQuote[]> {
    const fetcher = require('../utils/preOpenFetcher');
    return fetcher.getPreOpenStocks(forceFetch);
  }

  public async updateLiveQuotesFromKiteHTTP() {
    if (process.env.USE_HTTP_POLLING !== 'true') return;
    if (Date.now() - this.lastHttpFetchTime < 3000) return;

    const creds = await this.wsLive.getActiveCredentials();
    if (!creds) {
      console.log('No active Kite credentials found to fetch HTTP live quotes.');
      return;
    }

    const stocksState = this.wsLive.getStocks();
    if (stocksState.length === 0 && this.preOpenCache.length > 0) {
      this.wsLive.stocksState = [...this.preOpenCache];
    }

    const symbols = (this.wsLive.stocksState.length > 0 ? this.wsLive.stocksState : this.preOpenCache).map(s => s.symbol);
    if (symbols.length === 0) return;

    try {
      console.log(`Fetching HTTP live quotes for ${symbols.length} symbols from Kite API...`);

      const BATCH_SIZE = 30;
      const batches = batchArray(symbols, BATCH_SIZE);
      console.log(`Split into ${batches.length} batches of up to ${BATCH_SIZE} symbols each.`);

      const headers = {
        'Authorization': `token ${creds.apiKey}:${creds.accessToken}`,
        'X-Kite-Version': '3'
      };

      const batchResults = await Promise.allSettled(
        batches.map((batch: string[]) => {
          const queryParams = batch.map((sym: string) => `i=NSE:${sym}`).join('&');
          const url = `${API_ENDPOINTS.KITE_BASE}/quote?${queryParams}`;
          return fetch(url, { headers }).then(res => {
            if (!res.ok) throw new Error(`Kite batch quote fetch failed with status ${res.status}`);
            return res.json();
          });
        })
      );

      let mergedData: any = {};
      for (const result of batchResults) {
        if (result.status === 'fulfilled' && result.value?.status === 'success' && result.value?.data) {
          mergedData = { ...mergedData, ...result.value.data };
        }
      }

      if (Object.keys(mergedData).length > 0) {
        this.wsLive.stocksState = (this.wsLive.stocksState.length > 0 ? this.wsLive.stocksState : this.preOpenCache).map(stock => {
          const key = `NSE:${stock.symbol}`;
          const tick = mergedData[key];
          if (tick) {
            const ltp = tick.last_price;
            const close = tick.ohlc?.close || stock.prevClose || ltp;
            const change = parseFloat((ltp - close).toFixed(2));
            const changePercent = close ? parseFloat(((change / close) * 100).toFixed(2)) : 0;
            const ffShares = 50.0;
            const volumeVal = tick.volume || stock.volume || Math.round(ffShares * 15000);
            return {
              ...stock, ltp,
              open: tick.ohlc?.open || stock.open || ltp,
              high: tick.ohlc?.high || stock.high || ltp,
              low: tick.ohlc?.low || stock.low || ltp,
              prevClose: close, volume: volumeVal, change, changePercent,
              iep: ltp, final: ltp, finalQuantity: volumeVal,
              value: (volumeVal * ltp) / 10000000,
              ffmCap: ltp * ffShares,
            };
          }
          return stock;
        });

        this.lastHttpFetchTime = Date.now();
        console.log('Successfully updated stocksState with live quotes from Kite HTTP API.');
      } else {
        const failedCount = batchResults.filter((r: any) => r.status === 'rejected').length;
        console.warn(`All ${batches.length} quote batches failed. ${failedCount} batches errored.`);
      }
    } catch (err) {
      console.error('Failed to update live quotes from Kite HTTP API:', err);
    }
  }

  public isWsConnected(): boolean {
    return this.wsLive.isWsConnected();
  }

  public getStocks(): StockQuote[] {
    return this.wsLive.getStocks();
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

  public getPreOpenDate(): string {
    const fetcher = require('../utils/preOpenFetcher');
    return fetcher.getPreOpenDate();
  }

  public async logFailedTrade(
    client: any,
    strategy: any,
    symbol: string,
    orderType: string,
    entryPrice: number,
    reason: string,
    legFields?: { direction: string; legName: string; legTimeframe: string; dualLegGroupId: string | null }
  ): Promise<void> {
    return logFailedTrade(client, strategy, symbol, orderType, entryPrice, reason, legFields);
  }
}

const globalForAlgo = global as unknown as { algoEngine: AlgoEngineService; initPromise?: Promise<void> };
export const algoEngine = globalForAlgo.algoEngine || new AlgoEngineService();
if (!globalForAlgo.initPromise) {
  globalForAlgo.initPromise = algoEngine.init();
}
if (process.env.NODE_ENV !== 'production') globalForAlgo.algoEngine = algoEngine;
