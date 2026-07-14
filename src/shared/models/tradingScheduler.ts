import { prisma } from '../../database/db';
import { SCHEDULER_INTERVALS } from '../../core/constants';
import { KiteClient } from '../services/kite';
import { performKiteAutoLogin } from '../services/kiteAutoLogin';
import type { StockQuote } from './algoEngine';
import type { WsLiveFeed } from './wsLiveFeed';
import { getTickSizeAndRound } from '../utils/tickSizeUtil';
import { concurrentMap } from '../../core/helpers';
import { logSystemEvent } from '../services/auditLogger';
import { getLatestOrderState } from '../utils/kiteHelper';

export interface EngineAccess {
  todayTokenRefreshed: Set<string>;
  getAlgoSetting(key: string, defaultValue: string): Promise<string>;
  getPreOpenStocks(): Promise<StockQuote[]>;
  preSelectAllClients(strategyId?: string): Promise<void>;
  executePreOpenTrades(adminId: string, mockStocks?: StockQuote[], strategyId?: string, legIndex?: number, dualLegGroupId?: string | null): Promise<void>;
}

export class TradingScheduler {
  static readonly BATCH_CONCURRENCY = 5;
  static readonly TRADE_MONITOR_CONCURRENCY = 10;
  private isMonitoringRunning = false;
  private lastOhlcSnapshot: Map<string, string> = new Map();

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
    const knownPreSelectTime: Map<string, string> = new Map();
    const knownEntryTime: Map<string, string> = new Map();
    const dailyDualLegGroupId: Map<string, string> = new Map();
    let cachedFetchTime = '09:08';

