import { prisma } from '../../database/db';
import { SCHEDULER_INTERVALS } from '../../core/constants';
import { KiteClient } from '../services/kite';
import { performKiteAutoLogin } from '../services/kiteAutoLogin';
import type { StockQuote } from './algoEngine';
import type { WsLiveFeed } from './wsLiveFeed';

export interface EngineAccess {
  todayTokenRefreshed: Set<string>;
  getAlgoSetting(key: string, defaultValue: string): Promise<string>;
  getPreOpenStocks(): Promise<StockQuote[]>;
  preSelectAllClients(strategyId?: string): Promise<void>;
  executePreOpenTrades(adminId: string, mockStocks?: StockQuote[], strategyId?: string): Promise<void>;
}

export class TradingScheduler {
  static readonly BATCH_CONCURRENCY = 5;
  static readonly TRADE_MONITOR_CONCURRENCY = 10;
  private isMonitoringRunning = false;

  constructor(
    private engine: EngineAccess,
    private wsLive: WsLiveFeed
  ) {}

  startDailyPreOpenStrategyScheduler() {
    console.log('AlgoEngine: Initialized Daily Pre-Open Strategy Execution Scheduler (per-strategy timing)');

    if ((global as any).preOpenStrategyInterval) {
      clearInterval((global as any).preOpenStrategyInterval);
    }

    let lastFetchedDate = '';
    const lastPreSelectByStrategy: Map<string, string> = new Map();
    const lastEntryByStrategy: Map<string, string> = new Map();
    let cachedFetchTime = '09:08';

    const checkAndExecute = async () => {
      try {
        cachedFetchTime = await this.engine.getAlgoSetting('algo_preopen_fetch_time', '09:08');

        const istDateStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
        const istDate = new Date(istDateStr);
        const hours = istDate.getHours();
        const minutes = istDate.getMinutes();
        const currentDateKey = istDate.toLocaleDateString();
        const currentTimeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

        if (currentTimeStr === cachedFetchTime && lastFetchedDate !== currentDateKey) {
          console.log(`AlgoEngine Scheduler: Pre-open fetch time ${cachedFetchTime} reached. Fetching NSE pre-open data...`);
          lastFetchedDate = currentDateKey;
          await this.engine.getPreOpenStocks();
        }

        const autoTradeEnabled = await this.engine.getAlgoSetting('auto_trade_enabled', 'true');
        if (autoTradeEnabled !== 'true') return;

        const todayStr = istDate.toLocaleDateString('en-CA');
        const dayName = istDate.toLocaleDateString('en-US', { weekday: 'short' });
        const tradingDaysStr = await this.engine.getAlgoSetting('trading_days', '["Mon","Tue","Wed","Thu","Fri"]');
        const specialDaysStr = await this.engine.getAlgoSetting('special_market_days', '[]');
        const holidaysStr = await this.engine.getAlgoSetting('market_holidays', '[]');

        let tradingDays: string[], specialDays: string[], holidays: string[];
        try { tradingDays = JSON.parse(tradingDaysStr); } catch { tradingDays = ['Mon','Tue','Wed','Thu','Fri']; }
        try { specialDays = JSON.parse(specialDaysStr); } catch { specialDays = []; }
        try { holidays = JSON.parse(holidaysStr); } catch { holidays = []; }

        if (holidays.includes(todayStr)) {
          console.log(`AlgoEngine Scheduler: Today ${todayStr} is a market holiday. Skipping all strategies.`);
          return;
        }
        if (!tradingDays.includes(dayName) && !specialDays.includes(todayStr)) {
          console.log(`AlgoEngine Scheduler: Today ${todayStr} (${dayName}) is not a trading day. Skipping all strategies.`);
          return;
        }

        const strategies = await prisma.strategy.findMany({ where: { status: 'active' } });

        const preSelectTasks: (() => Promise<void>)[] = [];
        const entryTasks: (() => Promise<void>)[] = [];
        let adminId = 'system-scheduler';

        for (const strategy of strategies) {
          if (!strategy.configJson) continue;

          let config: any;
          try { config = JSON.parse(strategy.configJson); } catch { continue; }

          const preSelectTime = config.basicInfo?.preSelectTime;
          const entryTime = config.basicInfo?.entryTime;

          if (preSelectTime && currentTimeStr === preSelectTime && lastPreSelectByStrategy.get(strategy.id) !== currentDateKey) {
            console.log(`AlgoEngine Scheduler: Pre-select time ${preSelectTime} reached for strategy "${strategy.name}".`);
            lastPreSelectByStrategy.set(strategy.id, currentDateKey);
            preSelectTasks.push(() => this.engine.preSelectAllClients(strategy.id));
          }

          if (entryTime && currentTimeStr === entryTime && lastEntryByStrategy.get(strategy.id) !== currentDateKey) {
            console.log(`AlgoEngine Scheduler: Entry time ${entryTime} reached for strategy "${strategy.name}". Starting execution...`);
            lastEntryByStrategy.set(strategy.id, currentDateKey);

            if (!adminId || adminId === 'system-scheduler') {
              const firstAdmin = await prisma.user.findFirst({ where: { role: 'admin' } });
              if (firstAdmin) adminId = firstAdmin.id;
            }

            entryTasks.push(() => this.engine.executePreOpenTrades(adminId, undefined, strategy.id));
          }
        }

        const STRATEGY_THROTTLE = 5;
        for (let i = 0; i < preSelectTasks.length; i += STRATEGY_THROTTLE) {
          await Promise.allSettled(preSelectTasks.slice(i, i + STRATEGY_THROTTLE).map(fn => fn()));
        }
        for (let i = 0; i < entryTasks.length; i += STRATEGY_THROTTLE) {
          await Promise.allSettled(entryTasks.slice(i, i + STRATEGY_THROTTLE).map(fn => fn()));
        }
      } catch (err) {
        console.error('AlgoEngine Scheduler: Error in Pre-Open Strategy cron interval execution:', err);
      }
    };

    (global as any).preOpenStrategyInterval = setInterval(checkAndExecute, SCHEDULER_INTERVALS.STRATEGY_CHECK);
  }

