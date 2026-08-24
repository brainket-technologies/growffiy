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

  public preselectedStockByStrategy: Map<string, StockQuote> = new Map();
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

  constructor() {
    this.preOpenStrategy = new PreOpenStrategy(this);
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
    return this.preOpenStrategy.preSelectAllClients(strategyId);
  }

  public async executePreOpenTrades(adminId: string, mockStocks?: StockQuote[], strategyId?: string, legIndex?: number, dualLegGroupId?: string | null): Promise<void> {
    return this.preOpenStrategy.executePreOpenTrades(adminId, mockStocks, strategyId, legIndex, dualLegGroupId);
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

      const fetchWithRetry = async (key: string, retries = 3): Promise<string[]> => {
        for (let i = 0; i < retries; i++) {
          const result = await fetchIndexSymbols(key);
          if (result.length > 0) return result;
          if (i < retries - 1) {
            const delay = 1000 * (i + 1);
            console.log(`Retry ${i + 1}/${retries - 1} for key=${key} in ${delay}ms`);
            await new Promise(r => setTimeout(r, delay));
          }
        }
        return [];
      };

      const foSymbols = await fetchWithRetry('FO');

      // Fetch Nifty 500 list from public NSE archives CSV (bulletproof way, bypasses Cloudflare/404 blocks)
      const fetchNifty500Symbols = async (): Promise<string[]> => {
        try {
          const csvRes = await fetch('https://archives.nseindia.com/content/indices/ind_nifty500list.csv');
          if (csvRes.ok) {
            const csvText = await csvRes.text();
            const lines = csvText.split('\n');
            const symbols: string[] = [];
            for (let i = 1; i < lines.length; i++) {
              const cols = lines[i].split(',');
              if (cols.length >= 3) {
                const sym = cols[cols.length - 3];
                if (sym) symbols.push(sym.trim());
              }
            }
            return symbols;
          }
        } catch (e) {
          console.error('Failed to fetch Nifty 500 symbols from archives:', e);
        }
        return [];
      };

      const [dataRes, niftySymbols, bankNiftySymbols, smeSymbols, nifty500Symbols] = await Promise.all([
        fetch(API_ENDPOINTS.NSE_PRE_OPEN, { headers: { ...headers, 'Cookie': cookies } }),
        fetchIndexSymbols('NIFTY'),
        fetchIndexSymbols('BANKNIFTY'),
        fetchIndexSymbols('SME'),
        fetchNifty500Symbols()
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
            symbol, name, ltp, open, high, low, prevClose, volume, change, changePercent,
            preOpenChangePercent: changePercent,
            iep, final: ltp, finalQuantity: volume, value, ffmCap,
            nm52wH: nseItem.metadata.yearHigh || parseFloat((prevClose * 1.25).toFixed(2)),
            nm52wL: nseItem.metadata.yearLow || parseFloat((prevClose * 0.75).toFixed(2)),
            isNifty50: niftySymbols.includes(symbol),
            isNifty500: nifty500Symbols.includes(symbol),
            isBankNifty: bankNiftySymbols.includes(symbol),
            isFo: foSymbols.includes(symbol),
            isSme: smeSymbols.includes(symbol)
          };
        });

      let dateStr = new Date().toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
      });

      if (nseJson.timestamp) {
        const parts = String(nseJson.timestamp).trim().split(' ');
        if (parts[0]) {
          const datePart = parts[0].replace(/-/g, ' ');
          if (datePart.length >= 10 && datePart.length <= 12) {
            dateStr = datePart;
          }
        }
      }

      this.preOpenCache = freshStocks;
      this.preOpenCacheDate = dateStr;
      this.lastPreOpenFetchTime = Date.now();

      this.wsLive.resubscribeTopMovers(freshStocks);

      // Async save to database without blocking the returned result
      Promise.resolve().then(async () => {
        for (const stock of freshStocks) {
          try {
            await prisma.historicalPreOpen.upsert({
              where: {
                date_symbol: {
                  date: dateStr,
                  symbol: stock.symbol
                }
              },
              create: {
                date: dateStr,
                symbol: stock.symbol,
                data: stock as any
              },
              update: {
                data: stock as any
              }
            });
          } catch (dbErr) {
            console.error(`Failed to save historical pre-open for ${stock.symbol} on ${dateStr}:`, dbErr);
          }
        }
        console.log(`Saved ${freshStocks.length} historical pre-open quotes for ${dateStr} to DB.`);
      }).catch(err => console.error('Error in historical pre-open async saving:', err));

      return freshStocks;
    } catch (err) {
      console.error('NSE API pre-open fetch failed:', err);
      return this.preOpenCache;
    }
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
    return this.fetchLivePreOpenFromNSE();
  }

  public async getPreOpenStocks(forceFetch = false): Promise<StockQuote[]> {
    const todayDateStr = new Date().toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    });

    const isCacheExpired = this.preOpenCacheDate !== todayDateStr;
    const canRefetch = Date.now() - this.lastPreOpenFetchTime > 5 * 60 * 1000;

    if (forceFetch || this.preOpenCache.length === 0 || (isCacheExpired && canRefetch)) {
      console.log(`AlgoEngine: Fetching fresh official NSE pre-open data (forceFetch=${forceFetch})...`);
      await this.fetchLivePreOpenFromNSE();
    }
    return this.preOpenCache;
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
    return this.preOpenCacheDate || new Date().toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
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
