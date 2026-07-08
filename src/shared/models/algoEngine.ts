import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../../../.env') });

import { prisma } from '../../database/db';
import { API_ENDPOINTS } from '../../core/constants';
import { KiteClient } from '../services/kite';
import { performKiteAutoLogin } from '../services/kiteAutoLogin';
import { applyOperator, calculateRSI, calculateEMA, calculateSMA, calculateMACD, calculateATR, calculateVWAP, calculateBollingerBands, calculateSuperTrend, calculateADX } from '../services/indicators';
import { WsLiveFeed } from './wsLiveFeed';
import { TradingScheduler } from './tradingScheduler';
import { getTickSizeAndRound } from '../utils/tickSizeUtil';
import { batchArray, concurrentMap } from '../../core/helpers';
import { logSystemEvent } from '../services/auditLogger';
import { getLatestOrderState } from '../utils/kiteHelper';

function mapTimeframeToKiteInterval(tf: string): string {
  if (!tf) return '5minute';
  const map: Record<string, string> = {
    '1m': 'minute',
    '3m': '3minute',
    '5m': '5minute',
    '10m': '10minute',
    '15m': '15minute',
    '30m': '30minute',
    '60m': '60minute',
    '1h': '60minute',
    '1d': 'day'
  };
  return map[tf.toLowerCase()] || '5minute';
}

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
  isBankNifty?: boolean;
  isFo?: boolean;
  isSme?: boolean;
}

class AlgoEngineService {
  private isTradingActive: boolean = false;

  private preOpenCache: StockQuote[] = [];
  private lastPreOpenFetchTime: number = 0;
  private preOpenCacheDate: string = '';

  private preselectedStockByStrategy: Map<string, StockQuote> = new Map();
  todayTokenRefreshed: Set<string> = new Set();

  private conditionCache: Map<string, boolean> = new Map();
  private conditionCacheDate: string = '';

  private marginCache: Map<string, number> = new Map();
  private marginCacheDate: string = '';
  private entryLock: Set<string> = new Set();

  private lastHttpFetchTime = 0;
  private initialized = false;

  private wsLive: WsLiveFeed;
  private tradingScheduler: TradingScheduler;

  constructor() {
    this.wsLive = new WsLiveFeed(
      () => this.preOpenCache,
      () => this.preselectedStockByStrategy
    );
    this.tradingScheduler = new TradingScheduler(
      {
        todayTokenRefreshed: this.todayTokenRefreshed,
        getAlgoSetting: (key, defaultValue) => this.getAlgoSetting(key, defaultValue),
        getPreOpenStocks: () => this.getPreOpenStocks(),
        preSelectAllClients: (strategyId) => this.preSelectAllClients(strategyId),
        executePreOpenTrades: (adminId, mockStocks, strategyId, legIndex, dualLegGroupId) => this.executePreOpenTrades(adminId, mockStocks, strategyId, legIndex, dualLegGroupId),
      },
      this.wsLive
    );
  }