  startDailyTokenRefreshScheduler() {
    console.log('AlgoEngine: Initialized Daily Token Refresh Scheduler');

    if ((global as any).tokenRefreshInterval) {
      clearInterval((global as any).tokenRefreshInterval);
    }

    let lastRefreshedDate = '';
    let cachedRefreshTime = '08:00';

    const checkAndRefresh = async () => {
      try {
        if (process.env.KITE_AUTO_LOGIN_ENABLED !== 'true') return;

        cachedRefreshTime = await this.engine.getAlgoSetting('algo_token_refresh_time', '08:00');

        const istDateStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
        const istDate = new Date(istDateStr);
        const hours = istDate.getHours();
        const minutes = istDate.getMinutes();
        const currentDateKey = istDate.toLocaleDateString();
        const currentTimeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

        if (currentTimeStr === cachedRefreshTime && lastRefreshedDate !== currentDateKey) {
          console.log(`AlgoEngine Scheduler: Token refresh time ${cachedRefreshTime} reached. Starting daily token refresh...`);
          lastRefreshedDate = currentDateKey;

          const algoType = await prisma.productType.findUnique({ where: { name: 'Algo' } });
          if (!algoType) {
            console.log('AlgoEngine Scheduler: Algo product type not found. Skipping token refresh.');
            return;
          }

          const clients = await prisma.client.findMany({
            where: {
              tradingStatus: 'active', subscriptionStatus: 'active',
              productTypeId: algoType.id,
              zerodhaClientId: { not: null },
              zerodhaApiKey: { not: null },
              zerodhaApiSecret: { not: null },
              zerodhaPassword: { not: null },
              zerodhaTotpSecret: { not: null }
            },
            include: { user: true }
          });

          console.log(`AlgoEngine Scheduler: Found ${clients.length} clients to auto-login.`);

          this.engine.todayTokenRefreshed.clear();

          for (let i = 0; i < clients.length; i += TradingScheduler.BATCH_CONCURRENCY) {
            const batch = clients.slice(i, i + TradingScheduler.BATCH_CONCURRENCY);
            await Promise.allSettled(batch.map(async (client) => {
              try {
                console.log(`AlgoEngine Scheduler: Auto-logging in client ${client.user.name} (${client.zerodhaClientId})...`);
                const loginRes = await performKiteAutoLogin(client.id);
                if (loginRes.success) {
                  this.engine.todayTokenRefreshed.add(client.id);
                }
                console.log(`AlgoEngine Scheduler: Auto-login result for ${client.user.name}:`, loginRes.success);
              } catch (err: any) {
                console.error(`AlgoEngine Scheduler: Error auto-logging in client ${client.user.name}:`, err);
              }
            }));
          }
        }
      } catch (err) {
        console.error('AlgoEngine Scheduler: Error in token refresh cron interval execution:', err);
      }
    };

    (global as any).tokenRefreshInterval = setInterval(checkAndRefresh, SCHEDULER_INTERVALS.TOKEN_REFRESH);
  }