    const checkAndExecute = async () => {
      try {
        const istDateStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
        const istDate = new Date(istDateStr);
        const hours = istDate.getHours();
        const minutes = istDate.getMinutes();
        const currentDateKey = istDate.toLocaleDateString();
        const currentTimeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

        // Market hours guard: 07:00-16:00 IST ke bahar zero DB/logs
        if (hours < 7 || hours >= 16) return;

        // Check for OHLC snapshots at specific times
        const targetOhlcTimes = ['09:20', '09:30', '09:45', '12:00'];
        if (targetOhlcTimes.includes(currentTimeStr) && this.lastOhlcSnapshot.get(currentTimeStr) !== currentDateKey) {
          this.lastOhlcSnapshot.set(currentTimeStr, currentDateKey);
          this.recordOhlcSnapshot(currentTimeStr, currentDateKey).catch(err => {
            console.error('Error recording OHLC snapshot in scheduler thread:', err);
          });
        }

        cachedFetchTime = await this.engine.getAlgoSetting('algo_preopen_fetch_time', '09:08');

        if (currentTimeStr === cachedFetchTime && lastFetchedDate !== currentDateKey) {
          console.log(`AlgoEngine Scheduler: Pre-open fetch time ${cachedFetchTime} reached. Fetching NSE pre-open data...`);
          lastFetchedDate = currentDateKey;
          dailyDualLegGroupId.clear();
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

          const preSelectTimeFull = config.basicInfo?.preSelectTime || null;
          const preSelectTime = preSelectTimeFull ? preSelectTimeFull.slice(0, 5) : null;
          const preSelectSeconds = preSelectTimeFull && preSelectTimeFull.length >= 8 ? parseInt(preSelectTimeFull.slice(6, 8)) : 0;

          const entryTimeFull = config.basicInfo?.entryTime || null;
          const entryTime = entryTimeFull ? entryTimeFull.slice(0, 5) : null;
          const entrySeconds = entryTimeFull && entryTimeFull.length >= 8 ? parseInt(entryTimeFull.slice(6, 8)) : 0;

          if (preSelectTime) {
            const prevTime = knownPreSelectTime.get(strategy.id);
            if (prevTime !== undefined && prevTime !== preSelectTime) {
              console.log(`AlgoEngine Scheduler: Pre-select time changed for "${strategy.name}" ${prevTime} -> ${preSelectTime}. Resetting trigger.`);
              lastPreSelectByStrategy.delete(strategy.id);
            }
            knownPreSelectTime.set(strategy.id, preSelectTime);
          }

          if (entryTime) {
            const prevTime = knownEntryTime.get(strategy.id);
            if (prevTime !== undefined && prevTime !== entryTime) {
              console.log(`AlgoEngine Scheduler: Entry time changed for "${strategy.name}" ${prevTime} -> ${entryTime}. Resetting trigger.`);
              lastEntryByStrategy.delete(strategy.id);
            }
            knownEntryTime.set(strategy.id, entryTime);
          }

          if (preSelectTime && currentTimeStr >= preSelectTime && lastPreSelectByStrategy.get(strategy.id) !== currentDateKey) {
            console.log(`AlgoEngine Scheduler: Pre-select time ${preSelectTimeFull} reached for strategy "${strategy.name}". (Waiting ${preSelectSeconds}s)`);
            lastPreSelectByStrategy.set(strategy.id, currentDateKey);
            if (preSelectSeconds > 0) {
              preSelectTasks.push(async () => {
                await new Promise(resolve => setTimeout(resolve, preSelectSeconds * 1000));
                await this.engine.preSelectAllClients(strategy.id);
              });
            } else {
              preSelectTasks.push(() => this.engine.preSelectAllClients(strategy.id));
            }
          }

          if (entryTime) {
            const [eH, eM] = entryTime.split(':').map(Number);
            const entryMin = eH * 60 + eM;
            const curMin = hours * 60 + minutes;
            const entryDebug = `[${strategy.name}] now=${currentTimeStr} entry=${entryTime} cmp=${currentTimeStr >= entryTime ? 'Y' : 'N'} lastEntry=${lastEntryByStrategy.get(strategy.id) || '-'} today=${currentDateKey}`;
            if (curMin >= entryMin && curMin <= entryMin + 5 && lastEntryByStrategy.get(strategy.id) !== currentDateKey) {
              const todayStart = new Date();
              todayStart.setHours(0, 0, 0, 0);
              const existingTrade = await prisma.trade.findFirst({
                where: { strategyId: strategy.id, createdAt: { gte: todayStart } }
              });
              if (existingTrade) {
                lastEntryByStrategy.set(strategy.id, currentDateKey);
                console.log(`AlgoEngine Scheduler: Trades exist today for "${strategy.name}". Skipping re-entry.`);
                continue;
              }
              console.log(`AlgoEngine Scheduler: Entry time ${entryTimeFull} reached for "${strategy.name}". Triggering in ${entrySeconds}s. (${entryDebug})`);
              lastEntryByStrategy.set(strategy.id, currentDateKey);

              if (!adminId || adminId === 'system-scheduler') {
                const firstAdmin = await prisma.user.findFirst({ where: { role: 'admin' } });
                if (firstAdmin) adminId = firstAdmin.id;
              }

              if (entrySeconds > 0) {
                entryTasks.push(async () => {
                  await new Promise(resolve => setTimeout(resolve, entrySeconds * 1000));
                  await this.engine.executePreOpenTrades(adminId, undefined, strategy.id);
                });
              } else {
                entryTasks.push(() => this.engine.executePreOpenTrades(adminId, undefined, strategy.id));
              }
            } else {
              // Only log skip when within 5 minutes of entry time to reduce log noise
              if (entryTime) {
                const [eH, eM] = entryTime.split(':').map(Number);
                const entryMinutes = eH * 60 + eM;
                const currentMinutes = hours * 60 + minutes;
                if (entryMinutes - currentMinutes <= 5) {
                  console.log(`AlgoEngine Scheduler: Entry skip for "${strategy.name}" (${entryDebug})`);
                }
              }
            }
          }

          // --- Dual Leg: Check per-leg entry times ---
          const legs = config.legs || [];
          if (legs.length > 0) {
            const enabledLegs = legs.filter((l: any) => l.enabled);
            let strategyGroupId = dailyDualLegGroupId.get(strategy.id);
            if (enabledLegs.length > 1 && !strategyGroupId) {
              strategyGroupId = crypto.randomUUID();
              dailyDualLegGroupId.set(strategy.id, strategyGroupId);
            }
            for (let li = 0; li < legs.length; li++) {
              const leg = legs[li];
              if (!leg.enabled) continue;
              const legEntryTimeFull = leg.entryTime || null;
              if (!legEntryTimeFull) continue;
              const legEntryTime = legEntryTimeFull.slice(0, 5);
              const legEntrySeconds = legEntryTimeFull.length >= 8 ? parseInt(legEntryTimeFull.slice(6, 8)) : 0;
              const legKey = `leg_${li}_${strategy.id}`;

              const prevTime = knownEntryTime.get(legKey);
              if (prevTime !== undefined && prevTime !== legEntryTime) {
                console.log(`AlgoEngine Scheduler: Entry time changed for "${strategy.name}" Leg ${li + 1} ${prevTime} -> ${legEntryTime}. Resetting trigger.`);
                lastEntryByStrategy.delete(legKey);
              }
              knownEntryTime.set(legKey, legEntryTime);

              const [legH, legM] = legEntryTime.split(':').map(Number);
              const legMin = legH * 60 + legM;
              const curMinLeg = hours * 60 + minutes;
              if (curMinLeg >= legMin && curMinLeg <= legMin + 5 && lastEntryByStrategy.get(legKey) !== currentDateKey) {
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);
                const existingLegTrade = await prisma.trade.findFirst({
                  where: { strategyId: strategy.id, legName: leg.name, createdAt: { gte: todayStart } }
                });
                if (existingLegTrade) {
                  lastEntryByStrategy.set(legKey, currentDateKey);
                  console.log(`AlgoEngine Scheduler: Trades exist today for "${strategy.name}" Leg ${li + 1}. Skipping re-entry.`);
                  continue;
                }
                console.log(`AlgoEngine Scheduler: Leg ${li + 1} entry time ${legEntryTimeFull} reached for "${strategy.name}". Triggering in ${legEntrySeconds}s.`);
                lastEntryByStrategy.set(legKey, currentDateKey);

                if (!adminId || adminId === 'system-scheduler') {
                  const firstAdmin = await prisma.user.findFirst({ where: { role: 'admin' } });
                  if (firstAdmin) adminId = firstAdmin.id;
                }

                if (legEntrySeconds > 0) {
                  entryTasks.push(async () => {
                    await new Promise(resolve => setTimeout(resolve, legEntrySeconds * 1000));
                    await this.engine.executePreOpenTrades(adminId, undefined, strategy.id, li, strategyGroupId || null);
                  });
                } else {
                  const liCaptured = li;
                  const gId = strategyGroupId || null;
                  entryTasks.push(() => this.engine.executePreOpenTrades(adminId, undefined, strategy.id, liCaptured, gId));
                }
              } else {
                // Only log skip when within 5 minutes of entry time to reduce log noise
                const [legH, legM] = legEntryTime.split(':').map(Number);
                const legEntryMinutes = legH * 60 + legM;
                const currentMinutes = hours * 60 + minutes;
                const minutesToEntry = legEntryMinutes - currentMinutes;
                if (minutesToEntry <= 5) {
                  console.log(`AlgoEngine Scheduler: Leg ${li + 1} skip for "${strategy.name}" (now=${currentTimeStr}, legEntry=${legEntryTime}, lastEntry=${lastEntryByStrategy.get(legKey) || '-'})`);
                }
              }
            }
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

          const CONCURRENCY = 15;
          const LOGIN_TIMEOUT = 20000;
          console.log(`AlgoEngine Scheduler: Auto-login ${clients.length} clients with concurrency ${CONCURRENCY}...`);
          await concurrentMap(clients, async (client) => {
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
          }, CONCURRENCY, LOGIN_TIMEOUT);
          console.log(`AlgoEngine Scheduler: Auto-login completed for ${clients.length} clients.`);
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
        const istDateStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
        const istDate = new Date(istDateStr);
        const hours = istDate.getHours();
        const minutes = istDate.getMinutes();
        const currentTimeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

        const strategies = await prisma.strategy.findMany({ where: { status: 'active' } });
        if (strategies.length === 0) {
          this.isMonitoringRunning = false;
          return;
        }

        let isWithinActiveWindow = false;
        for (const strategy of strategies) {
          if (!strategy.configJson) continue;
          try {
            const config = JSON.parse(strategy.configJson);
            const preSelectTime = config.basicInfo?.preSelectTime?.slice(0, 5) || '09:15';
            const exitTime = config.basicInfo?.exitTime?.slice(0, 5) || '15:24';
            if (currentTimeStr >= preSelectTime && currentTimeStr <= exitTime) {
              isWithinActiveWindow = true;
              break;
            }
          } catch {}
        }

        const openTradesCount = await prisma.trade.count({ where: { status: 'open' } });
        if (!isWithinActiveWindow && openTradesCount === 0) {
          this.isMonitoringRunning = false;
          return;
        }

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
              console.warn(`AlgoEngine Monitor: Could not find instrument token for symbol ${trade.symbol}. Fallback historical check will be disabled.`);
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
            // marketProtectionVal is set during entry creation; this is a fallback

            const entryPrice = Number(trade.entryPrice);
            const exchangeParam = config.basicInfo.exchange;
            const isShortTrade = (trade.direction === 'SHORT');
            let exitTriggered = false;
            let exitPrice = 0;
            let exitReason = '';

            let slComplete = false;
            let targetComplete = false;

            // --- Priority 1: Check SL/Target order status via API ---
            if (trade.slOrderId || trade.targetOrderId) {
              let slAvgPrice = 0;
              let targetAvgPrice = 0;

              if (trade.slOrderId) {
                try {
                  const slStatus = await KiteClient.getOrderById(client.zerodhaApiKey, client.accessToken, trade.slOrderId);
                  const slData = getLatestOrderState(slStatus?.data);
                  if (slStatus?.status === 'success' && slData) {
                    await prisma.trade.update({ where: { id: trade.id }, data: { slOrderStatus: slData.status === 'COMPLETE' ? 'filled' : slData.status } });
                    if (slData?.status === 'COMPLETE') {
                      slComplete = true;
                      slAvgPrice = Number(slData?.average_price || slData?.filled_price || 0);
                      console.log(`AlgoEngine Monitor: SL order ${trade.slOrderId} COMPLETE for ${trade.symbol} @ ₹${slAvgPrice}`);
                    } else if (slData?.status === 'CANCELLED' || slData?.status === 'REJECTED') {
                      console.log(`AlgoEngine Monitor: SL order ${trade.slOrderId} ${slData?.status}`);
                      await prisma.trade.update({ where: { id: trade.id }, data: { slOrderStatus: slData.status } });
                    }
                  }
                } catch (e) { console.warn(`AlgoEngine Monitor: SL order status check failed for ${trade.symbol}:`, e); }
              }

              if (trade.targetOrderId) {
                try {
                  const tgtStatus = await KiteClient.getOrderById(client.zerodhaApiKey, client.accessToken, trade.targetOrderId);
                  const tgtData = getLatestOrderState(tgtStatus?.data);
                  if (tgtStatus?.status === 'success' && tgtData) {
                    await prisma.trade.update({ where: { id: trade.id }, data: { targetOrderStatus: tgtData.status === 'COMPLETE' ? 'filled' : tgtData.status } });
                    if (tgtData?.status === 'COMPLETE') {
                      targetComplete = true;
                      targetAvgPrice = Number(tgtData?.average_price || tgtData?.filled_price || 0);
                      console.log(`AlgoEngine Monitor: Target order ${trade.targetOrderId} COMPLETE for ${trade.symbol} @ ₹${targetAvgPrice}`);
                    } else if (tgtData?.status === 'CANCELLED' || tgtData?.status === 'REJECTED') {
                      console.log(`AlgoEngine Monitor: Target order ${trade.targetOrderId} ${tgtData?.status}`);
                      await prisma.trade.update({ where: { id: trade.id }, data: { targetOrderStatus: tgtData.status } });
                      // Agar dono orders cancel hue (Zerodha auto square-off ya manual), trade CANCELLED mark karo
                      const slAlsoCancelled = !slComplete && (trade.slOrderId ? true : true);
                      if (slAlsoCancelled) {
                        await prisma.trade.update({
                          where: { id: trade.id },
                          data: { status: 'cancelled', exitTime: new Date(), exitReason: 'Orders Cancelled (External/Auto Square-off)' }
                        });
                        console.log(`AlgoEngine Monitor: Both SL & Target cancelled for trade ${trade.id} (${trade.symbol}). Marked CANCELLED.`);
                        return;
                      }
                    }
                  }
                } catch (e) { console.warn(`AlgoEngine Monitor: Target order status check failed for ${trade.symbol}:`, e); }
              }

              if (slComplete) {
                exitTriggered = true;
                exitPrice = slAvgPrice > 0 ? slAvgPrice : Number(trade.stopLoss || (isShortTrade ? entryPrice * (1 + slPercent / 100) : entryPrice * (1 - slPercent / 100)));
                exitReason = 'SL Hit';
                if (trade.targetOrderId) {
                  try {
                    await KiteClient.cancelOrder(client.zerodhaApiKey, client.accessToken, trade.targetOrderId);
                    console.log(`AlgoEngine Monitor: Cancelled target order ${trade.targetOrderId} (SL hit first)`);
                  } catch (e) { console.warn(`AlgoEngine Monitor: Failed to cancel target order ${trade.targetOrderId}:`, e); }
                }
              } else if (targetComplete) {
                exitTriggered = true;
                exitPrice = targetAvgPrice > 0 ? targetAvgPrice : Number(trade.target || (isShortTrade ? entryPrice * (1 - targetPercent / 100) : entryPrice * (1 + targetPercent / 100)));
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
                const priceFavourable = isShortTrade ? (price > 0 && price < entryPrice) : (price > 0 && price > entryPrice);
                if (priceFavourable) {
                  const currentSlTrigger = Number(trade.slTriggerPrice);
                  const trailStepValue = entryPrice * (trailingSlStep / 100);
                  const priceMovePct = isShortTrade
                    ? ((entryPrice - price) / entryPrice) * 100
                    : ((price - entryPrice) / entryPrice) * 100;
                  const trailsToApply = Math.floor(priceMovePct / trailingSlStep);
                  if (trailsToApply > 0) {
                    const newSlTrigger = isShortTrade
                      ? entryPrice - (trailsToApply * trailStepValue)
                      : entryPrice + (trailsToApply * trailStepValue);
                    const shouldUpdate = isShortTrade ? (newSlTrigger < currentSlTrigger) : (newSlTrigger > currentSlTrigger);
                    if (shouldUpdate) {
                      try {
                        const finalSlTrigger = await getTickSizeAndRound(client.zerodhaApiKey, client.accessToken, exchangeParam, trade.symbol, newSlTrigger);
                        const modRes = await KiteClient.modifyOrder(client.zerodhaApiKey, client.accessToken, trade.slOrderId, {
                          trigger_price: finalSlTrigger
                        });
                        if (modRes?.status === 'success') {
                          await prisma.trade.update({
                            where: { id: trade.id },
                            data: { slTriggerPrice: finalSlTrigger }
                          });
                          console.log(`AlgoEngine Monitor: Trailing SL for ${trade.symbol}: ${currentSlTrigger} → ${finalSlTrigger} (price: ${price})`);
                        }
                      } catch (e) { console.warn(`AlgoEngine Monitor: Trailing SL modify failed for ${trade.symbol}:`, e); }
                    }
                  }
                }
              }

              // --- Trailing Target ---
              if (!exitTriggered && trade.targetOrderId && trade.target && trailingTgtStep > 0) {
                const price = this.wsLive.getStockLtp(trade.symbol);
                const priceFavourable = isShortTrade ? (price > 0 && price < entryPrice) : (price > 0 && price > entryPrice);
                if (priceFavourable) {
                  const currentTarget = Number(trade.target);
                  const trailStepValue = entryPrice * (trailingTgtStep / 100);
                  const priceMovePct = isShortTrade
                    ? ((entryPrice - price) / entryPrice) * 100
                    : ((price - entryPrice) / entryPrice) * 100;
                  const trailsToApply = Math.floor(priceMovePct / trailingTgtStep);
                  if (trailsToApply > 0) {
                    const newTarget = isShortTrade
                      ? entryPrice - (trailsToApply * trailStepValue)
                      : entryPrice + (trailsToApply * trailStepValue);
                    const shouldUpdate = isShortTrade ? (newTarget < currentTarget) : (newTarget > currentTarget);
                    if (shouldUpdate) {
                      try {
                        const finalTarget = await getTickSizeAndRound(client.zerodhaApiKey, client.accessToken, exchangeParam, trade.symbol, newTarget);
                        const modRes = await KiteClient.modifyOrder(client.zerodhaApiKey, client.accessToken, trade.targetOrderId, {
                          price: finalTarget
                        });
                        if (modRes?.status === 'success') {
                          await prisma.trade.update({
                            where: { id: trade.id },
                            data: { target: finalTarget }
                          });
                          console.log(`AlgoEngine Monitor: Trailing Target for ${trade.symbol}: ${currentTarget} → ${finalTarget} (price: ${price})`);
                        }
                      } catch (e) { console.warn(`AlgoEngine Monitor: Trailing Target modify failed for ${trade.symbol}:`, e); }
                    }
                  }
                }
              }
            }

            // --- Priority 1.5: Check entry order for cancellation/rejection ---
            if (!exitTriggered && trade.entryOrderId) {
              try {
                const orderData = await KiteClient.getOrderById(client.zerodhaApiKey, client.accessToken, trade.entryOrderId);
                const latestOrder = getLatestOrderState(orderData?.data);
                const orderStatus = latestOrder?.status;
                if (orderStatus === 'CANCELLED' || orderStatus === 'REJECTED') {
                  await prisma.trade.update({
                    where: { id: trade.id },
                    data: { status: 'FAILED', entryOrderStatus: orderStatus }
                  });
                  console.warn(`AlgoEngine Monitor: Entry order ${trade.entryOrderId} ${orderStatus}. Trade ${trade.id} marked FAILED.`);
                  return;
                }
              } catch (e) {
                console.warn(`AlgoEngine Monitor: Entry order status check failed for ${trade.symbol}:`, e);
              }
            }

            // --- Priority 2: Entry placed but SL/Target not yet set ---
            if (!exitTriggered && (!trade.slOrderId || !trade.targetOrderId) && trade.entryOrderId) {
              try {
                const entryStatus = await KiteClient.getOrderById(client.zerodhaApiKey, client.accessToken, trade.entryOrderId);
                const latestEntryOrder = getLatestOrderState(entryStatus?.data);
                if (entryStatus?.status === 'success' && latestEntryOrder) {
                  await prisma.trade.update({ where: { id: trade.id }, data: { entryOrderStatus: latestEntryOrder.status === 'COMPLETE' ? 'filled' : latestEntryOrder.status } });
                  if (latestEntryOrder.status === 'COMPLETE') {
                    const filledPrice = Number(latestEntryOrder?.average_price || latestEntryOrder?.filled_price || 0);
                  if (filledPrice > 0) {
                    await prisma.trade.update({ where: { id: trade.id }, data: { entryPrice: filledPrice } });
                  }
                  // Entry fill hui — ab SL aur Target place karo
                  let newSlOrderId = trade.slOrderId || '';
                  let newTargetOrderId = trade.targetOrderId || '';
                  let productParam = 'MIS';
                  if (config?.basicInfo) {
                    const tradeType = config.basicInfo.tradeType;
                    const isFoSegment = config.basicInfo.segment === 'NSE F&O' || config.basicInfo.segment === 'Futures' || config.basicInfo.segment === 'Options';
                    productParam = (tradeType === 'Delivery' && !isFoSegment) ? 'CNC' : (tradeType === 'Carry Forward' || tradeType === 'Normal' || tradeType === 'NRML' || (tradeType === 'Delivery' && isFoSegment)) ? 'NRML' : 'MIS';
                  } else {
                    const validProducts = ['MIS', 'CNC', 'NRML'];
                    productParam = validProducts.includes(trade.orderType) ? trade.orderType : 'MIS';
                  }

                  const rawSlTrigger = Number(trade.slTriggerPrice || (filledPrice > 0 ? (isShortTrade ? filledPrice * (1 + slPercent / 100) : filledPrice * (1 - slPercent / 100)) : 0));
                  const rawTarget = Number(trade.target || (filledPrice > 0 ? (isShortTrade ? filledPrice * (1 - targetPercent / 100) : filledPrice * (1 + targetPercent / 100)) : 0));

                  let finalSlTrigger = rawSlTrigger;
                  let finalTarget = rawTarget;

                  if (client.zerodhaApiKey && client.accessToken) {
                    finalSlTrigger = await getTickSizeAndRound(client.zerodhaApiKey, client.accessToken, exchangeParam, trade.symbol, rawSlTrigger);
                    finalTarget = await getTickSizeAndRound(client.zerodhaApiKey, client.accessToken, exchangeParam, trade.symbol, rawTarget);
                  }

                  if (client.zerodhaApiKey && client.accessToken) {
                    if (!trade.slOrderId || trade.slOrderId === '') {
                      try {
                        const slParams = {
                          exchange: exchangeParam, tradingsymbol: trade.symbol,
                          transaction_type: isShortTrade ? 'BUY' as const : 'SELL' as const, quantity: Number(trade.quantity),
                          order_type: 'SL-M' as const, product: productParam as any,
                          validity: 'DAY' as const,
                          trigger_price: finalSlTrigger,
                          market_protection: marketProtectionVal
                        };
                        const slRes = await KiteClient.placeOrder(client.zerodhaApiKey, client.accessToken, slParams);
                        if (slRes?.status === 'success' && slRes.data?.order_id) {
                          newSlOrderId = slRes.data.order_id;
                          await prisma.trade.update({ where: { id: trade.id }, data: { slOrderStatus: 'OPEN', slKiteResponse: slRes } });
                        } else if (slRes?.status === 'error') {
                          newSlOrderId = 'REJECTED';
                          await prisma.trade.update({ where: { id: trade.id }, data: { slOrderStatus: 'REJECTED', slKiteResponse: slRes } });
                          const errMsg = `Kite rejected SL order for ${trade.symbol}. Reason: ${slRes.message}`;
                          console.warn(`AlgoEngine Monitor: ${errMsg}`);
                          await logSystemEvent({
                            action: 'SL ORDER REJECTED',
                            oldValue: `Trade ID: ${trade.id}`,
                            newValue: errMsg
                          });
                        }
                      } catch (slErr) { console.warn(`AlgoEngine Monitor: SL placement failed for ${trade.symbol}:`, slErr); }
                    }

                    if (!trade.targetOrderId || trade.targetOrderId === '') {
                      try {
                        const targetParams = {
                          exchange: exchangeParam, tradingsymbol: trade.symbol,
                          transaction_type: isShortTrade ? 'BUY' as const : 'SELL' as const, quantity: Number(trade.quantity),
                          order_type: 'LIMIT' as const, product: productParam as any,
                          validity: 'DAY' as const,
                          price: finalTarget
                        };
                        const tgtRes = await KiteClient.placeOrder(client.zerodhaApiKey, client.accessToken, targetParams);
                        if (tgtRes?.status === 'success' && tgtRes.data?.order_id) {
                          newTargetOrderId = tgtRes.data.order_id;
                          await prisma.trade.update({ where: { id: trade.id }, data: { targetOrderStatus: 'OPEN', targetKiteResponse: tgtRes } });
                        } else if (tgtRes?.status === 'error') {
                          newTargetOrderId = 'REJECTED';
                          await prisma.trade.update({ where: { id: trade.id }, data: { targetOrderStatus: 'REJECTED', targetKiteResponse: tgtRes } });
                          const errMsg = `Kite rejected Target order for ${trade.symbol}. Reason: ${tgtRes.message}`;
                          console.warn(`AlgoEngine Monitor: ${errMsg}`);
                          await logSystemEvent({
                            action: 'TARGET ORDER REJECTED',
                            oldValue: `Trade ID: ${trade.id}`,
                            newValue: errMsg
                          });
                        }
                      } catch (tgtErr) { console.warn(`AlgoEngine Monitor: Target placement failed for ${trade.symbol}:`, tgtErr); }
                    }
                  } // Closes if (client.zerodhaApiKey && client.accessToken)

                  await prisma.trade.update({
                    where: { id: trade.id },
                    data: {
                      slOrderId: newSlOrderId || null,
                      targetOrderId: newTargetOrderId || null,
                      slTriggerPrice: finalSlTrigger,
                      target: finalTarget,
                      originalStopLoss: Number(trade.originalStopLoss) || rawSlTrigger,
                      originalTarget: Number(trade.originalTarget) || rawTarget
                    }
                  });
                  console.log(`AlgoEngine Monitor: Entry ${trade.entryOrderId} filled. SL: ${newSlOrderId || 'N/A'}, Target: ${newTargetOrderId || 'N/A'} placed for ${trade.symbol}.`);
                  return; // next cycle monitor karega SL/Target
                } // Closes if (latestEntryOrder.status === 'COMPLETE')

                if (latestEntryOrder.status === 'CANCELLED' || latestEntryOrder.status === 'REJECTED') {
                  await prisma.trade.update({ where: { id: trade.id }, data: { status: 'FAILED' } });
                  console.warn(`AlgoEngine Monitor: Entry order ${trade.entryOrderId} ${latestEntryOrder.status}. Trade ${trade.id} marked FAILED.`);
                  return;
                }
              } // Closes if (entryStatus?.status === 'success' && latestEntryOrder)
            } catch (e) { console.warn(`AlgoEngine Monitor: Entry status check failed for ${trade.symbol}:`, e); }
            } // Closes Priority 2 if statement

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
                  const stopLossLevel = isShortTrade ? entryPrice + fallbackSlPoints : entryPrice - fallbackSlPoints;
                  let targetLevel: number;
                  if (targetType === 'Risk Reward Ratio') {
                    if (!config?.target?.riskRewardRatio) return;
                    const rr = config.target.riskRewardRatio;
                    targetLevel = isShortTrade ? entryPrice - (fallbackSlPoints * rr) : entryPrice + (fallbackSlPoints * rr);
                  } else {
                    targetLevel = isShortTrade ? entryPrice * (1 - targetPercent / 100) : entryPrice * (1 + targetPercent / 100);
                  }

                  console.log(`AlgoEngine Monitor: Trade ${trade.id} (${trade.symbol}) | Entry: ₹${entryPrice.toFixed(2)} | Current: ₹${currentClosePrice.toFixed(2)} | SL: ₹${stopLossLevel.toFixed(2)} | Target: ₹${targetLevel.toFixed(2)}`);

                  const slHit = isShortTrade ? (currentClosePrice >= stopLossLevel) : (currentClosePrice <= stopLossLevel);
                  const targetHit = isShortTrade ? (currentClosePrice <= targetLevel) : (currentClosePrice >= targetLevel);
                  if (slHit) {
                    exitTriggered = true;
                    exitPrice = currentClosePrice;
                    exitReason = 'SL Hit (candle)';
                  } else if (targetHit) {
                    exitTriggered = true;
                    exitPrice = currentClosePrice;
                    exitReason = 'Target Hit (candle)';
                  }
                }
              } else {
                console.warn(`AlgoEngine Monitor: Skipping fallback historical check for trade ${trade.id} - missing instrument token.`);
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

                // Cancel pending orders before exiting
                if (trade.slOrderId) {
                  try { await KiteClient.cancelOrder(client.zerodhaApiKey, client.accessToken, trade.slOrderId); } catch (e) { }
                }
                if (trade.targetOrderId) {
                  try { await KiteClient.cancelOrder(client.zerodhaApiKey, client.accessToken, trade.targetOrderId); } catch (e) { }
                }
              }
            }