  async init() {
    if (this.initialized) return;
    this.initialized = true;
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

  private async getFreshCircuitLimits(client: any, exchange: string, symbol: string): Promise<{ upper: number; lower: number } | null> {
    if (!client.zerodhaApiKey || !client.accessToken) return null;
    try {
      const quoteRes = await KiteClient.getQuotes(client.zerodhaApiKey, client.accessToken, [`${exchange}:${symbol}`]);
      if (quoteRes?.status === 'success' && quoteRes.data?.[`${exchange}:${symbol}`]) {
        const q = quoteRes.data[`${exchange}:${symbol}`];
        if (q.upper_circuit_limit !== undefined && q.lower_circuit_limit !== undefined) {
          return {
            upper: Number(q.upper_circuit_limit),
            lower: Number(q.lower_circuit_limit)
          };
        }
      }
    } catch (e) {
      console.error(`AlgoEngine: Failed to fetch fresh circuit limits for ${symbol}:`, e);
    }
    return null;
  }

  private async matchesConditions(stock: any, conditions: any[], client?: any): Promise<boolean> {
    if (!conditions || !Array.isArray(conditions) || conditions.length === 0) return true;

    const strategyId = client?.strategy?.id;
    if (strategyId) {
      const todayDateKey = new Date().toLocaleDateString();
      if (this.conditionCacheDate !== todayDateKey) {
        this.conditionCache.clear();
        this.conditionCacheDate = todayDateKey;
      }
      const cacheKey = `${strategyId}_${stock.symbol}`;
      if (this.conditionCache.has(cacheKey)) {
        return this.conditionCache.get(cacheKey)!;
      }
    }

    for (const cond of conditions) {
      const val = Number(cond.value);
      if (cond.indicator === 'Pre Open Change %') {
        if (cond.operator === '<' && !(stock.changePercent < val)) return false;
        if (cond.operator === '>' && !(stock.changePercent > val)) return false;
        if (cond.operator === '<=' && !(stock.changePercent <= val)) return false;
        if (cond.operator === '>=' && !(stock.changePercent >= val)) return false;
        if (cond.operator === '==' && !(stock.changePercent == val)) return false;
      } else if (cond.indicator === 'Price Action') {
        if (cond.value === 'Previous 5m High') {
          const prevHigh = stock.high || stock.prevClose || stock.ltp;
          if (cond.operator === '>' && !(stock.ltp > prevHigh)) return false;
          if (cond.operator === '>=' && !(stock.ltp >= prevHigh)) return false;
        }
      } else if (cond.indicator === 'Gap Up') {
        const gapPct = stock.prevClose ? ((stock.iep - stock.prevClose) / stock.prevClose) * 100 : 0;
        if (!applyOperator(gapPct, cond.operator, val)) return false;
      } else if (cond.indicator === 'Gap Down') {
        const gapPct = stock.prevClose ? ((stock.iep - stock.prevClose) / stock.prevClose) * 100 : 0;
        if (!applyOperator(gapPct, cond.operator, -val)) return false;
      } else if (cond.indicator === 'Previous High') {
        if (!applyOperator(stock.ltp, cond.operator, stock.nm52wH || stock.high || stock.ltp)) return false;
      } else if (cond.indicator === 'Previous Low') {
        if (!applyOperator(stock.ltp, cond.operator, stock.nm52wL || stock.low || stock.ltp)) return false;
      } else if (cond.indicator === 'Previous Close') {
        if (!applyOperator(stock.ltp, cond.operator, stock.prevClose)) return false;
      } else if (cond.indicator === 'Pre Open Price') {
        if (!applyOperator(stock.ltp, cond.operator, stock.iep)) return false;
      } else if (cond.indicator === 'Pre Open Volume') {
        if (!applyOperator(stock.finalQuantity || stock.volume, cond.operator, val)) return false;
      } else if (cond.indicator === 'Volume') {
        if (!applyOperator(stock.volume, cond.operator, val)) return false;
      } else if (cond.indicator === 'Open Interest') {
        if (!applyOperator(stock.openInterest || 0, cond.operator, val)) return false;
      } else if (['RSI', 'EMA', 'SMA', 'VWAP', 'MACD', 'ATR', 'Bollinger Bands', 'SuperTrend', 'ADX', 'Candle Pattern'].includes(cond.indicator)) {
        if (!client) return true;
        let kiteInterval = '5minute';
        try {
          if (client?.strategy?.configJson) {
            const cfg = JSON.parse(client.strategy.configJson);
            kiteInterval = mapTimeframeToKiteInterval(cfg.basicInfo?.timeframe || '5m');
          }
        } catch { }
        const candles = await this.wsLive.fetchHistoricalCandles(client, stock.symbol, kiteInterval, 5);
        if (candles.length < 2) return true;
        const closePrices = candles.map(c => c[4]);
        if (cond.indicator === 'RSI') {
          const rsi = calculateRSI(closePrices, 14);
          if (!applyOperator(rsi, cond.operator, val)) return false;
        } else if (cond.indicator === 'EMA') {
          if (isNaN(val) || val <= 0) return true;
          const ema = calculateEMA(closePrices, val);
          const sma = calculateSMA(closePrices, 20);
          if (cond.value === 'SMA' && !applyOperator(ema, cond.operator, sma)) return false;
          if (!applyOperator(ema, cond.operator, val)) return false;
        } else if (cond.indicator === 'SMA') {
          if (isNaN(val) || val <= 0) return true;
          const sma = calculateSMA(closePrices, val);
          if (!applyOperator(sma, cond.operator, val)) return false;
        } else if (cond.indicator === 'VWAP') {
          const vwap = calculateVWAP(candles);
          if (!applyOperator(stock.ltp, cond.operator, vwap)) return false;
        } else if (cond.indicator === 'MACD') {
          const macd = calculateMACD(closePrices);
          const compareVal = cond.value === 'Signal' ? macd.signal : (Number(cond.value) || macd.signal);
          if (!applyOperator(macd.macd, cond.operator, compareVal)) return false;
        } else if (cond.indicator === 'ATR') {
          if (isNaN(val) || val <= 0) return true;
          const atr = calculateATR(candles, val);
          if (!applyOperator(atr, cond.operator, val)) return false;
        } else if (cond.indicator === 'Bollinger Bands') {
          if (isNaN(val) || val <= 0) return true;
          const bb = calculateBollingerBands(closePrices, val);
          const bbVal = cond.value === 'Upper' ? bb.upper : (cond.value === 'Lower' ? bb.lower : bb.middle);
          if (!applyOperator(stock.ltp, cond.operator, bbVal)) return false;
        } else if (cond.indicator === 'SuperTrend') {
          const st = calculateSuperTrend(candles, 10, 3);
          if (cond.value === 'Up' && st.direction !== 'up') return false;
          if (cond.value === 'Down' && st.direction !== 'down') return false;
          if (!applyOperator(st.value, cond.operator, val)) return false;
        } else if (cond.indicator === 'ADX') {
          const adx = calculateADX(candles);
          if (!applyOperator(adx, cond.operator, val)) return false;
        } else if (cond.indicator === 'Candle Pattern') {
          const last = candles[candles.length - 1];
          const prev = candles.length > 1 ? candles[candles.length - 2] : last;
          if (cond.value === 'Doji') {
            const body = Math.abs(last[4] - last[1]);
            const range = last[2] - last[3];
            if (range > 0 && (body / range) > 0.1) return false;
          } else if (cond.value === 'Bullish Engulfing') {
            if (!(prev[4] < prev[1] && last[4] > last[1] && last[4] > prev[1] && last[1] < prev[4])) return false;
          } else if (cond.value === 'Bearish Engulfing') {
            if (!(prev[4] > prev[1] && last[4] < last[1] && last[1] < prev[4] && last[4] > prev[1])) return false;
          } else if (cond.value === 'Hammer') {
            const body = Math.abs(last[4] - last[1]);
            const lowerWick = Math.min(last[4], last[1]) - last[3];
            const upperWick = last[2] - Math.max(last[4], last[1]);
            if (!(lowerWick > body * 2 && upperWick < body * 0.3)) return false;
          }
        }
      }
    }
    if (strategyId) {
      this.conditionCache.set(`${strategyId}_${stock.symbol}`, true);
    }
    return true;
  }

  async preSelectAllClients(strategyId?: string): Promise<void> {
    this.preselectedStockByStrategy.clear();
    this.marginCache.clear();
    try {
      await prisma.strategyPreselect.deleteMany();
    } catch (e) {
      console.error('AlgoEngine preSelect: Failed to clear old preselections from DB:', e);
    }

    const preOpenStocks = this.preOpenCache.length > 0
      ? this.preOpenCache
      : await this.getPreOpenStocks();

    if (!preOpenStocks || preOpenStocks.length === 0) {
      console.log('AlgoEngine preSelect: No pre-open stocks available. Skipping.');
      return;
    }

    const algoType = await prisma.productType.findUnique({ where: { name: 'Algo' } });
    if (!algoType) {
      console.log('AlgoEngine preSelect: Algo product type not found. Skipping.');
      return;
    }

    const where: any = {
      tradingStatus: 'active',
      subscriptionStatus: 'active',
      productTypeId: algoType.id,
      strategyId: { not: null },
      accessToken: { not: null },
      zerodhaApiKey: { not: null }
    };
    if (strategyId) where.strategyId = strategyId;

    const clients = await prisma.client.findMany({
      where,
      include: { user: true, strategy: true }
    });

    if (clients.length === 0) {
      console.log('AlgoEngine preSelect: No active clients with connected Kite session.');
      return;
    }

    const uniqueStrategies = new Map<string, { strategy: any; clients: any[] }>();
    for (const client of clients) {
      if (!client.strategy || client.strategy.status !== 'active') continue;
      if (!uniqueStrategies.has(client.strategy.id)) {
        uniqueStrategies.set(client.strategy.id, { strategy: client.strategy, clients: [] });
      }
      uniqueStrategies.get(client.strategy.id)!.clients.push(client);
    }

    for (const [, { strategy, clients: strategyClients }] of uniqueStrategies) {
      let config: any = null;
      try { config = strategy.configJson ? JSON.parse(strategy.configJson) : null; } catch { console.warn(`AlgoEngine preSelect: Invalid configJson for strategy ${strategy.name}. Skipping.`); continue; }
      if (!config) continue;

      if (config.riskManagement) {
        if (config.riskManagement.maxDailyLoss < -1) config.riskManagement.maxDailyLoss = -1;
        if (config.riskManagement.maxDailyProfit < -1) config.riskManagement.maxDailyProfit = -1;
        if (config.riskManagement.misMarginRate < -1) config.riskManagement.misMarginRate = -1;
      }
      if (config.stoploss?.trailingSL < -1) config.stoploss.trailingSL = -1;
      if (config.target?.trailingTarget < -1) config.target.trailingTarget = -1;

      if (!config.basicInfo?.segment || !config.basicInfo?.selectPosition) {
        console.log(`AlgoEngine preSelect: Strategy config missing required fields (segment/selectPosition) for strategy ${strategy.name}. Skipping.`);
        continue;
      }

      const segment = config.basicInfo.segment;
      const selectPosition = config.basicInfo.selectPosition;

      let matchingStocks = preOpenStocks.filter(stock => {
        if (segment === 'NSE F&O' || segment === 'Futures' || segment === 'Options') {
          if (!stock.isFo) return false;
        } else if (segment === 'Nifty 50' || segment === 'Nifty') {
          if (!stock.isNifty50) return false;
        } else if (segment === 'Bank Nifty' || segment === 'BankNifty') {
          if (!stock.isBankNifty) return false;
        }
        return true;
      });

      if (matchingStocks.length === 0) {
        console.log(`AlgoEngine preSelect: No matching stocks for strategy ${strategy.name}.`);
        continue;
      }

      const filteredStocks: any[] = [];
      for (const stock of matchingStocks) {
        if (await this.matchesConditions(stock, config.conditions, null)) {
          filteredStocks.push(stock);
        }
      }
      matchingStocks = filteredStocks;

      if (matchingStocks.length === 0) {
        console.log(`AlgoEngine preSelect: No stocks passed conditions for strategy ${strategy.name}.`);
        continue;
      }

      const sortedStocks = [...matchingStocks].sort((a, b) => a.changePercent - b.changePercent);

      if (sortedStocks.length < selectPosition) {
        console.log(`AlgoEngine preSelect: Only ${sortedStocks.length} stocks, cannot pick #${selectPosition} for strategy ${strategy.name}.`);
        continue;
      }

      const selected = sortedStocks[selectPosition - 1];
      this.preselectedStockByStrategy.set(strategy.id, selected);
      try {
        await prisma.strategyPreselect.upsert({
          where: { strategyId: strategy.id },
          update: { symbol: selected.symbol, stockData: JSON.stringify(selected) },
          create: { strategyId: strategy.id, symbol: selected.symbol, stockData: JSON.stringify(selected) }
        });
      } catch (e) {
        console.error(`AlgoEngine preSelect: Failed to persist preselected stock for strategy ${strategy.id}:`, e);
      }
      this.wsLive.subscribeSymbols([selected.symbol]);
      console.log(`AlgoEngine preSelect: Strategy "${strategy.name}" → #${selectPosition} ${selected.symbol}(${selected.changePercent}%)`);
    }

    if (strategyId) {
      const selected = this.preselectedStockByStrategy.get(strategyId);
      if (selected) {
        console.log(`AlgoEngine preSelect: Clients of strategy "${strategyId}" will trade ${selected.symbol}.`);
      }
    } else {
      console.log(`AlgoEngine preSelect: ${this.preselectedStockByStrategy.size} strategies have preselected stocks.`);
    }

    const PRE_SELECT_CONCURRENCY = 15;
    await concurrentMap(clients, async (client: any) => {
      if (client.zerodhaApiKey && client.accessToken) {
        try {
          const marginRes = await KiteClient.getMargins(client.zerodhaApiKey, client.accessToken);
          if (marginRes?.status === 'success' && marginRes.data?.equity?.net !== undefined) {
            this.marginCache.set(client.id, Number(marginRes.data.equity.net));
          }
        } catch { }
      }
    }, PRE_SELECT_CONCURRENCY);

    console.log(`AlgoEngine preSelect: Margins cached for ${this.marginCache.size}/${clients.length} clients.`);
  }

  public async executePreOpenTrades(adminId: string, mockStocks?: StockQuote[], strategyId?: string, legIndex?: number, dualLegGroupId?: string | null): Promise<void> {
    console.log('AlgoEngine: executePreOpenTrades started.');
    try {
      const preOpenStocks = mockStocks && mockStocks.length > 0
        ? mockStocks
        : await this.getPreOpenStocks();

      if (!preOpenStocks || preOpenStocks.length === 0) {
        const msg = 'AlgoEngine: No pre-open stocks fetched from NSE. Aborting execution for today.';
        console.log(msg);
        try {
          await logSystemEvent({
            action: 'PRE_OPEN_FETCH_FAILED',
            newValue: msg
          });
        } catch (e) {
          console.error('Failed to log system event:', e);
        }
        return;
      }

      const algoType = await prisma.productType.findUnique({ where: { name: 'Algo' } });
      if (!algoType) {
        console.log('AlgoEngine: Algo product type not found. Skipping trade execution.');
        return;
      }

      const where: any = {
        tradingStatus: 'active',
        subscriptionStatus: 'active',
        productTypeId: algoType.id,
        strategyId: { not: null },
        zerodhaApiKey: { not: null }
      };
      if (strategyId) where.strategyId = strategyId;

      const clients = await prisma.client.findMany({
        where,
        include: { user: true, strategy: true }
      });

      if (clients.length === 0) {
        console.log('AlgoEngine: No active clients with valid Kite API key found. Auto-login will be attempted per client.');
        return;
      }

      const clientsWithoutToken = clients.filter(c => !c.accessToken);
      if (clientsWithoutToken.length > 0) {
        console.log(`AlgoEngine: ${clientsWithoutToken.length} client(s) have null accessToken. Auto-login will be attempted during processing.`);
      }

      console.log(`AlgoEngine: Processing strategies for ${clients.length} active client(s).`);

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      let finalAdminId = adminId;
      if (!finalAdminId || finalAdminId === 'system-admin-mock') {
        const firstAdmin = await prisma.user.findFirst({ where: { role: 'admin' } });
        if (firstAdmin) finalAdminId = firstAdmin.id;
      }

      const BATCH_SIZE = 20;
      const candlePriceCache = new Map<string, number>();

      const processClientEntry = async (client: any): Promise<void> => {
        let lockKey = '';
        let dbLockKey = '';
        try {
          const strategy = client.strategy;
          if (!strategy || strategy.status !== 'active') {
            console.log(`AlgoEngine: Skipping client ${client.user.name} - Strategy "${strategy?.name || 'Unknown'}" is missing or status is not active.`);
            return;
          }

          let config: any = null;
          try { config = strategy.configJson ? JSON.parse(strategy.configJson) : null; } catch { console.warn(`AlgoEngine: Invalid configJson for strategy "${strategy.name}". Skipping client ${client.user.name}.`); return; }
          if (!config) {
            console.log(`AlgoEngine: Skipping client ${client.user.name} - Strategy configJson is missing.`);
            return;
          }

          // --- Dual Leg: Extract current leg config ---
          const legs = config.legs || [];
          const currentLeg = legs[legIndex || 0];
          if (!currentLeg || !currentLeg.enabled) {
            console.log(`AlgoEngine: Leg ${(legIndex || 0) + 1} not found or disabled for ${client.user.name}. Skipping.`);
            return;
          }
          const isShortTrade = ['Short', 'Sell'].includes(currentLeg.tradeAction?.action || '');
          const direction = isShortTrade ? 'SHORT' : 'LONG';
          const legTimeframe = currentLeg.timeframe || '5m';
          const legCandleType = currentLeg.tradeAction?.candlePriceType || 'high';
          const legBufferPct = currentLeg.tradeAction?.bufferPercent;
          const legOrderType = currentLeg.tradeAction?.orderType || 'SL-Market';

          // --- Dual Leg: Use shared group ID (from scheduler) or generate if not provided ---
          const enabledLegs = (config.legs || []).filter((l: any) => l.enabled);
          const finalDualLegGroupId = dualLegGroupId !== undefined ? dualLegGroupId : (enabledLegs.length > 1 ? crypto.randomUUID() : null);

          if (!config.basicInfo?.exchange || !config.basicInfo?.tradeType || !config.basicInfo?.preSelectTime) {
            console.log(`AlgoEngine: Strategy config missing exchange/tradeType/preSelectTime for client ${client.user.name}. Skipping.`);
            return;
          }
          const exchangeParam = config.basicInfo.exchange;
          const tradeType = config.basicInfo.tradeType;
          const productParam = tradeType === 'Delivery' ? 'CNC' : (tradeType === 'Carry Forward' || tradeType === 'Normal' || tradeType === 'NRML') ? 'NRML' : 'MIS';

          let candidateStock: StockQuote | null = this.preselectedStockByStrategy.get(strategy.id) || null;

          if (!candidateStock) {
            try {
              const dbRecord = await prisma.strategyPreselect.findUnique({ where: { strategyId: strategy.id } });
              if (dbRecord) {
                const parsed = JSON.parse(dbRecord.stockData);
                candidateStock = parsed;
                this.preselectedStockByStrategy.set(strategy.id, parsed);
                console.log(`AlgoEngine: Restored preselected stock ${parsed.symbol} for strategy "${strategy.name}" from DB.`);
              }
            } catch (e) {
              console.error(`AlgoEngine: Failed to restore preselected stock from DB for strategy ${strategy.id}:`, e);
            }
          }

          if (!candidateStock) {
            if (!config.basicInfo?.segment || !config.basicInfo?.selectPosition) {
              console.log(`AlgoEngine: Strategy config missing required fields (segment/selectPosition) for fallback filter for client ${client.user.name}. Skipping.`);
              return;
            }
            const segment = config.basicInfo.segment;
            const action = currentLeg.tradeAction?.action || 'Long';
            const selectPosition = config.basicInfo.selectPosition;
            let matchingStocks = preOpenStocks.filter(stock => {
              if (segment === 'NSE F&O' || segment === 'Futures' || segment === 'Options') {
                if (!stock.isFo) return false;
              } else if (segment === 'Nifty 50' || segment === 'Nifty') {
                if (!stock.isNifty50) return false;
              } else if (segment === 'Bank Nifty' || segment === 'BankNifty') {
                if (!stock.isBankNifty) return false;
              }
              return true;
            });

            const filteredStocks: any[] = [];
            for (const stock of matchingStocks) {
              if (await this.matchesConditions(stock, config.conditions, client)) {
                filteredStocks.push(stock);
              }
            }
            matchingStocks = filteredStocks;

            if (matchingStocks.length === 0) {
              console.log(`AlgoEngine: No F&O stocks matched strategy conditions for client ${client.user.name}.`);
              return;
            }

            const sortedStocks = [...matchingStocks].sort((a, b) =>
              action === 'Long' ? a.changePercent - b.changePercent : b.changePercent - a.changePercent
            );

            if (sortedStocks.length < selectPosition) {
              console.log(`AlgoEngine: Only ${sortedStocks.length} stocks available, cannot pick position #${selectPosition} for client ${client.user.name}. Skipping.`);
              return;
            }

            candidateStock = sortedStocks[selectPosition - 1];
          }

          if (candidateStock && config.conditions?.length > 0) {
            if (!await this.matchesConditions(candidateStock, config.conditions, client)) {
              const reason = `Preselected stock ${candidateStock.symbol} (${candidateStock.changePercent.toFixed(2)}%) failed strategy conditions`;
              console.log(`AlgoEngine: ${reason} for ${client.user.name}. Logging FAILED trade.`);
              await this.logFailedTrade(client, strategy, candidateStock.symbol, productParam, 0, reason, { direction, legName: currentLeg.name, legTimeframe, dualLegGroupId: finalDualLegGroupId });
              return;
            }
          }

          console.log(`AlgoEngine: Client ${client.user.name} | Stock ${candidateStock.symbol}(${candidateStock.changePercent}%)`);

          let targetStock: StockQuote | null = null;
          let breakoutEntryPrice = 0;

          lockKey = `${client.id}:${candidateStock.symbol}`;
          if (this.entryLock.has(lockKey)) {
            console.log(`AlgoEngine: Entry already in progress for ${candidateStock.symbol} (${client.user.name}). Skipping.`);
            return;
          }
          this.entryLock.add(lockKey);

          const todayStr = todayStart.toISOString().split('T')[0];
          dbLockKey = `trade_lock_${client.id}_${strategy.id}_${todayStr}`;
          try {
            await prisma.appSettings.create({
              data: { settingKey: dbLockKey, settingValue: 'locked', type: 'lock' }
            });
          } catch (e) {
            console.log(`AlgoEngine DB Lock: Trade already processing for ${client.user.name}. Skipping duplicate execution.`);
            this.entryLock.delete(lockKey);
            return;
          }

          try {
            const existingTrade = await prisma.trade.findFirst({
              where: {
                clientId: client.id,
                strategyId: strategy.id,
                symbol: candidateStock.symbol,
                legName: currentLeg.name,
                createdAt: { gte: todayStart }
              }
            });
            if (existingTrade) {
              console.log(`AlgoEngine: Trade already exists today for ${candidateStock.symbol} ${currentLeg.name} (${client.user.name}). Skipping.`);
              return;
            }

            let candlePrice = candlePriceCache.get(candidateStock.symbol) || 0;
            if (candlePrice === 0 && client.zerodhaApiKey && client.accessToken) {
              const instTokenStr = Object.entries(this.wsLive.instrumentToSymbol).find(([, sym]) => sym === candidateStock.symbol)?.[0];
              if (instTokenStr) {
                try {
                  const today = new Date();
                  const formatKiteDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                  const formatDateOnly = (d: Date) => formatKiteDate(d);

                  const from = formatDateOnly(today);
                  const to = formatDateOnly(today);

                  console.log(`AlgoEngine: Fetching historical data for ${candidateStock.symbol} token=${instTokenStr} from=${from} to=${to}`);
                  const kiteInterval = mapTimeframeToKiteInterval(legTimeframe);
                  const res = await KiteClient.getHistoricalData(client.zerodhaApiKey, client.accessToken, instTokenStr, kiteInterval, from, to);
                  console.log(`AlgoEngine: Historical response for ${candidateStock.symbol}: status=${res.status}, candles=${res.data?.candles?.length ?? 0}`);
                  if (res.status === 'success' && Array.isArray(res.data?.candles) && res.data.candles.length > 0) {
                    const priceIdx: Record<string, number> = { open: 1, high: 2, low: 3, close: 4 };
                    candlePrice = Number(res.data.candles[0][priceIdx[legCandleType]]);
                    candlePriceCache.set(candidateStock.symbol, candlePrice);
                    console.log(`AlgoEngine: Candle price for ${candidateStock.symbol} (${legCandleType}): ${candlePrice}`);
                  } else {
                    console.warn(`AlgoEngine: No candle data for ${candidateStock.symbol} - status: ${res.status}, error: ${res.message ?? 'none'}`);
                  }
                } catch (histErr) {
                  console.error(`AlgoEngine: Historical data fetch failed for ${candidateStock.symbol}:`, histErr);
                }
              } else {
                console.warn(`AlgoEngine: Instrument token not found for ${candidateStock.symbol}`);
              }
            } else if (candlePrice > 0) {
              console.log(`AlgoEngine: Using cached candle price for ${candidateStock.symbol}: ${candlePrice}`);
            }

            if (candlePrice === 0 && client.zerodhaApiKey && client.accessToken) {
              try {
                console.log(`AlgoEngine: Fetching live quote for ${exchangeParam}:${candidateStock.symbol}`);
                const quoteRes = await KiteClient.getQuotes(client.zerodhaApiKey, client.accessToken, [`${exchangeParam}:${candidateStock.symbol}`]);
                if (quoteRes?.status === 'success' && quoteRes.data?.[`${exchangeParam}:${candidateStock.symbol}`]) {
                  const q = quoteRes.data[`${exchangeParam}:${candidateStock.symbol}`];
                  const livePrice = q.last_price || q.ohlc?.high || q.ohlc?.open || 0;
                  if (livePrice > 0) {
                    candlePrice = livePrice;
                    console.log(`AlgoEngine: Using live quote price for ${candidateStock.symbol}: ${candlePrice}`);
                  }
                }
              } catch { }
            }

            if (candlePrice === 0) {
              const fallbackPrice = candidateStock.high || candidateStock.ltp || candidateStock.iep;
              if (fallbackPrice && fallbackPrice > 0) {
                console.log(`AlgoEngine: Kite historical data unavailable for ${candidateStock.symbol}, using fallback price (high/ltp): ${fallbackPrice}`);
                candlePrice = fallbackPrice;
              } else {
                const reason = `Could not determine candle price for ${candidateStock.symbol} and no fallback available`;
                console.log(`AlgoEngine: ${reason}. Logging FAILED trade for ${client.user.name}.`);
                await this.logFailedTrade(client, strategy, candidateStock.symbol, productParam, 0, reason, { direction, legName: currentLeg.name, legTimeframe, dualLegGroupId: finalDualLegGroupId });
                return;
              }
            }

            const bufferPct = legBufferPct;
            if (bufferPct === undefined || bufferPct === null || bufferPct === -1) {
              breakoutEntryPrice = candlePrice;
            } else if (isShortTrade) {
              breakoutEntryPrice = candlePrice * (1 - bufferPct / 100);
            } else {
              breakoutEntryPrice = candlePrice * (1 + bufferPct / 100);
            }

            const currentLtp = candidateStock.ltp || candidateStock.iep || breakoutEntryPrice;
            const hasPriceAction = config.conditions?.some((c: any) => c.indicator === 'Price Action');

            if (legOrderType === 'SL-Market' || !hasPriceAction || (isShortTrade ? currentLtp <= breakoutEntryPrice : currentLtp >= breakoutEntryPrice)) {
              targetStock = candidateStock;
              console.log(`AlgoEngine: ${isShortTrade ? 'Breakdown' : 'Breakout'} confirmed for ${candidateStock.symbol} (${direction}) | Entry: ${breakoutEntryPrice} | LTP: ${currentLtp} | CandlePriceType: ${legCandleType}`);
            } else {
              console.log(`AlgoEngine: ${isShortTrade ? 'Breakdown' : 'Breakout'} not met for ${candidateStock.symbol} (${direction}) | Entry: ${breakoutEntryPrice} | LTP: ${currentLtp}. Skipping.`);
            }
          } catch (checkErr) {
            console.error(`AlgoEngine: Error checking breakout for ${candidateStock.symbol}:`, checkErr);
          }

          if (!targetStock) {
            const reason = `Breakout not met: LTP ${candidateStock.ltp || candidateStock.iep} < breakout entry ${breakoutEntryPrice}`;
            console.log(`AlgoEngine: ${reason} for ${client.user.name}. Logging FAILED trade.`);
            await this.logFailedTrade(client, strategy, candidateStock.symbol, productParam, breakoutEntryPrice, reason, { direction, legName: currentLeg.name, legTimeframe, dualLegGroupId: finalDualLegGroupId });
            return;
          }

          const entryPrice = breakoutEntryPrice;

          if (!config?.stoploss?.fixedPercent) {
            const reason = `stoploss.fixedPercent not configured for strategy "${strategy.name}"`;
            console.log(`AlgoEngine: ${reason}. Logging FAILED trade for ${client.user.name}.`);
            await this.logFailedTrade(client, strategy, candidateStock.symbol, productParam, entryPrice, reason, { direction, legName: currentLeg.name, legTimeframe, dualLegGroupId: finalDualLegGroupId });
            return;
          }
          if (!config?.target?.profitPercent) {
            const reason = `target.profitPercent not configured for strategy "${strategy.name}"`;
            console.log(`AlgoEngine: ${reason}. Logging FAILED trade for ${client.user.name}.`);
            await this.logFailedTrade(client, strategy, candidateStock.symbol, productParam, entryPrice, reason, { direction, legName: currentLeg.name, legTimeframe, dualLegGroupId: finalDualLegGroupId });
            return;
          }
          const slPercent = config.stoploss.fixedPercent;
          const targetPercent = config.target.profitPercent;

          let activeAccessToken = client.accessToken;
          const isAutoLoginPossible = process.env.KITE_AUTO_LOGIN_ENABLED === 'true' && client.zerodhaPassword && client.zerodhaTotpSecret;

          if (!activeAccessToken && !isAutoLoginPossible) {
            const errMsg = 'Skipped: No active Kite connection session, and auto-login credentials (password/TOTP) are not configured.';
            console.log(`AlgoEngine: Skipping client ${client.user.name} - ${errMsg}`);

            await prisma.trade.create({
              data: {
                clientId: client.id, strategyId: strategy.id,
                symbol: targetStock.symbol, orderType: productParam,
                entryPrice: entryPrice, quantity: 0,
                status: 'FAILED', entryTime: new Date(),
                kiteResponse: { message: errMsg },
                direction, legName: currentLeg.name, legTimeframe, dualLegGroupId: finalDualLegGroupId
              }
            });

            await prisma.strategyLog.create({
              data: {
                strategyId: strategy.id,
                message: `Skipped trade execution for ${client.user.name}: No active Kite connection session, and auto-login credentials (password/TOTP) are not configured.`,
                logType: 'warning'
              }
            });
            return;
          }

          let autoLoginErrorStr = '';
          if (process.env.KITE_AUTO_LOGIN_ENABLED === 'true' && client.productTypeId === algoType.id) {
            if (this.todayTokenRefreshed.has(client.id) && activeAccessToken) {
              console.log(`AlgoEngine: Client ${client.user.name} already refreshed today, using existing token.`);
            } else if (client.zerodhaPassword && client.zerodhaTotpSecret) {
              console.log(`AlgoEngine: Auto-login is enabled. Refreshing session dynamically for client: ${client.user.name}`);
              const autoLoginRes = await performKiteAutoLogin(client.id);
              if (autoLoginRes.success && autoLoginRes.accessToken) {
                activeAccessToken = autoLoginRes.accessToken;
                this.todayTokenRefreshed.add(client.id);
              } else {
                autoLoginErrorStr = autoLoginRes.error || 'Unknown auto-login error';
                console.warn(`AlgoEngine: Dynamic auto-login failed for ${client.user.name}: ${autoLoginErrorStr}`);
              }
            } else {
              autoLoginErrorStr = 'Missing password or TOTP secret';
              console.log(`AlgoEngine: Auto-login is enabled but client ${client.user.name} is missing password or TOTP secret. Skipping dynamic auto-refresh.`);
            }
          }

          if (!activeAccessToken) {
            const errMsg = `Skipped: Kite session could not be established. ${autoLoginErrorStr ? `Reason: ${autoLoginErrorStr}` : '(auto-login failed or manual login required)'}`;
            console.log(`AlgoEngine: Skipping client ${client.user.name} - ${errMsg}`);

            await prisma.trade.create({
              data: {
                clientId: client.id, strategyId: strategy.id,
                symbol: targetStock.symbol, orderType: productParam,
                entryPrice: entryPrice, quantity: 0,
                status: 'FAILED', entryTime: new Date(),
                kiteResponse: { message: errMsg },
                direction, legName: currentLeg.name, legTimeframe, dualLegGroupId: finalDualLegGroupId
              }
            });

            await prisma.strategyLog.create({
              data: {
                strategyId: strategy.id,
                message: `Skipped trade execution for ${client.user.name}: ${errMsg}`,
                logType: 'error'
              }
            });
            await logSystemEvent({
              action: 'KITE SESSION ERROR',
              newValue: `Client: ${client.user.name} | ${errMsg}`
            });
            return;
          }

          const cachedMargin = this.marginCache.get(client.id);
          const dbCapital = Number(client.capital);

          // Agar DB capital -1 hai to DB ko ignore karo — sirf live margin use hoga
          const dbDisabled = dbCapital === -1;

          let marginOrApi: number;

          if (cachedMargin !== undefined) {
            marginOrApi = cachedMargin;
            console.log(`AlgoEngine: Using cached margin for ${client.user.name}: ₹${marginOrApi}`);
          } else {
            try {
              console.log(`AlgoEngine: Fetching live Zerodha margins for client ${client.user.name}...`);
              const marginRes = await KiteClient.getMargins(client.zerodhaApiKey!, activeAccessToken);
              if (marginRes && marginRes.status === 'success' && marginRes.data?.equity?.net !== undefined) {
                marginOrApi = Number(marginRes.data.equity.net);
                this.marginCache.set(client.id, marginOrApi);
                console.log(`AlgoEngine: Successfully fetched live Net Cash Balance for ${client.user.name}: ₹${marginOrApi}`);
              } else {
                marginOrApi = dbDisabled ? 0 : dbCapital;
                console.warn(`AlgoEngine: Margin API response unsuccessful for ${client.user.name}. Using DB capital: ₹${marginOrApi}`);
              }
            } catch (marginErr: any) {
              marginOrApi = dbDisabled ? 0 : dbCapital;
              console.error(`AlgoEngine: Error fetching live Zerodha margins for ${client.user.name}. Using DB capital: ₹${marginOrApi}`, marginErr);
            }
          }

          // Pick the LOWER of (marginCache/live-API value) and (DB capital)
          // This ensures we never risk more than the DB record allows.
          // If DB capital is -1, DB is disabled — use only live margin.
          let clientCapital = dbDisabled ? marginOrApi : Math.min(marginOrApi, dbCapital);
          console.log(`AlgoEngine: Final clientCapital for ${client.user.name} = ${dbDisabled ? 'live-only' : `min(margin=${marginOrApi}, db=${dbCapital})`} = ₹${clientCapital}`);

          const configRisk = config?.riskManagement?.riskPerTrade;
          if (!configRisk || configRisk <= 0) {
            console.log(`AlgoEngine: riskManagement.riskPerTrade not configured (or invalid) for strategy "${strategy.name}". Skipping trade for ${client.user.name}.`);
            return;
          }
          const riskPercent = configRisk;
          const marginRate = config?.riskManagement?.misMarginRate;

          let capitalAtRisk = clientCapital * (riskPercent / 100);

          const capitalAllocPct = config?.riskManagement?.capitalAllocation;
          if (capitalAllocPct !== undefined && capitalAllocPct !== null && capitalAllocPct > 0) {
            const allocLimit = clientCapital * (capitalAllocPct / 100);
            if (capitalAtRisk > allocLimit) {
              capitalAtRisk = allocLimit;
            }
          }

          const dbCapitalLimit = Number(client.capital);
          if (dbCapitalLimit !== -1 && capitalAtRisk > dbCapitalLimit) {
            capitalAtRisk = dbCapitalLimit;
          }

          if (!config?.stoploss?.type) {
            console.log(`AlgoEngine: stoploss.type not configured for strategy "${strategy.name}". Skipping trade for ${client.user.name}.`);
            return;
          }
          const slType = config.stoploss.type;
          let slPoints: number;
          if (slType === 'Fixed Points') {
            if (!config?.stoploss?.fixedPoints) {
              console.log(`AlgoEngine: stoploss.fixedPoints not configured for strategy "${strategy.name}". Skipping trade for ${client.user.name}.`);
              return;
            }
            slPoints = config.stoploss.fixedPoints;
          } else if (slType === 'Risk %') {
            if (!config?.stoploss?.riskPercent) {
              console.log(`AlgoEngine: stoploss.riskPercent not configured for strategy "${strategy.name}". Skipping trade for ${client.user.name}.`);
              return;
            }
            slPoints = entryPrice * (config.stoploss.riskPercent / 100);
          } else {
            slPoints = entryPrice * (slPercent / 100);
          }
          if (slPoints <= 0) slPoints = 1;

          let quantity = Math.floor(capitalAtRisk / slPoints);

          if (marginRate !== undefined && marginRate !== null && marginRate > 0) {
            const qtyByBuyingPower = Math.floor(clientCapital / (entryPrice * marginRate));
            quantity = Math.min(quantity, qtyByBuyingPower);
          }

          if (quantity <= 0) {
            const errMsg = `Skipped: Calculated quantity is 0 (capitalAtRisk ₹${capitalAtRisk.toFixed(2)} / slPoints ₹${slPoints.toFixed(2)} = 0).`;
            console.log(`AlgoEngine: Calculated quantity is 0 for client ${client.user.name} (CapitalAtRisk: ₹${capitalAtRisk.toFixed(2)}, SL Points: ₹${slPoints.toFixed(2)}). Skipping trade.`);

            await prisma.trade.create({
              data: {
                clientId: client.id, strategyId: strategy.id,
                symbol: targetStock.symbol, orderType: productParam,
                entryPrice: entryPrice, quantity: 0,
                status: 'FAILED', entryTime: new Date(),
                kiteResponse: { message: errMsg }
              }
            });

            await prisma.strategyLog.create({
              data: { strategyId: strategy.id, message: errMsg, logType: 'error' }
            });
            return;
          }

          const killSwitch = config?.riskManagement?.killSwitch === true;
          if (killSwitch) {
            console.log(`AlgoEngine: KillSwitch ON for strategy "${strategy.name}". Skipping trade for ${client.user.name}.`);
            return;
          }

          const maxOpen = config?.riskManagement?.maxOpenPositions;
          if (maxOpen !== undefined && maxOpen !== null && maxOpen !== -1) {
            const openCount = await prisma.trade.count({
              where: { clientId: client.id, strategyId: strategy.id, status: 'open' }
            });
            if (openCount >= maxOpen) {
              console.log(`AlgoEngine: Max open positions (${maxOpen}) reached for ${client.user.name}. Skipping.`);
              return;
            }
          }

          const todayStartLocal = new Date();
          todayStartLocal.setHours(0, 0, 0, 0);
          const todayTrades = await prisma.trade.findMany({
            where: { clientId: client.id, createdAt: { gte: todayStartLocal }, pnl: { not: null } }
          });
          const todayPnl = todayTrades.reduce((sum, t) => sum + Number(t.pnl || 0), 0);
          const maxDailyLoss = config?.riskManagement?.maxDailyLoss;
          if (maxDailyLoss !== undefined && maxDailyLoss !== null && maxDailyLoss !== -1 && todayPnl <= -Number(maxDailyLoss)) {
            console.log(`AlgoEngine: Max daily loss (₹${maxDailyLoss}) reached for ${client.user.name} (PnL: ₹${todayPnl}). Skipping.`);
            return;
          }
          const maxDailyProfit = config?.riskManagement?.maxDailyProfit;
          if (maxDailyProfit !== undefined && maxDailyProfit !== null && maxDailyProfit !== -1 && todayPnl >= Number(maxDailyProfit)) {
            console.log(`AlgoEngine: Max daily profit (₹${maxDailyProfit}) reached for ${client.user.name} (PnL: ₹${todayPnl}). Skipping.`);
            return;
          }

          const marketProtectionVal = currentLeg.tradeAction?.marketProtection !== undefined
            ? Number(currentLeg.tradeAction.marketProtection)
            : -1;

           // Fetch fresh circuit limits first to adjust entry price
          let adjustedEntryPrice = entryPrice;
          const freshLimits = await this.getFreshCircuitLimits(client, exchangeParam, targetStock.symbol);
          if (freshLimits) {
            const { upper, lower } = freshLimits;
            if (upper > 0 && lower > 0) {
              if (direction === 'LONG') {
                if (adjustedEntryPrice > upper) {
                  adjustedEntryPrice = upper;
                  console.log(`AlgoEngine: Capped entry price to Upper Circuit for ${targetStock.symbol} LONG: ₹${adjustedEntryPrice}`);
                } else if (adjustedEntryPrice < lower) {
                  adjustedEntryPrice = lower;
                  console.log(`AlgoEngine: Raised entry price to Lower Circuit for ${targetStock.symbol} LONG: ₹${adjustedEntryPrice}`);
                }
              } else {
                if (adjustedEntryPrice < lower) {
                  adjustedEntryPrice = lower;
                  console.log(`AlgoEngine: Raised entry price to Lower Circuit for ${targetStock.symbol} SHORT: ₹${adjustedEntryPrice}`);
                } else if (adjustedEntryPrice > upper) {
                  adjustedEntryPrice = upper;
                  console.log(`AlgoEngine: Capped entry price to Upper Circuit for ${targetStock.symbol} SHORT: ₹${adjustedEntryPrice}`);
                }
              }
            }
          }

          if (client.zerodhaApiKey && activeAccessToken) {
            adjustedEntryPrice = await getTickSizeAndRound(client.zerodhaApiKey, activeAccessToken, exchangeParam, targetStock.symbol, adjustedEntryPrice);
          }

          const stopLoss = isShortTrade ? adjustedEntryPrice + slPoints : adjustedEntryPrice - slPoints;

          if (!config?.target?.type) {
            console.log(`AlgoEngine: target.type not configured for strategy "${strategy.name}". Skipping trade for ${client.user.name}.`);
            return;
          }
          const targetType = config.target.type;
          let target: number;
          if (targetType === 'Risk Reward Ratio') {
            if (!config?.target?.riskRewardRatio) {
              console.log(`AlgoEngine: target.riskRewardRatio not configured for strategy "${strategy.name}". Skipping trade for ${client.user.name}.`);
              return;
            }
            const rr = config.target.riskRewardRatio;
            target = isShortTrade ? adjustedEntryPrice - (slPoints * rr) : adjustedEntryPrice + (slPoints * rr);
          } else {
            target = isShortTrade ? adjustedEntryPrice * (1 - targetPercent / 100) : adjustedEntryPrice * (1 + targetPercent / 100);
          }

          // Keep original calculated values
          const rawEntryPrice = entryPrice;
          const rawStopLoss = isShortTrade ? rawEntryPrice + slPoints : rawEntryPrice - slPoints;
          const rawTarget = targetType === 'Risk Reward Ratio'
            ? (isShortTrade ? rawEntryPrice - (slPoints * config.target.riskRewardRatio) : rawEntryPrice + (slPoints * config.target.riskRewardRatio))
            : (isShortTrade ? rawEntryPrice * (1 - targetPercent / 100) : rawEntryPrice * (1 + targetPercent / 100));

          // Round values to tick size dynamically using Zerodha Quote API
          let finalEntryPrice = adjustedEntryPrice;
          let finalStopLoss = stopLoss;
          let finalTarget = target;

          if (client.zerodhaApiKey && activeAccessToken) {
            finalStopLoss = await getTickSizeAndRound(client.zerodhaApiKey, activeAccessToken, exchangeParam, targetStock.symbol, stopLoss);
            finalTarget = await getTickSizeAndRound(client.zerodhaApiKey, activeAccessToken, exchangeParam, targetStock.symbol, target);
          }

          let orderTypeParam: 'MARKET' | 'LIMIT' | 'SL' | 'SL-M' = 'MARKET';
          let priceParam: number | undefined = undefined;
          let triggerPriceParam: number | undefined = undefined;
          const configOrderType = legOrderType;

          if (configOrderType === 'Limit') {
            orderTypeParam = 'LIMIT';
            priceParam = finalEntryPrice;
          } else if (configOrderType === 'SL-Limit') {
            orderTypeParam = 'SL';
            triggerPriceParam = finalEntryPrice;
            if (legBufferPct === undefined || legBufferPct === null || legBufferPct === -1) {
              console.log(`AlgoEngine: legBufferPct not configured for leg "${currentLeg.name}". Skipping trade for ${client.user.name}.`);
              return;
            }
            const rawLimitPrice = isShortTrade
              ? entryPrice * (1 - legBufferPct / 100)
              : entryPrice * (1 + legBufferPct / 100);
            if (client.zerodhaApiKey && activeAccessToken) {
              priceParam = await getTickSizeAndRound(client.zerodhaApiKey, activeAccessToken, exchangeParam, targetStock.symbol, rawLimitPrice);
            } else {
              priceParam = Number(rawLimitPrice.toFixed(2));
            }
          } else if (configOrderType === 'SL-Market') {
            orderTypeParam = 'SL-M';
            triggerPriceParam = finalEntryPrice;
          } else {
            orderTypeParam = 'MARKET';
          }

          console.log(`AlgoEngine: Placing trade for ${client.user.name} (${direction}) under database strategy "${strategy.name}" - ${quantity} qty of ${targetStock.symbol} @ ${finalEntryPrice} using ${orderTypeParam} order`);

          let orderId = '';
          let orderStatus = 'open';
          let orderRes: any = null;
          let tradeId = '';

          if (client.zerodhaApiKey && activeAccessToken) {
            try {
              const orderParams = {
                exchange: exchangeParam,
                tradingsymbol: targetStock.symbol,
                transaction_type: isShortTrade ? 'SELL' as const : 'BUY' as const,
                quantity: quantity,
                order_type: orderTypeParam as any,
                product: productParam as any,
                validity: 'DAY' as const,
                price: priceParam,
                trigger_price: triggerPriceParam,
                ...(orderTypeParam === 'MARKET' || orderTypeParam === 'SL-M' ? { market_protection: marketProtectionVal } : {})
              };

              orderRes = await KiteClient.placeOrder(client.zerodhaApiKey, activeAccessToken, orderParams);

              if (orderRes && orderRes.status === 'error' &&
                (orderRes.message?.includes('After Market Order') ||
                  orderRes.message?.includes('AMO') ||
                  orderRes.message?.includes('closed') ||
                  orderRes.message?.includes('variety'))) {
                console.log(`AlgoEngine: Retrying order as AMO (After Market Order) because market is closed.`);
                orderRes = await KiteClient.placeOrder(client.zerodhaApiKey, activeAccessToken, { ...orderParams, variety: 'amo' });
              }

              console.log('AlgoEngine: Kite order placement response:', orderRes);
              if (orderRes && orderRes.status === 'success' && orderRes.data?.order_id) {
                orderId = orderRes.data.order_id;
                try {
                  const pendingTrade = await prisma.trade.create({
                    data: {
                      clientId: client.id, strategyId: strategy.id,
                      symbol: targetStock.symbol, orderType: productParam,
                      entryPrice: finalEntryPrice, quantity: quantity,
                      stopLoss: finalStopLoss, target: finalTarget,
                      originalEntryPrice: rawEntryPrice,
                      originalStopLoss: rawStopLoss,
                      originalTarget: rawTarget,
                      status: 'pending', entryTime: new Date(),
                      entryOrderId: orderId,
                      entryOrderStatus: 'OPEN',
                      kiteResponse: orderRes,
                      direction, legName: currentLeg.name, legTimeframe, dualLegGroupId: finalDualLegGroupId
                    }
                  });
                  tradeId = pendingTrade.id;
                  console.log(`AlgoEngine: Pending trade saved for ${client.user.name} - ${targetStock.symbol} (tradeId: ${tradeId})`);
                } catch (pendingErr) {
                  console.error(`AlgoEngine: Failed to save pending trade for ${client.user.name}:`, pendingErr);
                }
              } else {
                const errMsg = orderRes?.message || 'Zerodha API returned error status';
                console.warn(`AlgoEngine: Kite order response status was not success for ${client.user.name}. Error: ${errMsg}`);
                await prisma.trade.create({
                  data: {
                    clientId: client.id, strategyId: strategy.id,
                    symbol: targetStock.symbol, orderType: productParam,
                    entryPrice: finalEntryPrice, quantity: quantity,
                    stopLoss: finalStopLoss, target: finalTarget,
                    originalEntryPrice: rawEntryPrice,
                    originalStopLoss: rawStopLoss,
                    originalTarget: rawTarget,
                    status: 'FAILED', entryTime: new Date(),
                    kiteResponse: orderRes || { error: errMsg },
                    direction, legName: currentLeg.name, legTimeframe, dualLegGroupId: finalDualLegGroupId
                  }
                });
                await prisma.strategyLog.create({
                  data: { strategyId: strategy.id, message: `Kite order failed for ${client.user.name}: ${errMsg}`, logType: 'error' }
                });
                return;
              }
            } catch (kiteErr: any) {
              console.error(`AlgoEngine: Failed to place order on Zerodha Kite for ${client.user.name}:`, kiteErr);
              await prisma.trade.create({
                data: {
                  clientId: client.id, strategyId: strategy.id,
                  symbol: targetStock.symbol, orderType: productParam,
                  entryPrice: finalEntryPrice, quantity: quantity,
                  stopLoss: finalStopLoss, target: finalTarget,
                  originalEntryPrice: rawEntryPrice,
                  originalStopLoss: rawStopLoss,
                  originalTarget: rawTarget,
                  status: 'FAILED', entryTime: new Date(),
                  kiteResponse: { error: kiteErr.message || String(kiteErr) },
                  direction, legName: currentLeg.name, legTimeframe, dualLegGroupId: finalDualLegGroupId
                }
              });
              await prisma.strategyLog.create({
                data: { strategyId: strategy.id, message: `Kite order failed for ${client.user.name}: ${kiteErr.message || 'API error'}.`, logType: 'error' }
              });
              return;
            }
          } else {
            console.warn(`AlgoEngine: Missing API key or access token for ${client.user.name}. Aborting trade.`);
            return;
          }

          let actualEntryPrice = finalEntryPrice;
          let slOrderId = '';
          let targetOrderId = '';

          let entryFilled = false;
          let latestOrderStatus = 'OPEN';

          // Entry order place hone ke baad — poll karo fill hone tak
          if (orderId && client.zerodhaApiKey && activeAccessToken) {
            const maxPolls = 30; // 30 × 2s = 60s wait for trigger
            for (let attempt = 0; attempt < maxPolls; attempt++) {
              await new Promise(r => setTimeout(r, 2000));
              try {
                const orderStatusRes = await KiteClient.getOrderById(client.zerodhaApiKey, activeAccessToken, orderId);
                const latestOrder = getLatestOrderState(orderStatusRes?.data);
                if (latestOrder?.status) {
                  latestOrderStatus = latestOrder.status;
                }
                const isComplete = latestOrder?.status === 'COMPLETE';
                if (orderStatusRes?.status === 'success' && isComplete) {
                  const filledAvgPrice = latestOrder?.average_price || latestOrder?.filled_price || 0;
                  if (filledAvgPrice && Number(filledAvgPrice) > 0) {
                    actualEntryPrice = Number(filledAvgPrice);
                  }
                  console.log(`AlgoEngine: Entry order ${orderId} COMPLETE at avg price ₹${actualEntryPrice}`);
                  entryFilled = true;

                  // Entry fill hote hi SL + Target place karo
                  if (client.zerodhaApiKey && activeAccessToken) {
                    // Fetch fresh circuit limits right before placing SL/Target
                    const freshLimitsSLT = await this.getFreshCircuitLimits(client, exchangeParam, targetStock.symbol);
                    if (freshLimitsSLT) {
                      const { upper, lower } = freshLimitsSLT;
                      if (upper > 0 && lower > 0) {
                        if (direction === 'LONG') {
                          if (finalStopLoss < lower) {
                            finalStopLoss = lower + 0.05;
                            console.log(`AlgoEngine: Adjusted SL to Lower Circuit + 0.05 for ${targetStock.symbol} LONG: ₹${finalStopLoss}`);
                          }
                          if (finalTarget > upper) {
                            finalTarget = upper;
                            console.log(`AlgoEngine: Adjusted Target to Upper Circuit for ${targetStock.symbol} LONG: ₹${finalTarget}`);
                          }
                        } else { // SHORT
                          if (finalStopLoss > upper) {
                            finalStopLoss = upper - 0.05;
                            console.log(`AlgoEngine: Adjusted SL to Upper Circuit - 0.05 for ${targetStock.symbol} SHORT: ₹${finalStopLoss}`);
                          }
                          if (finalTarget < lower) {
                            finalTarget = lower;
                            console.log(`AlgoEngine: Adjusted Target to Lower Circuit for ${targetStock.symbol} SHORT: ₹${finalTarget}`);
                          }
                        }
                        // Round again
                        finalStopLoss = await getTickSizeAndRound(client.zerodhaApiKey, activeAccessToken, exchangeParam, targetStock.symbol, finalStopLoss);
                        finalTarget = await getTickSizeAndRound(client.zerodhaApiKey, activeAccessToken, exchangeParam, targetStock.symbol, finalTarget);
                      }
                    }

                    try {
                      const slParams = {
                        exchange: exchangeParam,
                        tradingsymbol: targetStock.symbol,
                        transaction_type: isShortTrade ? 'BUY' as const : 'SELL' as const,
                        quantity: quantity,
                        order_type: 'SL-M' as const,
                        product: productParam as any,
                        validity: 'DAY' as const,
                        trigger_price: finalStopLoss,
                        market_protection: marketProtectionVal
                      };
                      const slRes = await KiteClient.placeOrder(client.zerodhaApiKey, activeAccessToken, slParams);
                      if (slRes?.status === 'success' && slRes.data?.order_id) {
                        slOrderId = slRes.data.order_id;
                        console.log(`AlgoEngine: SL-M order placed: ${slOrderId} for ${targetStock.symbol} @ trigger ₹${finalStopLoss}`);
                      } else {
                        console.warn(`AlgoEngine: SL-M order failed: ${slRes?.message || 'unknown'}`);
                      }
                    } catch (slErr) {
                      console.error(`AlgoEngine: Error placing SL-M order:`, slErr);
                    }

                    try {
                      const targetParams = {
                        exchange: exchangeParam,
                        tradingsymbol: targetStock.symbol,
                        transaction_type: isShortTrade ? 'BUY' as const : 'SELL' as const,
                        quantity: quantity,
                        order_type: 'LIMIT' as const,
                        product: productParam as any,
                        validity: 'DAY' as const,
                        price: finalTarget
                      };
                      const targetRes = await KiteClient.placeOrder(client.zerodhaApiKey, activeAccessToken, targetParams);
                      if (targetRes?.status === 'success' && targetRes.data?.order_id) {
                        targetOrderId = targetRes.data.order_id;
                        console.log(`AlgoEngine: Target LIMIT order placed: ${targetOrderId} for ${targetStock.symbol} @ ₹${finalTarget}`);
                      } else {
                        console.warn(`AlgoEngine: Target LIMIT order failed: ${targetRes?.message || 'unknown'}`);
                      }
                    } catch (tgtErr) {
                      console.error(`AlgoEngine: Error placing Target LIMIT order:`, tgtErr);
                    }
                  }
                  break;
                }
                const orderCancelled = latestOrder?.status === 'CANCELLED' || latestOrder?.status === 'REJECTED';
                if (orderCancelled) {
                  const cancelStatus = latestOrder?.status || 'unknown';
                  console.warn(`AlgoEngine: Entry order ${orderId} ${cancelStatus}. Aborting trade.`);
                  orderId = '';
                  break;
                }
                if (attempt === 0 || attempt === maxPolls - 1 || attempt % 5 === 4) {
                  const pollStatus = latestOrder?.status || 'unknown';
                  console.log(`AlgoEngine: Entry order status: ${pollStatus} (poll ${attempt + 1}/${maxPolls})`);
                }
              } catch (pollErr) {
                console.warn(`AlgoEngine: Error polling entry order (attempt ${attempt + 1}):`, pollErr);
              }
            }
          }

          if (!orderId) {
            if (tradeId) {
              await prisma.trade.update({
                where: { id: tradeId },
                data: { status: 'FAILED', kiteResponse: { error: 'Entry order cancelled or rejected' } }
              });
            } else {
              await prisma.trade.create({
                data: {
                  clientId: client.id, strategyId: strategy.id,
                  symbol: targetStock.symbol, orderType: productParam,
                  entryPrice: actualEntryPrice, quantity: quantity,
                  stopLoss: finalStopLoss, target: finalTarget,
                  originalEntryPrice: rawEntryPrice,
                  originalStopLoss: rawStopLoss,
                  originalTarget: rawTarget,
                  status: 'FAILED', entryTime: new Date(),
                  kiteResponse: { error: 'Entry order cancelled or rejected' },
                  direction, legName: currentLeg.name, legTimeframe, dualLegGroupId: finalDualLegGroupId
                }
              });
            }
            return;
          }

          if (!entryFilled) {
            console.log(`AlgoEngine: Entry order ${orderId} placed (trigger pending). SL/Target will be placed by monitoring scheduler once entry fills.`);
          }

          if (tradeId) {
            await prisma.trade.update({
              where: { id: tradeId },
              data: {
                entryPrice: actualEntryPrice, quantity: quantity,
                stopLoss: finalStopLoss, target: finalTarget,
                status: 'open',
                entryTime: new Date(),
                entryOrderStatus: entryFilled ? 'filled' : (latestOrderStatus === 'COMPLETE' ? 'filled' : latestOrderStatus),
                slOrderId: slOrderId || null,
                targetOrderId: targetOrderId || null,
                slTriggerPrice: finalStopLoss,
                kiteResponse: orderRes,
                direction, legName: currentLeg.name, legTimeframe, dualLegGroupId: finalDualLegGroupId
              }
            });
          } else {
            await prisma.trade.create({
              data: {
                clientId: client.id, strategyId: strategy.id,
                symbol: targetStock.symbol, orderType: productParam,
                entryPrice: actualEntryPrice, quantity: quantity,
                stopLoss: finalStopLoss, target: finalTarget,
                originalEntryPrice: rawEntryPrice,
                originalStopLoss: rawStopLoss,
                originalTarget: rawTarget,
                status: 'open',
                entryTime: new Date(),
                entryOrderId: orderId,
                entryOrderStatus: entryFilled ? 'filled' : (latestOrderStatus === 'COMPLETE' ? 'filled' : latestOrderStatus),
                slOrderId: slOrderId || null,
                targetOrderId: targetOrderId || null,
                slTriggerPrice: finalStopLoss,
                kiteResponse: orderRes,
                direction, legName: currentLeg.name, legTimeframe, dualLegGroupId: finalDualLegGroupId
              }
            });
          }
          this.wsLive.subscribeSymbols([targetStock.symbol]);

          const tradeActionLabel = isShortTrade ? 'Sold (Short)' : 'Bought (Long)';
          await prisma.strategyLog.create({
            data: {
              strategyId: strategy.id,
              message: `Intraday Trade Initiated for ${client.user.name}: ${tradeActionLabel} ${quantity} shares of ${targetStock.symbol} at entry price ₹${actualEntryPrice.toFixed(2)} using config from DB strategy "${strategy.name}". Capital at risk: ₹${capitalAtRisk.toFixed(2)}. Target: ₹${target.toFixed(2)} (${targetPercent}%), Stop Loss: ₹${stopLoss.toFixed(2)} (${slPercent}%). Entry Order: ${orderId}, SL Order: ${slOrderId || 'N/A'}, Target Order: ${targetOrderId || 'N/A'}`,
              logType: 'trade'
            }
          });

          if (finalAdminId) {
            await prisma.auditLog.create({
              data: {
                adminId: finalAdminId,
                action: 'AUTO TRADE INITIATED',
                oldValue: null,
                newValue: `Client: ${client.user.name} | Strategy: ${strategy.name} | Stock: ${targetStock.symbol} | Qty: ${quantity} | Entry: ${actualEntryPrice.toFixed(2)} | Dir: ${direction}`
              }
            }).catch(() => { });
          }

        } catch (clientErr: any) {
          console.error(`AlgoEngine: Error executing pre-open trade for client ${client.id}:`, clientErr);
        } finally {
          this.entryLock.delete(lockKey);
          if (typeof dbLockKey !== 'undefined' && dbLockKey) {
            prisma.appSettings.delete({ where: { settingKey: dbLockKey } }).catch(() => {});
          }
        }
      };

      console.log(`AlgoEngine: Processing ${clients.length} clients with concurrency ${BATCH_SIZE}...`);
      await concurrentMap(clients, client => processClientEntry(client), BATCH_SIZE);

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

      const [dataRes, niftySymbols, bankNiftySymbols, smeSymbols] = await Promise.all([
        fetch(API_ENDPOINTS.NSE_PRE_OPEN, { headers: { ...headers, 'Cookie': cookies } }),
        fetchIndexSymbols('NIFTY'),
        fetchIndexSymbols('BANKNIFTY'),
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
            symbol, name, ltp, open, high, low, prevClose, volume, change, changePercent,
            iep, final: ltp, finalQuantity: volume, value, ffmCap,
            nm52wH: nseItem.metadata.yearHigh || parseFloat((prevClose * 1.25).toFixed(2)),
            nm52wL: nseItem.metadata.yearLow || parseFloat((prevClose * 0.75).toFixed(2)),
            isNifty50: niftySymbols.includes(symbol),
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
      day: '2-digit', month: 'short', year: 'numeric'
    });

    const isCacheExpired = this.preOpenCacheDate !== todayDateStr;
    const canRefetch = Date.now() - this.lastPreOpenFetchTime > 5 * 60 * 1000;

    if (this.preOpenCache.length === 0 || (isCacheExpired && canRefetch)) {
      console.log(`AlgoEngine: Pre-open cache empty or expired for today. Fetching fresh NSE pre-open data...`);
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
        batches.map(batch => {
          const queryParams = batch.map(sym => `i=NSE:${sym}`).join('&');
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
        const failedCount = batchResults.filter(r => r.status === 'rejected').length;
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

  private async logFailedTrade(
    client: any,
    strategy: any,
    symbol: string,
    orderType: string,
    entryPrice: number,
    reason: string,
    legFields?: { direction: string; legName: string; legTimeframe: string; dualLegGroupId: string | null }
  ): Promise<void> {
    try {
      await prisma.trade.create({
        data: {
          clientId: client.id,
          strategyId: strategy.id,
          symbol,
          orderType,
          entryPrice: entryPrice || 0,
          quantity: 0,
          status: 'FAILED',
          entryTime: new Date(),
          kiteResponse: { message: reason },
          ...(legFields ? { direction: legFields.direction, legName: legFields.legName, legTimeframe: legFields.legTimeframe, dualLegGroupId: legFields.dualLegGroupId } : {})
        }
      });
      await prisma.strategyLog.create({
        data: {
          strategyId: strategy.id,
          message: `Trade skipped for ${client.user.name} (${symbol}): ${reason}`,
          logType: 'warning'
        }
      });
      console.log(`AlgoEngine: Logged FAILED trade for ${client.user.name} (${symbol}) - ${reason}`);
    } catch (e) {
      console.error(`AlgoEngine: Failed to log failed trade for ${symbol}:`, e);
    }
  }
}

const globalForAlgo = global as unknown as { algoEngine: AlgoEngineService; initPromise?: Promise<void> };
export const algoEngine = globalForAlgo.algoEngine || new AlgoEngineService();
if (!globalForAlgo.initPromise) {
  globalForAlgo.initPromise = algoEngine.init();
}
if (process.env.NODE_ENV !== 'production') globalForAlgo.algoEngine = algoEngine;
