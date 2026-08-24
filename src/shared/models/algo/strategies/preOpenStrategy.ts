import { prisma } from '../../../../database/db';
import { KiteClient } from '../../../services/kite';
import { calculateClientCapitalAndRisk } from '../../../utils/marginHelper';
import { logSystemEvent } from '../../../services/auditLogger';
import { API_ENDPOINTS } from '../../../../core/constants';
import { concurrentMap } from '../../../../core/helpers';
import { getTickSizeAndRound } from '../../../utils/tickSizeUtil';
import { getLatestOrderState } from '../../../utils/kiteHelper';
import { performKiteAutoLogin } from '../../../services/kiteAutoLogin';
import { StockQuote } from '../../algoEngine';
import { fetchEligibleClients, fetchClientsByStrategy } from '../clientSelector';
import { getMasterClient } from '../../../utils/masterClient';
import { logFailedTrade } from '../../../utils/tradeLogger';

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

export class PreOpenStrategy {
  private engine: any;

  constructor(engine: any) {
    this.engine = engine;
  }

  async preSelectAllClients(strategyId?: string): Promise<void> {
    this.engine.preselectedStockByStrategy.clear();
    this.engine.marginCache.clear();
    try {
      await prisma.strategyPreselect.deleteMany();
    } catch (e) {
      console.error('AlgoEngine preSelect: Failed to clear old preselections from DB:', e);
    }

    const preOpenStocks = this.engine.preOpenCache.length > 0
      ? this.engine.preOpenCache
      : await this.engine.getPreOpenStocks();

    if (!preOpenStocks || preOpenStocks.length === 0) {
      console.log('AlgoEngine preSelect: No pre-open stocks available. Skipping.');
      return;
    }

    // Fetch eligible clients grouped per strategy (6 conditions via clientSelector)
    const strategyGroups = await fetchClientsByStrategy(true);

    if (strategyGroups.length === 0) {
      console.log('AlgoEngine preSelect: No active clients with connected Kite session.');
      return;
    }

    // Filter to specific strategy if requested
    const filteredGroups = strategyId
      ? strategyGroups.filter(g => g.strategyId === strategyId)
      : strategyGroups;

    for (const { strategyId: sId, strategyName, configJson, assignedClients: strategyClients } of filteredGroups) {
      const strategy = { id: sId, name: strategyName };
      let config: any = configJson;
      if (!config) { console.warn(`AlgoEngine preSelect: Invalid configJson for strategy ${strategyName}. Skipping.`); continue; }

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

      let matchingStocks = preOpenStocks.filter((stock: StockQuote) => {
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

      const explicitType = config.basicInfo?.stockSelectionType;
      const isShortTrade = explicitType
        ? explicitType.includes('Gapdown') || explicitType.includes('Losers')
        : ((config.legs || []).some((l: any) => ['Short', 'Sell'].includes(l.tradeAction?.action)) || strategy.name.toLowerCase().includes('gapdown') || strategy.name.toLowerCase().includes('short'));

      const getPreOpenPct = (s: any) => s.preOpenChangePercent !== undefined ? s.preOpenChangePercent : (s.prevClose ? ((s.iep - s.prevClose) / s.prevClose) * 100 : s.changePercent);
      const sortedStocks = [...matchingStocks].sort((a, b) =>
        isShortTrade ? getPreOpenPct(a) - getPreOpenPct(b) : getPreOpenPct(b) - getPreOpenPct(a)
      );

      if (sortedStocks.length < selectPosition) {
        console.log(`AlgoEngine preSelect: Only ${sortedStocks.length} stocks, cannot pick #${selectPosition} for strategy ${strategy.name}.`);
        continue;
      }

      const selected = sortedStocks[selectPosition - 1];
      this.engine.preselectedStockByStrategy.set(strategy.id, selected);
      try {
        await prisma.strategyPreselect.upsert({
          where: { strategyId: strategy.id },
          update: { symbol: selected.symbol, stockData: JSON.stringify(selected) },
          create: { strategyId: strategy.id, symbol: selected.symbol, stockData: JSON.stringify(selected) }
        });
      } catch (e) {
        console.error(`AlgoEngine preSelect: Failed to persist preselected stock for strategy ${strategy.id}:`, e);
      }
      this.engine.wsLive.subscribeSymbols([selected.symbol]);
      console.log(`AlgoEngine preSelect: Strategy "${strategy.name}" → #${selectPosition} ${selected.symbol}(${selected.changePercent}%)`);
    }

    if (strategyId) {
      const selected = this.engine.preselectedStockByStrategy.get(strategyId);
      if (selected) {
        console.log(`AlgoEngine preSelect: Clients of strategy "${strategyId}" will trade ${selected.symbol}.`);
      }
    } else {
      console.log(`AlgoEngine preSelect: ${this.engine.preselectedStockByStrategy.size} strategies have preselected stocks.`);
    }

    const allClients = strategyGroups.flatMap(g => g.assignedClients);
    const PRE_SELECT_CONCURRENCY = 15;
    await concurrentMap(allClients, async (client: any) => {
      if (client.zerodhaApiKey && client.accessToken) {
        try {
          const marginRes = await KiteClient.getMargins(client.zerodhaApiKey, client.accessToken);
          if (marginRes?.status === 'success' && marginRes.data?.equity?.net !== undefined) {
            this.engine.marginCache.set(client.id, Number(marginRes.data.equity.net));
          }
        } catch { }
      }
    }, PRE_SELECT_CONCURRENCY);

    console.log(`AlgoEngine preSelect: Margins cached for ${this.engine.marginCache.size}/${allClients.length} clients.`);
  }

  async executePreOpenTrades(adminId: string, mockStocks?: StockQuote[], strategyId?: string, legIndex?: number, dualLegGroupId?: string | null): Promise<void> {
    console.log('AlgoEngine: executePreOpenTrades started.');
    try {
      const preOpenStocks = mockStocks && mockStocks.length > 0
        ? mockStocks
        : await this.engine.getPreOpenStocks();

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

      // Fetch eligible clients grouped per strategy (6 conditions via clientSelector)
      const strategyGroups = await fetchClientsByStrategy(false);

      // Flatten to client list (filter by strategyId if provided)
      const filteredGroups = strategyId
        ? strategyGroups.filter(g => g.strategyId === strategyId)
        : strategyGroups;

      const clients = filteredGroups.flatMap(g => g.assignedClients);

      if (clients.length === 0) {
        console.log('AlgoEngine: No active clients found.');
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

          const enabledLegs = (config.legs || []).filter((l: any) => l.enabled);
          const finalDualLegGroupId = dualLegGroupId || (enabledLegs.length > 1 ? `oco_${client.id}_${strategy.id}_${todayStart.toISOString().split('T')[0]}` : null);

          if (!config.basicInfo?.exchange || !config.basicInfo?.tradeType || !config.basicInfo?.preSelectTime) {
            console.log(`AlgoEngine: Strategy config missing exchange/tradeType/preSelectTime for client ${client.user.name}. Skipping.`);
            return;
          }
          const exchangeParam = config.basicInfo.exchange;
          const tradeType = config.basicInfo.tradeType;
          const productParam = tradeType === 'Delivery' ? 'CNC' : (tradeType === 'Carry Forward' || tradeType === 'Normal' || tradeType === 'NRML') ? 'NRML' : 'MIS';

          let candidateStock: StockQuote | null = null;
          try {
            const dbRecord = await prisma.strategyPreselect.findUnique({ where: { strategyId: strategy.id } });
            if (dbRecord) {
              candidateStock = JSON.parse(dbRecord.stockData);
            }
          } catch (e) {
            console.error(`AlgoEngine: Failed to fetch preselected stock from DB for strategy ${strategy.id}:`, e);
          }

          if (!candidateStock) {
            candidateStock = this.engine.preselectedStockByStrategy.get(strategy.id) || null;
          }

          if (!candidateStock) {
            if (!config.basicInfo?.segment || !config.basicInfo?.selectPosition) {
              console.log(`AlgoEngine: Strategy config missing required fields (segment/selectPosition) for fallback filter for client ${client.user.name}. Skipping.`);
              return;
            }
            const segment = config.basicInfo.segment;
            const selectPosition = config.basicInfo.selectPosition;
            let matchingStocks = preOpenStocks.filter((stock: StockQuote) => {
              if (segment === 'NSE F&O' || segment === 'Futures' || segment === 'Options') {
                if (!stock.isFo) return false;
              } else if (segment === 'Nifty 50' || segment === 'Nifty') {
                if (!stock.isNifty50) return false;
              } else if (segment === 'Bank Nifty' || segment === 'BankNifty') {
                if (!stock.isBankNifty) return false;
              }
              return true;
            });

            const getPreOpenPct = (s: any) => s.preOpenChangePercent !== undefined ? s.preOpenChangePercent : (s.prevClose ? ((s.iep - s.prevClose) / s.prevClose) * 100 : s.changePercent);
            const sortedStocks = [...matchingStocks].sort((a, b) =>
              isShortTrade ? getPreOpenPct(a) - getPreOpenPct(b) : getPreOpenPct(b) - getPreOpenPct(a)
            );

            if (sortedStocks.length < selectPosition) {
              console.log(`AlgoEngine: Only ${sortedStocks.length} stocks available, cannot pick position #${selectPosition} for client ${client.user.name}. Skipping.`);
              return;
            }

            candidateStock = sortedStocks[selectPosition - 1];
          }

          const cs = candidateStock!;
          console.log(`AlgoEngine: Client ${client.user.name} | Stock ${cs.symbol}(${cs.changePercent}%)`);

          let targetStock: StockQuote | null = null;
          let breakoutEntryPrice = 0;

          const currentLegIdx = legIndex || 0;
          lockKey = `${client.id}:${cs.symbol}:leg${currentLegIdx}`;
          if (this.engine.entryLock.has(lockKey)) {
            console.log(`AlgoEngine: Entry already in progress for ${cs.symbol} Leg ${currentLegIdx + 1} (${client.user.name}). Skipping.`);
            return;
          }
          this.engine.entryLock.add(lockKey);

          const todayStr = todayStart.toISOString().split('T')[0];
          dbLockKey = `trade_lock_${client.id}_${strategy.id}_leg${currentLegIdx}_${todayStr}`;
          try {
            await prisma.appSettings.create({
              data: { settingKey: dbLockKey, settingValue: 'locked', type: 'lock' }
            });
          } catch (e) {
            console.log(`AlgoEngine DB Lock: Trade already processing for ${client.user.name} Leg ${currentLegIdx + 1}. Skipping duplicate execution.`);
            this.engine.entryLock.delete(lockKey);
            return;
          }

          try {
            const existingTrade = await prisma.trade.findFirst({
              where: {
                clientId: client.id,
                strategyId: strategy.id,
                legName: currentLeg.name,
                createdAt: { gte: todayStart },
                entryOrderStatus: { notIn: ['FAILED', 'REJECTED', 'cancelled'] }
              }
            });
            if (existingTrade) {
              console.log(`AlgoEngine: Valid active/completed trade already exists today for strategy leg "${currentLeg.name}" (${client.user.name}) — symbol: ${existingTrade.symbol}. Skipping duplicate.`);
              return;
            }

            if (finalDualLegGroupId) {
              const existingOcoFilled = await prisma.trade.findFirst({
                where: {
                  clientId: client.id,
                  strategyId: strategy.id,
                  dualLegGroupId: finalDualLegGroupId,
                  entryOrderStatus: { in: ['filled', 'COMPLETE'] },
                  createdAt: { gte: todayStart }
                }
              });
              if (existingOcoFilled) {
                console.log(`AlgoEngine: OCO Group ${finalDualLegGroupId} already has a filled leg (${existingOcoFilled.legName}). Skipping Leg ${currentLegIdx + 1} (${currentLeg.name}).`);
                return;
              }
            }

            if (cs && config.conditions?.length > 0) {
              if (!await this.engine.matchesConditions(cs, config.conditions, client)) {
                const reason = `Preselected stock ${cs.symbol} (${cs.changePercent.toFixed(2)}%) failed strategy conditions`;
                console.log(`AlgoEngine: ${reason} for ${client.user.name}. Logging FAILED trade.`);
                await logFailedTrade(client, strategy, cs.symbol, productParam, 0, reason, { direction, legName: currentLeg.name, legTimeframe, dualLegGroupId: finalDualLegGroupId });
                return;
              }
            }

            let candlePrice = candlePriceCache.get(cs.symbol) || 0;
            const masterClientData = await getMasterClient();
            const marketApiKey = masterClientData?.zerodhaApiKey || client.zerodhaApiKey;
            const marketAccessToken = masterClientData?.accessToken || client.accessToken;

            if (candlePrice === 0 && marketApiKey && marketAccessToken) {
              const instTokenStr = Object.entries(this.engine.wsLive.instrumentToSymbol).find(([, sym]) => sym === cs.symbol)?.[0];
              if (instTokenStr) {
                try {
                  const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
                  const from = todayIST;
                  const to = todayIST;

                  console.log(`AlgoEngine: Fetching historical data for ${cs.symbol} token=${instTokenStr} from=${from} to=${to}`);
                  const kiteInterval = mapTimeframeToKiteInterval(legTimeframe);
                  const res = await KiteClient.getHistoricalData(marketApiKey, marketAccessToken, instTokenStr, kiteInterval, from, to);
                  console.log(`AlgoEngine: Historical response for ${cs.symbol}: status=${res.status}, candles=${res.data?.candles?.length ?? 0}`);
                  if (res.status === 'success' && Array.isArray(res.data?.candles) && res.data.candles.length > 0) {
                    const priceIdx: Record<string, number> = { open: 1, high: 2, low: 3, close: 4 };
                    candlePrice = Number(res.data.candles[0][priceIdx[legCandleType]]);
                    candlePriceCache.set(cs.symbol, candlePrice);
                    console.log(`AlgoEngine: Candle price for ${cs.symbol} (${legCandleType}): ${candlePrice}`);
                  } else {
                    console.warn(`AlgoEngine: No candle data for ${cs.symbol} - status: ${res.status}, error: ${res.message ?? 'none'}`);
                  }
                } catch (histErr) {
                  console.error(`AlgoEngine: Historical data fetch failed for ${cs.symbol}:`, histErr);
                }
              } else {
                console.warn(`AlgoEngine: Instrument token not found for ${cs.symbol}`);
              }
            } else if (candlePrice > 0) {
              console.log(`AlgoEngine: Using cached candle price for ${cs.symbol}: ${candlePrice}`);
            }

            if (candlePrice === 0) {
              const reason = `Candle data not fetched for ${cs.symbol}`;
              console.log(`AlgoEngine: ${reason}. Logging FAILED trade for ${client.user.name}.`);
              await logFailedTrade(client, strategy, cs.symbol, productParam, 0, reason, { direction, legName: currentLeg.name, legTimeframe, dualLegGroupId: finalDualLegGroupId });
              return;
            }

            const bufferPct = legBufferPct;
            if (bufferPct === undefined || bufferPct === null || bufferPct === -1) {
              breakoutEntryPrice = candlePrice;
            } else if (isShortTrade) {
              breakoutEntryPrice = candlePrice * (1 - bufferPct / 100);
            } else {
              breakoutEntryPrice = candlePrice * (1 + bufferPct / 100);
            }

            const currentLtp = cs.ltp || cs.iep || breakoutEntryPrice;
            const hasPriceAction = config.conditions?.some((c: any) => c.indicator === 'Price Action');

            if (legOrderType === 'SL-Market' || !hasPriceAction || (isShortTrade ? currentLtp <= breakoutEntryPrice : currentLtp >= breakoutEntryPrice)) {
              targetStock = cs;
              console.log(`AlgoEngine: ${isShortTrade ? 'Breakdown' : 'Breakout'} confirmed for ${cs.symbol} (${direction}) | Entry: ${breakoutEntryPrice} | LTP: ${currentLtp} | CandlePriceType: ${legCandleType}`);
            } else {
              console.log(`AlgoEngine: ${isShortTrade ? 'Breakdown' : 'Breakout'} not met for ${cs.symbol} (${direction}) | Entry: ${breakoutEntryPrice} | LTP: ${currentLtp}. Skipping.`);
            }
          } catch (checkErr) {
            console.error(`AlgoEngine: Error checking breakout for ${cs.symbol}:`, checkErr);
          }

          if (!targetStock) {
            const reason = `Breakout not met: LTP ${cs.ltp || cs.iep} < breakout entry ${breakoutEntryPrice}`;
            console.log(`AlgoEngine: ${reason} for ${client.user.name}. Logging FAILED trade.`);
            await logFailedTrade(client, strategy, cs.symbol, productParam, breakoutEntryPrice, reason, { direction, legName: currentLeg.name, legTimeframe, dualLegGroupId: finalDualLegGroupId });
            return;
          }

          const entryPrice = breakoutEntryPrice;

          if (!config?.stoploss?.fixedPercent) {
            const reason = `stoploss.fixedPercent not configured for strategy "${strategy.name}"`;
            console.log(`AlgoEngine: ${reason}. Logging FAILED trade for ${client.user.name}.`);
            await logFailedTrade(client, strategy, cs.symbol, productParam, entryPrice, reason, { direction, legName: currentLeg.name, legTimeframe, dualLegGroupId: finalDualLegGroupId });
            return;
          }
          if (!config?.target?.profitPercent) {
            const reason = `target.profitPercent not configured for strategy "${strategy.name}"`;
            console.log(`AlgoEngine: ${reason}. Logging FAILED trade for ${client.user.name}.`);
            await logFailedTrade(client, strategy, cs.symbol, productParam, entryPrice, reason, { direction, legName: currentLeg.name, legTimeframe, dualLegGroupId: finalDualLegGroupId });
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
          if (process.env.KITE_AUTO_LOGIN_ENABLED === 'true' && client.productTypeId) {
            if (this.engine.todayTokenRefreshed.has(client.id) && activeAccessToken) {
              console.log(`AlgoEngine: Client ${client.user.name} already refreshed today, using existing token.`);
            } else if (client.zerodhaPassword && client.zerodhaTotpSecret) {
              console.log(`AlgoEngine: Auto-login is enabled. Refreshing session dynamically for client: ${client.user.name}`);
              const autoLoginRes = await performKiteAutoLogin(client.id);
              if (autoLoginRes.success && autoLoginRes.accessToken) {
                activeAccessToken = autoLoginRes.accessToken;
                this.engine.todayTokenRefreshed.add(client.id);
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

          const marginCalc = await calculateClientCapitalAndRisk({
            client,
            activeAccessToken,
            cachedMargin: this.engine.marginCache.get(client.id),
            onCacheMargin: (clientId, margin) => this.engine.marginCache.set(clientId, margin),
            config
          });

          if (!marginCalc.success) {
            const errMsg = marginCalc.skipReason || 'Margin validation failed';
            if (errMsg.startsWith('Skipped: Insufficient Live Margin')) {
              console.warn(`AlgoEngine: ${errMsg} for client ${client.user?.name || client.id}. Skipping trade.`);
              await logFailedTrade(
                client,
                strategy,
                targetStock.symbol,
                productParam,
                entryPrice,
                errMsg,
                { direction, legName: currentLeg.name, legTimeframe, dualLegGroupId: finalDualLegGroupId }
              );
            } else {
              console.log(`AlgoEngine: ${errMsg} Skipping trade for ${client.user.name}.`);
            }
            return;
          }

          const { marginOrApi, clientCapital, capitalAtRisk, riskPercent, marginRate } = marginCalc;

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

            await logFailedTrade(
              client,
              strategy,
              targetStock.symbol,
              productParam,
              entryPrice,
              errMsg,
              { direction, legName: currentLeg.name, legTimeframe, dualLegGroupId: finalDualLegGroupId }
            );
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

          const marketProtectionVal = (currentLeg.tradeAction?.marketProtection !== undefined && Number(currentLeg.tradeAction.marketProtection) >= 0)
            ? Number(currentLeg.tradeAction.marketProtection)
            : 0.05;

          let calculatedBufferedEntry = entryPrice;
          if (legBufferPct !== undefined && legBufferPct !== null && legBufferPct !== -1 && legBufferPct > 0) {
            calculatedBufferedEntry = isShortTrade
              ? entryPrice * (1 - legBufferPct / 100)
              : entryPrice * (1 + legBufferPct / 100);
          }

          let adjustedEntryPrice = calculatedBufferedEntry;
          const freshLimits = await this.engine.getFreshCircuitLimits(client, exchangeParam, targetStock.symbol, activeAccessToken);
          if (freshLimits) {
            const { upper, lower } = freshLimits;
            if (upper > 0 && lower > 0) {
              if (calculatedBufferedEntry >= upper || calculatedBufferedEntry <= lower) {
                const circuitType = calculatedBufferedEntry >= upper ? 'Upper Circuit' : 'Lower Circuit';
                const reason = `Entry skipped: Stock ${targetStock.symbol} hit ${circuitType} (Entry: ₹${calculatedBufferedEntry.toFixed(2)}, Circuit Range: ${lower} - ${upper})`;
                console.log(`AlgoEngine: ${reason} for ${client.user.name}. Skipping trade.`);
                await logFailedTrade(client, strategy, targetStock.symbol, productParam, calculatedBufferedEntry, reason, { direction, legName: currentLeg.name, legTimeframe, dualLegGroupId: finalDualLegGroupId });
                return;
              } else {
                console.log(`AlgoEngine: Buffered entry price (₹${calculatedBufferedEntry.toFixed(2)}) is within Circuit Limits (${lower} - ${upper}).`);
              }
            }
          }

          if (client.zerodhaApiKey && activeAccessToken) {
            adjustedEntryPrice = await getTickSizeAndRound(client.zerodhaApiKey, activeAccessToken, exchangeParam, targetStock.symbol, adjustedEntryPrice);
          }

          let stopLoss = isShortTrade ? adjustedEntryPrice + slPoints : adjustedEntryPrice - slPoints;

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

          if (freshLimits) {
            const { upper, lower } = freshLimits;
            if (upper > 0 && lower > 0) {
              if (stopLoss < lower) {
                console.log(`AlgoEngine: Stop Loss (₹${stopLoss.toFixed(2)}) fell below Lower Circuit (₹${lower}). Capping SL to Lower Circuit.`);
                stopLoss = lower;
              } else if (stopLoss > upper) {
                console.log(`AlgoEngine: Stop Loss (₹${stopLoss.toFixed(2)}) exceeded Upper Circuit (₹${upper}). Capping SL to Upper Circuit.`);
                stopLoss = upper;
              }

              if (target < lower) {
                console.log(`AlgoEngine: Target (₹${target.toFixed(2)}) fell below Lower Circuit (₹${lower}). Capping Target to Lower Circuit.`);
                target = lower;
              } else if (target > upper) {
                console.log(`AlgoEngine: Target (₹${target.toFixed(2)}) exceeded Upper Circuit (₹${upper}). Capping Target to Upper Circuit.`);
                target = upper;
              }
            }
          }

          const rawEntryPrice = entryPrice;
          const rawStopLoss = isShortTrade ? rawEntryPrice + slPoints : rawEntryPrice - slPoints;
          const rawTarget = targetType === 'Risk Reward Ratio'
            ? (isShortTrade ? rawEntryPrice - (slPoints * config.target.riskRewardRatio) : rawEntryPrice + (slPoints * config.target.riskRewardRatio))
            : (isShortTrade ? rawEntryPrice * (1 - targetPercent / 100) : rawEntryPrice * (1 + targetPercent / 100));

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
            priceParam = finalEntryPrice;
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

              orderRes = await KiteClient.placeOrder(client.zerodhaApiKey, activeAccessToken, orderParams, (client.proxyUrl || client.dedicatedIp));

              if (orderRes && orderRes.status === 'error' &&
                (orderRes.message?.includes('Trigger price') ||
                  orderRes.message?.includes('stoploss') ||
                  orderRes.message?.includes('lower than') ||
                  orderRes.message?.includes('higher than'))) {
                console.log(`AlgoEngine: Trigger price already crossed for ${targetStock.symbol}. Retrying entry order as MARKET order.`);
                const fallbackParams = {
                  ...orderParams,
                  order_type: 'MARKET' as const,
                  price: undefined,
                  trigger_price: undefined,
                  ...(orderTypeParam === 'MARKET' || orderTypeParam === 'SL-M' ? { market_protection: marketProtectionVal } : {})
                };
                orderRes = await KiteClient.placeOrder(client.zerodhaApiKey, activeAccessToken, fallbackParams, (client.proxyUrl || client.dedicatedIp));
              }

              if (orderRes && orderRes.status === 'error' &&
                (orderRes.message?.includes('After Market Order') ||
                  orderRes.message?.includes('AMO') ||
                  orderRes.message?.includes('closed') ||
                  orderRes.message?.includes('variety'))) {
                console.log(`AlgoEngine: Retrying order as AMO (After Market Order) because market is closed.`);
                orderRes = await KiteClient.placeOrder(client.zerodhaApiKey, activeAccessToken, { ...orderParams, variety: 'amo' }, (client.proxyUrl || client.dedicatedIp));
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
          let targetOrderStatusVal: string | null = null;

          let entryFilled = false;
          let latestOrderStatus = 'OPEN';

          if (orderId && client.zerodhaApiKey && activeAccessToken) {
            const maxPolls = 30;
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

                  if (finalDualLegGroupId && client.zerodhaApiKey && activeAccessToken) {
                    try {
                      const otherLegTrades = await prisma.trade.findMany({
                        where: {
                          clientId: client.id,
                          strategyId: strategy.id,
                          dualLegGroupId: finalDualLegGroupId,
                          id: tradeId ? { not: tradeId } : undefined,
                          entryOrderId: { not: null },
                          entryOrderStatus: { in: ['open', 'submitted', 'trigger pending', 'OPEN', 'TRIGGER PENDING', 'PUT ORDER REQ RECEIVED'] }
                        }
                      });

                      for (const otherTrade of otherLegTrades) {
                        if (otherTrade.entryOrderId) {
                          console.log(`AlgoEngine OCO: Cancelling pending opposite leg order ${otherTrade.entryOrderId} (${otherTrade.legName}) in Zerodha...`);
                          try {
                            await KiteClient.cancelOrder(client.zerodhaApiKey, activeAccessToken, otherTrade.entryOrderId);
                            await prisma.trade.update({
                              where: { id: otherTrade.id },
                              data: { entryOrderStatus: 'CANCELLED', status: 'CANCELLED' }
                            });
                          } catch (cErr) {
                            console.warn(`AlgoEngine OCO: Error cancelling pending order ${otherTrade.entryOrderId} in Zerodha:`, cErr);
                          }
                        }
                      }
                    } catch (ocoCancelErr) {
                      console.error(`AlgoEngine OCO: Error searching/cancelling opposite leg orders:`, ocoCancelErr);
                    }
                  }

                  if (client.zerodhaApiKey && activeAccessToken) {
                    const freshLimitsSLT = await this.engine.getFreshCircuitLimits(client, exchangeParam, targetStock.symbol, activeAccessToken);
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
                        } else {
                          if (finalStopLoss > upper) {
                            finalStopLoss = upper - 0.05;
                            console.log(`AlgoEngine: Adjusted SL to Upper Circuit - 0.05 for ${targetStock.symbol} SHORT: ₹${finalStopLoss}`);
                          }
                          if (finalTarget < lower) {
                            finalTarget = lower;
                            console.log(`AlgoEngine: Adjusted Target to Lower Circuit for ${targetStock.symbol} SHORT: ₹${finalTarget}`);
                          }
                        }
                        finalStopLoss = await getTickSizeAndRound(client.zerodhaApiKey, activeAccessToken, exchangeParam, targetStock.symbol, finalStopLoss);
                        finalTarget = await getTickSizeAndRound(client.zerodhaApiKey, activeAccessToken, exchangeParam, targetStock.symbol, finalTarget);
                      }
                    }

                    console.log(`AlgoEngine OCO: Waiting 10 seconds after opposite leg cancellation before placing Stop-Loss order for ${client.user.name}...`);
                    await new Promise(resolve => setTimeout(resolve, 10000));

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
                    for (let slAttempt = 1; slAttempt <= 3; slAttempt++) {
                      try {
                        const slRes = await KiteClient.placeOrder(client.zerodhaApiKey, activeAccessToken, slParams, (client.proxyUrl || client.dedicatedIp));
                        if (slRes?.status === 'success' && slRes.data?.order_id) {
                          slOrderId = slRes.data.order_id;
                          console.log(`AlgoEngine: SL-M order placed: ${slOrderId} for ${targetStock.symbol} @ trigger ₹${finalStopLoss} (attempt ${slAttempt})`);
                          break;
                        } else {
                          console.warn(`AlgoEngine: SL-M order failed (attempt ${slAttempt}/3): ${slRes?.message || 'unknown'}`);
                          if (slAttempt < 3) await new Promise(r => setTimeout(r, 1000));
                        }
                      } catch (slErr) {
                        console.error(`AlgoEngine: Error placing SL-M order (attempt ${slAttempt}/3):`, slErr);
                        if (slAttempt < 3) await new Promise(r => setTimeout(r, 1000));
                      }
                    }

                    console.log(`AlgoEngine OCO: Waiting 5 seconds after Stop-Loss order before placing Target order for ${client.user.name}...`);
                    await new Promise(resolve => setTimeout(resolve, 5000));

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

                    for (let tgtAttempt = 1; tgtAttempt <= 3; tgtAttempt++) {
                      try {
                        const targetRes = await KiteClient.placeOrder(client.zerodhaApiKey, activeAccessToken, targetParams, (client.proxyUrl || client.dedicatedIp));
                        if (targetRes?.status === 'success' && targetRes.data?.order_id) {
                          targetOrderId = targetRes.data.order_id;
                          targetOrderStatusVal = 'OPEN';
                          console.log(`AlgoEngine: Target LIMIT order placed on Zerodha: ${targetOrderId} for ${targetStock.symbol} @ ₹${finalTarget} (attempt ${tgtAttempt})`);
                          break;
                        } else {
                          const errMsg = targetRes?.message || 'unknown';
                          console.warn(`AlgoEngine: Target LIMIT order failed/rejected on Zerodha (attempt ${tgtAttempt}/3): ${errMsg}`);
                          if (tgtAttempt === 3) {
                            targetOrderStatusVal = 'VIRTUAL_PENDING';
                            console.warn(`AlgoEngine: All 3 Target LIMIT order attempts failed/rejected on Zerodha for ${client.user.name}. Transitioned to VIRTUAL target monitoring.`);
                          } else {
                            await new Promise(r => setTimeout(r, 1000));
                          }
                        }
                      } catch (tgtErr: any) {
                        console.error(`AlgoEngine: Error placing Target LIMIT order (attempt ${tgtAttempt}/3):`, tgtErr);
                        if (tgtAttempt === 3) {
                          targetOrderStatusVal = 'VIRTUAL_PENDING';
                        } else {
                          await new Promise(r => setTimeout(r, 1000));
                        }
                      }
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
                targetOrderStatus: targetOrderStatusVal || (targetOrderId ? 'OPEN' : null),
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
                targetOrderStatus: targetOrderStatusVal || (targetOrderId ? 'OPEN' : null),
                slTriggerPrice: finalStopLoss,
                kiteResponse: orderRes,
                direction, legName: currentLeg.name, legTimeframe, dualLegGroupId: finalDualLegGroupId
              }
            });
          }
          this.engine.wsLive.subscribeSymbols([targetStock.symbol]);

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
          this.engine.entryLock.delete(lockKey);
        }
      };

      console.log(`AlgoEngine: Processing ${clients.length} clients with concurrency ${BATCH_SIZE}...`);
      await concurrentMap(clients, client => processClientEntry(client), BATCH_SIZE);

    } catch (e: any) {
      console.error('AlgoEngine: executePreOpenTrades error:', e);
    }
  }
}