            // --- Exit Execution ---
            if (exitTriggered) {
              console.log(`AlgoEngine Monitor: EXIT TRIGGERED for trade ${trade.id} (${trade.symbol}) due to ${exitReason} at ₹${exitPrice.toFixed(2)}.`);

              let sellRes: any = null;
              let isManualExit = !slComplete && !targetComplete;

              if (isManualExit) {
                let productToUse = 'MIS';
                if (config?.basicInfo) {
                  const tradeType = config.basicInfo.tradeType;
                  const isFoSegment = config.basicInfo.segment === 'NSE F&O' || config.basicInfo.segment === 'Futures' || config.basicInfo.segment === 'Options';
                  productToUse = (tradeType === 'Delivery' && !isFoSegment) ? 'CNC' : (tradeType === 'Carry Forward' || tradeType === 'Normal' || tradeType === 'NRML' || (tradeType === 'Delivery' && isFoSegment)) ? 'NRML' : 'MIS';
                } else {
                  const validProducts = ['MIS', 'CNC', 'NRML'];
                  productToUse = validProducts.includes(trade.orderType) ? trade.orderType : 'MIS';
                }

                const sellParams = {
                  exchange: exchangeParam,
                  tradingsymbol: trade.symbol,
                  transaction_type: isShortTrade ? 'BUY' as const : 'SELL' as const,
                  quantity: trade.quantity,
                  order_type: 'MARKET' as const,
                  product: productToUse as any,
                  validity: 'DAY' as const,
                  market_protection: marketProtectionVal
                };

                sellRes = await KiteClient.placeOrder(client.zerodhaApiKey, client.accessToken, sellParams);

                // Actual fill price fetch karo (2.5 sec wait karo fill hone do)
                if (sellRes?.status === 'success' && sellRes?.data?.order_id) {
                  try {
                    await new Promise(r => setTimeout(r, 2500));
                    const fillData = await KiteClient.getOrderById(client.zerodhaApiKey, client.accessToken, sellRes.data.order_id);
                    const fillOrder = getLatestOrderState(fillData?.data);
                    const actualFillPrice = Number(fillOrder?.average_price || 0);
                    if (actualFillPrice > 0) {
                      exitPrice = actualFillPrice; // ← Actual market sell price
                      console.log(`AlgoEngine Monitor: Market Close actual fill price for ${trade.symbol}: ₹${actualFillPrice}`);
                    }
                  } catch (e) {
                    console.warn(`AlgoEngine Monitor: Could not fetch fill price for ${trade.symbol}, using LTP fallback.`);
                    // Fallback: WebSocket se LTP lo
                    const ltp = this.wsLive.getStockLtp(trade.symbol);
                    if (ltp > 0) exitPrice = ltp;
                  }
                }
              } else {
                sellRes = { status: 'success', data: { order_id: slComplete ? trade.slOrderId : trade.targetOrderId } };
              }

              if (sellRes && sellRes.status === 'success') {
                const sellOrderId = sellRes.data?.order_id || 'manual-exit';
                const pnlValue = isShortTrade ? (entryPrice - exitPrice) * trade.quantity : (exitPrice - entryPrice) * trade.quantity;
                const newStatus = exitReason.toLowerCase().includes('sl') ? 'sl_hit' : (exitReason.toLowerCase().includes('target') ? 'target_hit' : 'closed');

                const updateData: any = {
                  status: newStatus,
                  exitPrice: exitPrice,
                  exitTime: new Date(),
                  exitReason: exitReason,
                  pnl: pnlValue,
                  kiteResponse: sellRes
                };

                if (slComplete) {
                  updateData.targetOrderStatus = 'CANCELLED';
                } else if (targetComplete) {
                  updateData.slOrderStatus = 'CANCELLED';
                } else {
                  // This is market close or manual exit
                  if (trade.slOrderId) updateData.slOrderStatus = 'CANCELLED';
                  if (trade.targetOrderId) updateData.targetOrderStatus = 'CANCELLED';
                }

                await prisma.trade.update({
                  where: { id: trade.id },
                  data: updateData
                });

                await prisma.strategyLog.create({
                  data: {
                    strategyId: strategy.id,
                    message: `Trade Closed for ${client.user.name}: ${isShortTrade ? 'Covered (Short)' : 'Sold (Long)'} ${trade.quantity} ${trade.symbol} @ ₹${exitPrice.toFixed(2)} (${exitReason}). P&L: ₹${pnlValue.toFixed(2)}`,
                    logType: 'trade'
                  }
                });

                await logSystemEvent({
                  action: 'AUTO TRADE CLOSED',
                  oldValue: `Trade ID: ${trade.id}`,
                  newValue: `${isShortTrade ? 'Covered (Short)' : 'Sold (Long)'} ${trade.quantity} ${trade.symbol} @ ₹${exitPrice.toFixed(2)} | ${exitReason} | P&L: ₹${pnlValue.toFixed(2)}`
                });
              } else {
                console.error(`AlgoEngine Monitor: Failed to place exit order for ${trade.symbol}:`, sellRes?.message);
                await prisma.trade.update({
                  where: { id: trade.id },
                  data: { status: 'FAILED', exitTime: new Date(), exitReason: `Exit failed: ${sellRes?.message || 'Unknown'}`, kiteResponse: sellRes }
                });
                await prisma.strategyLog.create({
                  data: {
                    strategyId: strategy.id,
                    message: `Exit failed for ${client.user.name} (${trade.symbol}): ${sellRes?.message || 'Unknown'}. Trade marked FAILED.`,
                    logType: 'error'
                  }
                });
                await logSystemEvent({
                  action: 'AUTO TRADE EXIT FAILED',
                  oldValue: `Trade ID: ${trade.id}`,
                  newValue: `Failed exit for ${client.user.name} (${trade.symbol}) | Error: ${sellRes?.message || 'Unknown'}`
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

        // --- OCO Monitoring: Cancel loser leg's orders if one leg filled ---
        try {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const dualLegTrades = await prisma.trade.findMany({
            where: {
              dualLegGroupId: { not: null },
              createdAt: { gte: today },
              status: { in: ['pending', 'open'] }
            },
            include: { client: { include: { user: true } } }
          });

          const groups = new Map<string, typeof dualLegTrades>();
          for (const t of dualLegTrades) {
            const gId = t.dualLegGroupId!;
            if (!groups.has(gId)) groups.set(gId, []);
            groups.get(gId)!.push(t);
          }

          for (const [gId, trades] of groups) {
            const filled = trades.filter(t => t.status === 'open' && (t.entryOrderStatus === 'filled' || t.entryOrderStatus === 'COMPLETE'));
            const filledIds = new Set(filled.map(t => t.id));
            const losers = trades.filter(t => !filledIds.has(t.id));

            if (filled.length > 0 && losers.length > 0) {
              for (const loser of losers) {
                console.log(`AlgoEngine Monitor: OCO — Leg "${loser.legName}" lost to "${filled[0].legName}" for group ${gId}. Cancelling all orders.`);
                const clientCred = loser.client;
                if (clientCred?.zerodhaApiKey && clientCred?.accessToken) {
                  // Cancel entry order
                  if (loser.entryOrderId) {
                    try {
                      await KiteClient.cancelOrder(clientCred.zerodhaApiKey, clientCred.accessToken, loser.entryOrderId);
                    } catch (e) { console.warn(`OCO: Failed to cancel entry ${loser.entryOrderId}:`, e); }
                  }
                  // Cancel SL order
                  if (loser.slOrderId) {
                    try {
                      await KiteClient.cancelOrder(clientCred.zerodhaApiKey, clientCred.accessToken, loser.slOrderId);
                    } catch (e) { console.warn(`OCO: Failed to cancel SL ${loser.slOrderId}:`, e); }
                  }
                  // Cancel Target order
                  if (loser.targetOrderId) {
                    try {
                      await KiteClient.cancelOrder(clientCred.zerodhaApiKey, clientCred.accessToken, loser.targetOrderId);
                    } catch (e) { console.warn(`OCO: Failed to cancel Target ${loser.targetOrderId}:`, e); }
                  }
                }
                await prisma.trade.update({
                  where: { id: loser.id },
                  data: { status: 'cancelled', entryOrderStatus: 'CANCELLED', exitReason: `OCO: Leg "${filled[0]?.legName || 'other'}" filled first` }
                });
              }
            }
          }
        } catch (ocoErr) {
          console.error('AlgoEngine Monitor: OCO monitoring error:', ocoErr);
        }
      } catch (err) {
        console.error('AlgoEngine Monitor: Error in open trades monitoring cron loop:', err);
      } finally {
        this.isMonitoringRunning = false;
      }
    };

    (global as any).activeTradesMonitoringInterval = setInterval(checkOpenTradesExits, SCHEDULER_INTERVALS.TRADE_MONITOR);
  }

  private async recordOhlcSnapshot(timeStr: string, dateStr: string) {
    try {
      console.log(`AlgoEngine Scheduler: Recording OHLC snapshot for ${dateStr} ${timeStr}...`);
      const stocks = this.wsLive.getStocks();
      if (!stocks || stocks.length === 0) {
        console.warn('AlgoEngine Scheduler: No stocks in WebSocket state to record OHLC.');
        return;
      }

      // Format dateStr to YYYY-MM-DD
      const dateObj = new Date();
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      const formattedDate = `${yyyy}-${mm}-${dd}`;

      // Perform upsert for each stock
      let count = 0;
      for (const stock of stocks) {
        if (!stock.symbol) continue;
        const open = stock.open || stock.ltp || 0;
        const high = stock.high || stock.ltp || 0;
        const low = stock.low || stock.ltp || 0;
        const close = stock.ltp || 0;

        if (close <= 0) continue;

        await prisma.historicalOhlc.upsert({
          where: {
            date_time_symbol: {
              date: formattedDate,
              time: timeStr,
              symbol: stock.symbol
            }
          },
          update: {
            open,
            high,
            low,
            close
          },
          create: {
            date: formattedDate,
            time: timeStr,
            symbol: stock.symbol,
            open,
            high,
            low,
            close
          }
        });
        count++;
      }
      console.log(`AlgoEngine Scheduler: Successfully saved ${count} OHLC stock snapshots for ${formattedDate} at ${timeStr}.`);
    } catch (err) {
      console.error('AlgoEngine Scheduler: Failed to record OHLC snapshot:', err);
    }
  }
}