  startActiveTradesMonitoringScheduler() {
    console.log('AlgoEngine: Initialized Active Trades Exit Monitoring Scheduler (per-strategy check interval)');

    if ((global as any).activeTradesMonitoringInterval) {
      clearInterval((global as any).activeTradesMonitoringInterval);
    }

    const lastMonitoredByTrade: Map<string, number> = new Map();

    const checkOpenTradesExits = async () => {
      if (this.isMonitoringRunning) return;
      this.isMonitoringRunning = true;
      try {
        const openTrades = await prisma.trade.findMany({
          where: { status: 'open' },
          include: { client: { include: { user: true } }, strategy: true }
        });

        if (openTrades.length === 0) {
          this.isMonitoringRunning = false;
          return;
        }

        for (const trade of openTrades) {
          if (!this.wsLive.subscribedSymbols.has(trade.symbol)) {
            this.wsLive.subscribeSymbols([trade.symbol]);
          }
        }

        const now = Date.now();

        const processTrade = async (trade: any) => {
          try {
            const client = trade.client;
            const strategy = trade.strategy;

            let checkIntervalMs = SCHEDULER_INTERVALS.TRADE_MONITOR;
            if (strategy.configJson) {
              try {
                const config = JSON.parse(strategy.configJson);
                const intervalSec = config?.basicInfo?.checkIntervalSec;
                if (intervalSec && Number(intervalSec) > 0) {
                  checkIntervalMs = Number(intervalSec) * 1000;
                }
              } catch {}
            }

            const lastCheck = lastMonitoredByTrade.get(trade.id) || 0;
            if (now - lastCheck < checkIntervalMs) return;
            lastMonitoredByTrade.set(trade.id, now);

            if (!client.zerodhaApiKey || !client.accessToken) {
              console.warn(`AlgoEngine Monitor: Skipping trade ${trade.id} - missing client API key or access token.`);
              return;
            }

            const instrumentTokenStr = Object.entries(this.wsLive.instrumentToSymbol).find(([token, sym]) => sym === trade.symbol)?.[0];
            if (!instrumentTokenStr) {
              console.warn(`AlgoEngine Monitor: Skipping trade ${trade.id} - could not find instrument token for symbol ${trade.symbol}.`);
              return;
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

            const config = strategy.configJson ? JSON.parse(strategy.configJson) : null;
            if (!config?.stoploss?.fixedPercent || !config?.target?.profitPercent || !config?.stoploss?.type || !config?.target?.type || !config?.basicInfo?.exchange) {
              console.log(`AlgoEngine Monitor: Strategy ${strategy.name} has incomplete config for trade ${trade.id}. Skipping check.`);
              return;
            }
            const slPercent = config.stoploss.fixedPercent;
            const targetPercent = config.target.profitPercent;
            const slType = config.stoploss.type;
            const targetType = config.target.type;
            const trailingSlStep = config?.stoploss?.trailingSL;
            const trailingTgtStep = config?.target?.trailingTarget;
            const marketProtectionVal = config?.tradeAction?.marketProtection !== undefined
              ? Number(config.tradeAction.marketProtection) : -1;

            const entryPrice = Number(trade.entryPrice);
            const exchangeParam = config.basicInfo.exchange;
            let exitTriggered = false;
            let exitPrice = 0;
            let exitReason = '';

            // --- Priority 1: Check SL/Target order status via API ---
            if (trade.slOrderId || trade.targetOrderId) {
              let slComplete = false;
              let targetComplete = false;
              let slAvgPrice = 0;
              let targetAvgPrice = 0;

              if (trade.slOrderId) {
                try {
                  const slStatus = await KiteClient.getOrderById(client.zerodhaApiKey, client.accessToken, trade.slOrderId);
                  if (slStatus?.status === 'success' && slStatus?.data) {
                    const slData = slStatus.data;
                    if (slData.status === 'COMPLETE') {
                      slComplete = true;
                      slAvgPrice = Number(slData.average_price || slData.filled_price || 0);
                      console.log(`AlgoEngine Monitor: SL order ${trade.slOrderId} COMPLETE for ${trade.symbol} @ ₹${slAvgPrice}`);
                    } else if (slData.status === 'CANCELLED' || slData.status === 'REJECTED') {
                      console.log(`AlgoEngine Monitor: SL order ${trade.slOrderId} ${slData.status}`);
                    }
                  }
                } catch (e) { console.warn(`AlgoEngine Monitor: SL order status check failed for ${trade.symbol}:`, e); }
              }

              if (trade.targetOrderId) {
                try {
                  const tgtStatus = await KiteClient.getOrderById(client.zerodhaApiKey, client.accessToken, trade.targetOrderId);
                  if (tgtStatus?.status === 'success' && tgtStatus?.data) {
                    const tgtData = tgtStatus.data;
                    if (tgtData.status === 'COMPLETE') {
                      targetComplete = true;
                      targetAvgPrice = Number(tgtData.average_price || tgtData.filled_price || 0);
                      console.log(`AlgoEngine Monitor: Target order ${trade.targetOrderId} COMPLETE for ${trade.symbol} @ ₹${targetAvgPrice}`);
                    } else if (tgtData.status === 'CANCELLED' || tgtData.status === 'REJECTED') {
                      console.log(`AlgoEngine Monitor: Target order ${trade.targetOrderId} ${tgtData.status}`);
                    }
                  }
                } catch (e) { console.warn(`AlgoEngine Monitor: Target order status check failed for ${trade.symbol}:`, e); }
              }

              if (slComplete) {
                exitTriggered = true;
                exitPrice = slAvgPrice > 0 ? slAvgPrice : Number(trade.stopLoss || entryPrice * (1 - slPercent / 100));
                exitReason = 'SL Hit';
                if (trade.targetOrderId) {
                  try {
                    await KiteClient.cancelOrder(client.zerodhaApiKey, client.accessToken, trade.targetOrderId);
                    console.log(`AlgoEngine Monitor: Cancelled target order ${trade.targetOrderId} (SL hit first)`);
                  } catch (e) { console.warn(`AlgoEngine Monitor: Failed to cancel target order ${trade.targetOrderId}:`, e); }
                }
              } else if (targetComplete) {
                exitTriggered = true;
                exitPrice = targetAvgPrice > 0 ? targetAvgPrice : Number(trade.target || entryPrice * (1 + targetPercent / 100));
                exitReason = 'Target Hit';
                if (trade.slOrderId) {
                  try {
                    await KiteClient.cancelOrder(client.zerodhaApiKey, client.accessToken, trade.slOrderId);
                    console.log(`AlgoEngine Monitor: Cancelled SL order ${trade.slOrderId} (Target hit first)`);
                  } catch (e) { console.warn(`AlgoEngine Monitor: Failed to cancel SL order ${trade.slOrderId}:`, e); }
                }
              }

              // --- Trailing SL ---
              if (!exitTriggered && trade.slOrderId && trade.slTriggerPrice && trailingSlStep > 0) {
                const price = this.wsLive.getStockLtp(trade.symbol);
                if (price > 0 && price > entryPrice) {
                  const currentSlTrigger = Number(trade.slTriggerPrice);
                  const trailStepValue = entryPrice * (trailingSlStep / 100);
                  const priceMovePct = ((price - entryPrice) / entryPrice) * 100;
                  const trailsToApply = Math.floor(priceMovePct / trailingSlStep);
                  if (trailsToApply > 0) {
                    const newSlTrigger = entryPrice + (trailsToApply * trailStepValue);
                    if (newSlTrigger > currentSlTrigger) {
                      try {
                        const modRes = await KiteClient.modifyOrder(client.zerodhaApiKey, client.accessToken, trade.slOrderId, {
                          trigger_price: Number(newSlTrigger.toFixed(2))
                        });
                        if (modRes?.status === 'success') {
                          await prisma.trade.update({
                            where: { id: trade.id },
                            data: { slTriggerPrice: Number(newSlTrigger.toFixed(2)) }
                          });
                          console.log(`AlgoEngine Monitor: Trailing SL for ${trade.symbol}: ${currentSlTrigger} → ${newSlTrigger.toFixed(2)} (price: ${price})`);
                        }
                      } catch (e) { console.warn(`AlgoEngine Monitor: Trailing SL modify failed for ${trade.symbol}:`, e); }
                    }
                  }
                }
              }

              // --- Trailing Target ---
              if (!exitTriggered && trade.targetOrderId && trade.target && trailingTgtStep > 0) {
                const price = this.wsLive.getStockLtp(trade.symbol);
                if (price > 0 && price > entryPrice) {
                  const currentTarget = Number(trade.target);
                  const trailStepValue = entryPrice * (trailingTgtStep / 100);
                  const priceMovePct = ((price - entryPrice) / entryPrice) * 100;
                  const trailsToApply = Math.floor(priceMovePct / trailingTgtStep);
                  if (trailsToApply > 0) {
                    const newTarget = entryPrice + (trailsToApply * trailStepValue);
                    if (newTarget > currentTarget) {
                      try {
                        const modRes = await KiteClient.modifyOrder(client.zerodhaApiKey, client.accessToken, trade.targetOrderId, {
                          price: Number(newTarget.toFixed(2))
                        });
                        if (modRes?.status === 'success') {
                          await prisma.trade.update({
                            where: { id: trade.id },
                            data: { target: Number(newTarget.toFixed(2)) }
                          });
                          console.log(`AlgoEngine Monitor: Trailing Target for ${trade.symbol}: ${currentTarget} → ${newTarget.toFixed(2)} (price: ${price})`);
                        }
                      } catch (e) { console.warn(`AlgoEngine Monitor: Trailing Target modify failed for ${trade.symbol}:`, e); }
                    }
                  }
                }
              }
            }

            // --- Priority 2: Entry placed but SL/Target not yet set ---
            if (!exitTriggered && !trade.slOrderId && !trade.targetOrderId && trade.entryOrderId) {
              try {
                const entryStatus = await KiteClient.getOrderById(client.zerodhaApiKey, client.accessToken, trade.entryOrderId);
                if (entryStatus?.status === 'success' && entryStatus?.data?.status === 'COMPLETE') {
                  const filledPrice = Number(entryStatus.data.average_price || entryStatus.data.filled_price || 0);
                  if (filledPrice > 0) {
                    await prisma.trade.update({ where: { id: trade.id }, data: { entryPrice: filledPrice } });
                  }
                  // Entry fill hui — ab SL aur Target place karo
                  let newSlOrderId = '';
                  let newTargetOrderId = '';
                  if (client.zerodhaApiKey && client.accessToken) {
                    try {
                      const slParams = {
                        exchange: exchangeParam, tradingsymbol: trade.symbol,
                        transaction_type: 'SELL' as const, quantity: Number(trade.quantity),
                        order_type: 'SL-M' as const, product: productParam as any,
                        validity: 'DAY' as const,
                        trigger_price: Number(Number(trade.slTriggerPrice || (filledPrice > 0 ? filledPrice * (1 - slPercent / 100) : 0)).toFixed(2)),
                        market_protection: marketProtectionVal
                      };
                      const slRes = await KiteClient.placeOrder(client.zerodhaApiKey, client.accessToken, slParams);
                      if (slRes?.status === 'success' && slRes.data?.order_id) {
                        newSlOrderId = slRes.data.order_id;
                      }
                    } catch (slErr) { console.warn(`AlgoEngine Monitor: SL placement failed for ${trade.symbol}:`, slErr); }
                    try {
                      const targetParams = {
                        exchange: exchangeParam, tradingsymbol: trade.symbol,
                        transaction_type: 'SELL' as const, quantity: Number(trade.quantity),
                        order_type: 'LIMIT' as const, product: productParam as any,
                        validity: 'DAY' as const,
                        price: Number(Number(trade.target || (filledPrice > 0 ? filledPrice * (1 + targetPercent / 100) : 0)).toFixed(2))
                      };
                      const tgtRes = await KiteClient.placeOrder(client.zerodhaApiKey, client.accessToken, targetParams);
                      if (tgtRes?.status === 'success' && tgtRes.data?.order_id) {
                        newTargetOrderId = tgtRes.data.order_id;
                      }
                    } catch (tgtErr) { console.warn(`AlgoEngine Monitor: Target placement failed for ${trade.symbol}:`, tgtErr); }
                  }
                  await prisma.trade.update({
                    where: { id: trade.id },
                    data: {
                      slOrderId: newSlOrderId || null,
                      targetOrderId: newTargetOrderId || null
                    }
                  });
                  console.log(`AlgoEngine Monitor: Entry ${trade.entryOrderId} filled. SL: ${newSlOrderId || 'N/A'}, Target: ${newTargetOrderId || 'N/A'} placed for ${trade.symbol}.`);
                  return; // next cycle monitor karega SL/Target
                }
                if (entryStatus?.data?.status === 'CANCELLED' || entryStatus?.data?.status === 'REJECTED') {
                  await prisma.trade.update({ where: { id: trade.id }, data: { status: 'FAILED' } });
                  console.warn(`AlgoEngine Monitor: Entry order ${trade.entryOrderId} ${entryStatus.data.status}. Trade ${trade.id} marked FAILED.`);
                  return;
                }
              } catch (e) { console.warn(`AlgoEngine Monitor: Entry status check failed for ${trade.symbol}:`, e); }
            }

            // --- Priority 3: Fallback candle-based check (no SL/Target and no entry order) ---
            if (!exitTriggered && !trade.slOrderId && !trade.targetOrderId && !trade.entryOrderId) {
              if (instrumentTokenStr) {
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

                const res = await KiteClient.getHistoricalData(client.zerodhaApiKey, client.accessToken, instrumentTokenStr, intervalParam, fromDateStr, toDateStr);
                if (res.status === 'success' && Array.isArray(res.data?.candles) && res.data.candles.length > 0) {
                  const latestCandle = res.data.candles[res.data.candles.length - 1];
                  const currentClosePrice = Number(latestCandle[4]);
                  let fallbackSlPoints: number;
                  if (slType === 'Fixed Points') {
                    if (!config?.stoploss?.fixedPoints) return;
                    fallbackSlPoints = config.stoploss.fixedPoints;
                  } else {
                    fallbackSlPoints = entryPrice * (slPercent / 100);
                  }
                  if (fallbackSlPoints <= 0) fallbackSlPoints = 1;
                  const stopLossLevel = entryPrice - fallbackSlPoints;
                  let targetLevel: number;
                  if (targetType === 'Risk Reward Ratio') {
                    if (!config?.target?.riskRewardRatio) return;
                    const rr = config.target.riskRewardRatio;
                    targetLevel = entryPrice + (fallbackSlPoints * rr);
                  } else {
                    targetLevel = entryPrice * (1 + targetPercent / 100);
                  }

                  console.log(`AlgoEngine Monitor: Trade ${trade.id} (${trade.symbol}) | Entry: ₹${entryPrice.toFixed(2)} | Current: ₹${currentClosePrice.toFixed(2)} | SL: ₹${stopLossLevel.toFixed(2)} | Target: ₹${targetLevel.toFixed(2)}`);

                  if (currentClosePrice <= stopLossLevel) {
                    exitTriggered = true;
                    exitPrice = currentClosePrice;
                    exitReason = 'SL Hit (candle)';
                  } else if (currentClosePrice >= targetLevel) {
                    exitTriggered = true;
                    exitPrice = currentClosePrice;
                    exitReason = 'Target Hit (candle)';
                  }
                }
              }
            }

            // --- Market Close Check ---
            if (config.basicInfo?.exitTime && !exitTriggered) {
              const istTimeStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false });
              if (istTimeStr >= config.basicInfo.exitTime) {
                exitTriggered = true;
                exitPrice = Number(trade.entryPrice);
                exitReason = `Market Close (${config.basicInfo.exitTime})`;
                console.log(`AlgoEngine Monitor: Market close time ${config.basicInfo.exitTime} reached for trade ${trade.id} (${trade.symbol}). Forcing exit.`);
              }
            }

            // --- Exit Execution ---
            if (exitTriggered) {
              console.log(`AlgoEngine Monitor: EXIT TRIGGERED for trade ${trade.id} (${trade.symbol}) due to ${exitReason} at ₹${exitPrice.toFixed(2)}.`);

              const sellParams = {
                exchange: exchangeParam,
                tradingsymbol: trade.symbol,
                transaction_type: 'SELL' as const,
                quantity: trade.quantity,
                order_type: 'MARKET' as const,
                product: trade.orderType as any,
                validity: 'DAY' as const,
                market_protection: marketProtectionVal
              };

              const sellRes = await KiteClient.placeOrder(client.zerodhaApiKey, client.accessToken, sellParams);
              if (sellRes && sellRes.status === 'success') {
                const sellOrderId = sellRes.data?.order_id || 'manual-exit';
                const pnlValue = (exitPrice - entryPrice) * trade.quantity;
                const newStatus = exitReason.toLowerCase().includes('sl') ? 'sl_hit' : 'target_hit';

                await prisma.trade.update({
                  where: { id: trade.id },
                  data: {
                    status: newStatus, exitPrice: exitPrice, exitTime: new Date(),
                    exitReason: exitReason, pnl: pnlValue, kiteResponse: sellRes
                  }
                });

                await prisma.strategyLog.create({
                  data: {
                    strategyId: strategy.id,
                    message: `Trade Closed for ${client.user.name}: Sold ${trade.quantity} ${trade.symbol} @ ₹${exitPrice.toFixed(2)} (${exitReason}). P&L: ₹${pnlValue.toFixed(2)}`,
                    logType: 'trade'
                  }
                });

                await prisma.auditLog.create({
                  data: {
                    adminId: 'system-scheduler', action: 'AUTO TRADE CLOSED',
                    oldValue: `Trade ID: ${trade.id}`,
                    newValue: `Sold ${trade.quantity} ${trade.symbol} @ ₹${exitPrice.toFixed(2)} | ${exitReason} | P&L: ₹${pnlValue.toFixed(2)}`
                  }
                }).catch(() => {});
              } else {
                console.error(`AlgoEngine Monitor: Failed to place exit order for ${trade.symbol}:`, sellRes?.message);
                await prisma.strategyLog.create({
                  data: {
                    strategyId: strategy.id,
                    message: `Failed to place exit order for ${client.user.name} (${trade.symbol}): ${sellRes?.message || 'Unknown error'}`,
                    logType: 'error'
                  }
                });
              }
            }
          } catch (tradeErr: any) {
            console.error(`AlgoEngine Monitor: Error processing trade ${trade.id}:`, tradeErr);
          }
        };

        for (let i = 0; i < openTrades.length; i += TradingScheduler.TRADE_MONITOR_CONCURRENCY) {
          const batch = openTrades.slice(i, i + TradingScheduler.TRADE_MONITOR_CONCURRENCY);
          await Promise.allSettled(batch.map(trade => processTrade(trade)));
        }
      } catch (err) {
        console.error('AlgoEngine Monitor: Error in open trades monitoring cron loop:', err);
      } finally {
        this.isMonitoringRunning = false;
      }
    };

    (global as any).activeTradesMonitoringInterval = setInterval(checkOpenTradesExits, SCHEDULER_INTERVALS.TRADE_MONITOR);
  }
}
