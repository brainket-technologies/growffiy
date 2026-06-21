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

  private preselectedForClient: Map<string, StockQuote> = new Map();
  todayTokenRefreshed: Set<string> = new Set();

  private conditionCache: Map<string, boolean> = new Map();
  private conditionCacheDate: string = '';

  private lastHttpFetchTime = 0;
  private initialized = false;

  private wsLive: WsLiveFeed;
  private tradingScheduler: TradingScheduler;

  constructor() {
    this.wsLive = new WsLiveFeed(
      () => this.preOpenCache,
      () => this.preselectedForClient
    );
    this.tradingScheduler = new TradingScheduler(
      {
        todayTokenRefreshed: this.todayTokenRefreshed,
        getAlgoSetting: (key, defaultValue) => this.getAlgoSetting(key, defaultValue),
        getPreOpenStocks: () => this.getPreOpenStocks(),
        preSelectAllClients: (strategyId) => this.preSelectAllClients(strategyId),
        executePreOpenTrades: (adminId, mockStocks, strategyId) => this.executePreOpenTrades(adminId, mockStocks, strategyId),
      },
      this.wsLive
    );
  }

  async init() {
    if (this.initialized) return;
    this.initialized = true;
    await this.wsLive.initialize();
    this.tradingScheduler.startDailyTokenRefreshScheduler();
    this.tradingScheduler.startDailyPreOpenStrategyScheduler();
    this.tradingScheduler.startActiveTradesMonitoringScheduler();
  }

  async getAlgoSetting(key: string, defaultValue: string): Promise<string> {
    try {
      const setting = await prisma.appSettings.findUnique({ where: { settingKey: key } });
      return setting?.settingValue || defaultValue;
    } catch {
      return defaultValue;
    }
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
        const candles = await this.wsLive.fetchHistoricalCandles(client, stock.symbol, '5minute', 5);
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
    const preOpenStocks = this.preOpenCache.length > 0
      ? this.preOpenCache
      : await this.getPreOpenStocks();

    if (!preOpenStocks || preOpenStocks.length === 0) {
      console.log('AlgoEngine preSelect: No pre-open stocks available. Skipping.');
      return;
    }

    const where: any = {
      tradingStatus: 'active',
      subscriptionStatus: 'active',
      strategyId: { not: null }
    };
    if (strategyId) where.strategyId = strategyId;

    const clients = await prisma.client.findMany({
      where,
      include: { user: true, strategy: true }
    });

    if (clients.length === 0) {
      console.log('AlgoEngine preSelect: No active clients.');
      return;
    }

    if (!strategyId) {
      this.preselectedForClient.clear();
    } else {
      for (const client of clients) {
        this.preselectedForClient.delete(client.id);
      }
    }

    const preSelectClient = async (client: any) => {
      try {
        const strategy = client.strategy;
        if (!strategy || strategy.status !== 'active') return;

        const config = strategy.configJson ? JSON.parse(strategy.configJson) : null;
        if (!config) return;

        if (!config.basicInfo?.segment || !config.tradeAction?.action || !config.basicInfo?.selectPosition) {
          console.log(`AlgoEngine preSelect: Strategy config missing required fields (segment/action/selectPosition) for client ${client.user.name}. Skipping.`);
          return;
        }
        const segment = config.basicInfo.segment;
        const action = config.tradeAction.action;
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
          console.log(`AlgoEngine preSelect: No matching stocks for client ${client.user.name}.`);
          return;
        }

        const filteredStocks: any[] = [];
        for (const stock of matchingStocks) {
          if (await this.matchesConditions(stock, config.conditions, client)) {
            filteredStocks.push(stock);
          }
        }
        matchingStocks = filteredStocks;

        if (matchingStocks.length === 0) {
          console.log(`AlgoEngine preSelect: No stocks passed conditions for client ${client.user.name}.`);
          return;
        }

        const sortedStocks = [...matchingStocks].sort((a, b) =>
          action === 'Long' ? a.changePercent - b.changePercent : b.changePercent - a.changePercent
        );

        if (sortedStocks.length < selectPosition) {
          console.log(`AlgoEngine preSelect: Only ${sortedStocks.length} stocks for ${client.user.name}, cannot pick #${selectPosition}.`);
          return;
        }

        const selected = sortedStocks[selectPosition - 1];
        this.preselectedForClient.set(client.id, selected);
        this.wsLive.subscribeSymbols([selected.symbol]);
        console.log(`AlgoEngine preSelect: ${client.user.name} → #${selectPosition} ${selected.symbol}(${selected.changePercent}%)`);
      } catch (err) {
        console.error(`AlgoEngine preSelect: Error for client ${client.user.name}:`, err);
      }
    };

    const PRE_SELECT_CONCURRENCY = 10;
    for (let i = 0; i < clients.length; i += PRE_SELECT_CONCURRENCY) {
      const batch = clients.slice(i, i + PRE_SELECT_CONCURRENCY);
      await Promise.allSettled(batch.map(client => preSelectClient(client)));
    }

    console.log(`AlgoEngine preSelect: ${this.preselectedForClient.size}/${clients.length} clients have a preselected stock ready.`);
  }

  public async executePreOpenTrades(adminId: string, mockStocks?: StockQuote[], strategyId?: string): Promise<void> {
    console.log('AlgoEngine: executePreOpenTrades started.');
    try {
      const preOpenStocks = mockStocks && mockStocks.length > 0
        ? mockStocks
        : await this.getPreOpenStocks();

      if (!preOpenStocks || preOpenStocks.length === 0) {
        console.log('AlgoEngine: No pre-open stocks fetched. Aborting.');
        return;
      }

      const where: any = {
        tradingStatus: 'active',
        subscriptionStatus: 'active',
        strategyId: { not: null }
      };
      if (strategyId) where.strategyId = strategyId;

      const clients = await prisma.client.findMany({
        where,
        include: { user: true, strategy: true }
      });

      if (clients.length === 0) {
        console.log('AlgoEngine: No active clients assigned to any strategy.');
        return;
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

      const processClientEntry = async (client: any): Promise<void> => {
        try {
          const strategy = client.strategy;
          if (!strategy || strategy.status !== 'active') {
            console.log(`AlgoEngine: Skipping client ${client.user.name} - Strategy "${strategy?.name || 'Unknown'}" is missing or status is not active.`);
            return;
          }

          const config = strategy.configJson ? JSON.parse(strategy.configJson) : null;
          if (!config) {
            console.log(`AlgoEngine: Skipping client ${client.user.name} - Strategy configJson is missing.`);
            return;
          }

          if (!config.basicInfo?.exchange || !config.basicInfo?.tradeType || !config.basicInfo?.preSelectTime || !config.basicInfo?.entryTime) {
            console.log(`AlgoEngine: Strategy config missing exchange/tradeType/preSelectTime/entryTime for client ${client.user.name}. Skipping.`);
            return;
          }
          const exchangeParam = config.basicInfo.exchange;
          const tradeType = config.basicInfo.tradeType;
          const productParam = tradeType === 'Delivery' ? 'CNC' : (tradeType === 'Carry Forward' || tradeType === 'Normal' || tradeType === 'NRML') ? 'NRML' : 'MIS';

          let candidateStock: StockQuote | null = this.preselectedForClient.get(client.id) || null;
          this.preselectedForClient.delete(client.id);

          if (!candidateStock) {
            if (!config.basicInfo?.segment || !config.tradeAction?.action || !config.basicInfo?.selectPosition) {
              console.log(`AlgoEngine: Strategy config missing required fields (segment/action/selectPosition) for fallback filter for client ${client.user.name}. Skipping.`);
              return;
            }
            const segment = config.basicInfo.segment;
            const action = config.tradeAction.action;
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

          console.log(`AlgoEngine: Client ${client.user.name} | Stock ${candidateStock.symbol}(${candidateStock.changePercent}%)`);

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
              return;
            }

            if (!config.basicInfo?.preSelectTime || !config.basicInfo?.entryTime) {
              console.log(`AlgoEngine: basicInfo.preSelectTime or entryTime not configured for strategy "${strategy.name}". Skipping trade for ${client.user.name}.`);
              return;
            }
            let candlePrice = 0;
            if (client.zerodhaApiKey && client.accessToken) {
              const instTokenStr = Object.entries(this.wsLive.instrumentToSymbol).find(([, sym]) => sym === candidateStock.symbol)?.[0];
              if (instTokenStr) {
                try {
                  const today = new Date();
                  const formatKiteDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                  const from = `${formatKiteDate(today)}%20${config.basicInfo.preSelectTime.replace(':', '%20')}`;
                  const to = `${formatKiteDate(today)}%20${config.basicInfo.entryTime.replace(':', '%20')}`;
                  const res = await KiteClient.getHistoricalData(client.zerodhaApiKey, client.accessToken, instTokenStr, '5minute', from, to);
                  if (res.status === 'success' && Array.isArray(res.data?.candles) && res.data.candles.length > 0) {
                    const priceIdx: Record<string, number> = { open: 1, high: 2, low: 3, close: 4 };
                    const candleType = config.tradeAction?.candlePriceType || 'high';
                    candlePrice = Number(res.data.candles[0][priceIdx[candleType]]);
                  }
                } catch {}
              }
            }

            if (candlePrice === 0) {
              console.log(`AlgoEngine: Could not determine candle price for ${candidateStock.symbol}. Skipping.`);
              return;
            }

            const bufferPct = config.tradeAction?.bufferPercent;
            if (bufferPct === undefined || bufferPct === null || bufferPct === -1) {
              breakoutEntryPrice = candlePrice;
            } else {
              breakoutEntryPrice = candlePrice * (1 + bufferPct / 100);
            }

            const currentLtp = candidateStock.ltp || candidateStock.iep || breakoutEntryPrice;
            const hasPriceAction = config.conditions?.some((c: any) => c.indicator === 'Price Action');
            const isSLMarket = config.tradeAction?.orderType === 'SL-Market';

            if (isSLMarket || !hasPriceAction || currentLtp >= breakoutEntryPrice) {
              targetStock = candidateStock;
              console.log(`AlgoEngine: Breakout confirmed for ${candidateStock.symbol} | Entry: ${breakoutEntryPrice} | LTP: ${currentLtp} | OrderType: ${config.tradeAction?.orderType} | CandlePriceType: ${config.tradeAction?.candlePriceType || 'high'}`);
            } else {
              console.log(`AlgoEngine: Breakout not met for ${candidateStock.symbol} | Entry: ${breakoutEntryPrice} | LTP: ${currentLtp}. Skipping.`);
            }
          } catch (checkErr) {
            console.error(`AlgoEngine: Error checking breakout for ${candidateStock.symbol}:`, checkErr);
          }

          if (!targetStock) {
            console.log(`AlgoEngine: No breakout candidate found for client ${client.user.name}. Skipping trades for today.`);
            return;
          }

          const entryPrice = breakoutEntryPrice;

          if (!config?.stoploss?.fixedPercent) {
            console.log(`AlgoEngine: stoploss.fixedPercent not configured for strategy "${strategy.name}". Skipping trade for ${client.user.name}.`);
            return;
          }
          if (!config?.target?.profitPercent) {
            console.log(`AlgoEngine: target.profitPercent not configured for strategy "${strategy.name}". Skipping trade for ${client.user.name}.`);
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
            return;
          }

          if (process.env.KITE_AUTO_LOGIN_ENABLED === 'true') {
            if (this.todayTokenRefreshed.has(client.id) && activeAccessToken) {
              console.log(`AlgoEngine: Client ${client.user.name} already refreshed today, using existing token.`);
            } else if (client.zerodhaPassword && client.zerodhaTotpSecret) {
              console.log(`AlgoEngine: Auto-login is enabled. Refreshing session dynamically for client: ${client.user.name}`);
              const autoLoginRes = await performKiteAutoLogin(client.id);
              if (autoLoginRes.success && autoLoginRes.accessToken) {
                activeAccessToken = autoLoginRes.accessToken;
                this.todayTokenRefreshed.add(client.id);
              } else {
                console.warn(`AlgoEngine: Dynamic auto-login failed for ${client.user.name}: ${autoLoginRes.error}`);
              }
            } else {
              console.log(`AlgoEngine: Auto-login is enabled but client ${client.user.name} is missing password or TOTP secret. Skipping dynamic auto-refresh.`);
            }
          }

          if (!activeAccessToken) {
            const errMsg = 'Skipped: Kite session could not be established (auto-login failed or manual login required).';
            console.log(`AlgoEngine: Skipping client ${client.user.name} - ${errMsg}`);

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
              data: {
                strategyId: strategy.id,
                message: `Skipped trade execution for ${client.user.name}: Kite session could not be established (auto-login failed or manual login required).`,
                logType: 'error'
              }
            });
            return;
          }

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

          const configRisk = config?.riskManagement?.riskPerTrade;
          if (!configRisk || configRisk <= 0) {
            console.log(`AlgoEngine: riskManagement.riskPerTrade not configured (or invalid) for strategy "${strategy.name}". Skipping trade for ${client.user.name}.`);
            return;
          }
          const riskPercent = configRisk;
          const marginRate = config?.riskManagement?.misMarginRate;

          let capitalAtRisk = clientCapital * (riskPercent / 100);

          const dbCapitalLimit = Number(client.capital);
          if (capitalAtRisk > dbCapitalLimit) {
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
              data: { strategyId: strategy.id, message: errMsg, logType: 'info' }
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

          const marketProtectionVal = config?.tradeAction?.marketProtection !== undefined
            ? Number(config.tradeAction.marketProtection)
            : -1;

          const stopLoss = entryPrice - slPoints;

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
            target = entryPrice + (slPoints * rr);
          } else {
            target = entryPrice * (1 + targetPercent / 100);
          }

          let orderTypeParam: 'MARKET' | 'LIMIT' | 'SL' | 'SL-M' = 'MARKET';
          let priceParam: number | undefined = undefined;
          let triggerPriceParam: number | undefined = undefined;
          if (!config?.tradeAction?.orderType) {
            console.log(`AlgoEngine: tradeAction.orderType not configured for strategy "${strategy.name}". Skipping trade for ${client.user.name}.`);
            return;
          }
          const configOrderType = config.tradeAction.orderType;

          if (configOrderType === 'Limit') {
            orderTypeParam = 'LIMIT';
            priceParam = Number(entryPrice.toFixed(2));
          } else if (configOrderType === 'SL-Limit') {
            orderTypeParam = 'SL';
            triggerPriceParam = Number(entryPrice.toFixed(2));
            if (!config?.tradeAction?.bufferPercent) {
              console.log(`AlgoEngine: tradeAction.bufferPercent not configured for strategy "${strategy.name}". Skipping trade for ${client.user.name}.`);
              return;
            }
            const bufferPercent = config.tradeAction.bufferPercent;
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
              } else {
                const errMsg = orderRes?.message || 'Zerodha API returned error status';
                console.warn(`AlgoEngine: Kite order response status was not success for ${client.user.name}. Error: ${errMsg}`);
                await prisma.trade.create({
                  data: {
                    clientId: client.id, strategyId: strategy.id,
                    symbol: targetStock.symbol, orderType: productParam,
                    entryPrice: entryPrice, quantity: quantity,
                    stopLoss: stopLoss, target: target,
                    status: 'FAILED', entryTime: new Date(),
                    kiteResponse: orderRes || { error: errMsg }
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
                  entryPrice: entryPrice, quantity: quantity,
                  stopLoss: stopLoss, target: target,
                  status: 'FAILED', entryTime: new Date(),
                  kiteResponse: { error: kiteErr.message || String(kiteErr) }
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

          let actualEntryPrice = entryPrice;
          let slOrderId = '';
          let targetOrderId = '';

          if (orderId && client.zerodhaApiKey && activeAccessToken) {
            console.log(`AlgoEngine: Polling entry order ${orderId} for completion...`);
            const isInstantFill = orderTypeParam === 'MARKET' || orderTypeParam === 'SL-M';
            const maxPolls = isInstantFill ? 3 : 10;
            for (let attempt = 0; attempt < maxPolls; attempt++) {
              await new Promise(r => setTimeout(r, 2000));
              try {
                const orderStatusRes = await KiteClient.getOrderById(client.zerodhaApiKey, activeAccessToken, orderId);
                if (orderStatusRes?.status === 'success' && orderStatusRes?.data?.status === 'COMPLETE') {
                  const filledAvgPrice = orderStatusRes.data.average_price || orderStatusRes.data.filled_price;
                  if (filledAvgPrice && Number(filledAvgPrice) > 0) {
                    actualEntryPrice = Number(filledAvgPrice);
                  }
                  console.log(`AlgoEngine: Entry order ${orderId} COMPLETE at avg price ₹${actualEntryPrice}`);
                  break;
                }
                if (orderStatusRes?.data?.status === 'CANCELLED' || orderStatusRes?.data?.status === 'REJECTED') {
                  console.warn(`AlgoEngine: Entry order ${orderId} ${orderStatusRes.data.status}. Aborting trade.`);
                  orderId = '';
                  break;
                }
                console.log(`AlgoEngine: Entry order status: ${orderStatusRes?.data?.status || 'unknown'} (attempt ${attempt + 1})`);
              } catch (pollErr) {
                console.warn(`AlgoEngine: Error polling entry order (attempt ${attempt + 1}):`, pollErr);
              }
            }
          }

          if (!orderId) {
            await prisma.trade.create({
              data: {
                clientId: client.id, strategyId: strategy.id,
                symbol: targetStock.symbol, orderType: productParam,
                entryPrice: actualEntryPrice, quantity: quantity,
                stopLoss: stopLoss, target: target,
                status: 'FAILED', entryTime: new Date(),
                kiteResponse: { error: 'Entry order did not complete' }
              }
            });
            return;
          }

          if (client.zerodhaApiKey && activeAccessToken) {
            try {
              const slParams = {
                exchange: exchangeParam,
                tradingsymbol: targetStock.symbol,
                transaction_type: 'SELL' as const,
                quantity: quantity,
                order_type: 'SL-M' as const,
                product: productParam as any,
                validity: 'DAY' as const,
                trigger_price: Number(stopLoss.toFixed(2)),
                market_protection: marketProtectionVal
              };
              const slRes = await KiteClient.placeOrder(client.zerodhaApiKey, activeAccessToken, slParams);
              if (slRes?.status === 'success' && slRes.data?.order_id) {
                slOrderId = slRes.data.order_id;
                console.log(`AlgoEngine: SL-M order placed: ${slOrderId} for ${targetStock.symbol} @ trigger ₹${stopLoss.toFixed(2)}`);
              } else {
                console.warn(`AlgoEngine: SL-M order failed: ${slRes?.message || 'unknown'}`);
              }
            } catch (slErr) {
              console.error(`AlgoEngine: Error placing SL-M order:`, slErr);
            }
          }

          if (client.zerodhaApiKey && activeAccessToken) {
            try {
              const targetParams = {
                exchange: exchangeParam,
                tradingsymbol: targetStock.symbol,
                transaction_type: 'SELL' as const,
                quantity: quantity,
                order_type: 'LIMIT' as const,
                product: productParam as any,
                validity: 'DAY' as const,
                price: Number(target.toFixed(2))
              };
              const targetRes = await KiteClient.placeOrder(client.zerodhaApiKey, activeAccessToken, targetParams);
              if (targetRes?.status === 'success' && targetRes.data?.order_id) {
                targetOrderId = targetRes.data.order_id;
                console.log(`AlgoEngine: Target LIMIT order placed: ${targetOrderId} for ${targetStock.symbol} @ ₹${target.toFixed(2)}`);
              } else {
                console.warn(`AlgoEngine: Target LIMIT order failed: ${targetRes?.message || 'unknown'}`);
              }
            } catch (tgtErr) {
              console.error(`AlgoEngine: Error placing Target LIMIT order:`, tgtErr);
            }
          }

          await prisma.trade.create({
            data: {
              clientId: client.id, strategyId: strategy.id,
              symbol: targetStock.symbol, orderType: productParam,
              entryPrice: actualEntryPrice, quantity: quantity,
              stopLoss: stopLoss, target: target,
              status: 'open',
              entryTime: new Date(),
              entryOrderId: orderId,
              slOrderId: slOrderId || null,
              targetOrderId: targetOrderId || null,
              slTriggerPrice: stopLoss,
              kiteResponse: orderRes
            }
          });
          this.wsLive.subscribeSymbols([targetStock.symbol]);

          await prisma.strategyLog.create({
            data: {
              strategyId: strategy.id,
              message: `Intraday Trade Initiated for ${client.user.name}: Bought ${quantity} shares of ${targetStock.symbol} at entry price ₹${actualEntryPrice.toFixed(2)} using config from DB strategy "${strategy.name}". Capital at risk: ₹${capitalAtRisk.toFixed(2)}. Target: ₹${target.toFixed(2)} (${targetPercent}%), Stop Loss: ₹${stopLoss.toFixed(2)} (${slPercent}%). Entry Order: ${orderId}, SL Order: ${slOrderId || 'N/A'}, Target Order: ${targetOrderId || 'N/A'}`,
              logType: 'trade'
            }
          });

          if (finalAdminId) {
            await prisma.auditLog.create({
              data: {
                adminId: finalAdminId,
                action: 'AUTO TRADE INITIATED',
                oldValue: null,
                newValue: `Client: ${client.user.name} | Strategy: ${strategy.name} | Stock: ${targetStock.symbol} | Qty: ${quantity} | Entry: ${actualEntryPrice.toFixed(2)}`
              }
            }).catch(() => {});
          }

        } catch (clientErr: any) {
          console.error(`AlgoEngine: Error executing pre-open trade for client ${client.id}:`, clientErr);
        }
      };

      for (let i = 0; i < clients.length; i += BATCH_SIZE) {
        const batch = clients.slice(i, i + BATCH_SIZE);
        await Promise.allSettled(batch.map(client => processClientEntry(client)));
        console.log(`AlgoEngine: Batch processed ${batch.length} clients (${Math.min(i + BATCH_SIZE, clients.length)}/${clients.length})`);
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
      const queryParams = symbols.map(sym => `i=NSE:${sym}`).join('&');
      const url = `${API_ENDPOINTS.KITE_BASE}/quote?${queryParams}`;

      const res = await fetch(url, {
        headers: {
          'Authorization': `token ${creds.apiKey}:${creds.accessToken}`,
          'X-Kite-Version': '3'
        }
      });

      if (!res.ok) throw new Error(`Kite HTTP quote fetch failed with status ${res.status}`);

      const json = await res.json();
      if (json && json.status === 'success' && json.data) {
        this.wsLive.stocksState = (this.wsLive.stocksState.length > 0 ? this.wsLive.stocksState : this.preOpenCache).map(stock => {
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
}

const globalForAlgo = global as unknown as { algoEngine: AlgoEngineService; initPromise?: Promise<void> };
export const algoEngine = globalForAlgo.algoEngine || new AlgoEngineService();
if (!globalForAlgo.initPromise) {
  globalForAlgo.initPromise = algoEngine.init();
}
if (process.env.NODE_ENV !== 'production') globalForAlgo.algoEngine = algoEngine;
