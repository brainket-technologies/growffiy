import { prisma } from '../../../../database/db';
import { KiteClient } from '../../../services/kite';
import { calculateClientCapitalAndRisk } from '../../../utils/marginHelper';
import { logSystemEvent } from '../../../services/auditLogger';
import { API_ENDPOINTS } from '../../../../core/constants';
import { concurrentMap } from '../../../../core/helpers';
import { getTickSizeAndRound } from '../../../utils/tickSizeUtil';
import { getLatestOrderState } from '../../../utils/kiteHelper';
import { performKiteAutoLogin } from '../../../services/kiteAutoLogin';
import { StockQuote, getPreOpenStocks } from '../../../utils/preOpenFetcher';
import { matchesConditions } from '../../../utils/conditionEvaluator';
import { getFreshCircuitLimits } from '../../../utils/circuitLimitHelper';
import { fetchClientsByStrategy } from '../clientSelector';
import { getMasterClient } from '../../../utils/masterClient';
import { logFailedTrade } from '../../../utils/tradeLogger';

function mapTimeframeToKiteInterval(tf: string): string {
  if (!tf) return '15minute';
  const map: Record<string, string> = {
    '1m': 'minute', '3m': '3minute', '5m': '5minute', '10m': '10minute',
    '15m': '15minute', '30m': '30minute', '60m': '60minute', '1h': '60minute', '1d': 'day'
  };
  return map[tf.toLowerCase()] || '15minute';
}

export class TenAmStrategy {
  private engine: any;

  constructor(engine: any) {
    this.engine = engine;
  }

  async preSelectAllClients(strategyId?: string): Promise<void> {
    if (strategyId) {
      this.engine.preselectedStockByStrategy.delete(strategyId);
      try { await prisma.strategyPreselect.deleteMany({ where: { strategyId } }); } catch (e) { }
    } else {
      this.engine.preselectedStockByStrategy.clear();
      this.engine.marginCache.clear();
      try { await prisma.strategyPreselect.deleteMany(); } catch (e) { }
    }

    const dateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const mwSnapshot = await prisma.marketWatchSnapshot.findUnique({
      where: { indexName_date_timeSlot: { indexName: 'NIFTY 500', date: dateStr, timeSlot: '09:30' } }
    });

    if (!mwSnapshot || !mwSnapshot.data) return;
    const nseData = mwSnapshot.data as any[];
    if (!Array.isArray(nseData) || nseData.length === 0) return;

    const sortedStocks = [...nseData].sort((a, b) => (b.pChange || 0) - (a.pChange || 0));
    const topGainers = sortedStocks.slice(0, 20);
    const topLosers = sortedStocks.slice(-20).reverse();

    const preOpenStocks: StockQuote[] = [...topGainers, ...topLosers].map(s => ({
      symbol: s.symbol, name: s.companyName || s.symbol, ltp: s.lastPrice || 0,
      open: s.open || 0, high: s.dayHigh || 0, low: s.dayLow || 0,
      prevClose: s.previousClose || 0, volume: s.totalTradedVolume || 0,
      change: s.change || 0, changePercent: s.pChange || 0, iep: s.lastPrice || 0,
      final: s.lastPrice || 0, finalQuantity: s.totalTradedVolume || 0, value: s.totalTradedValue || 0,
      ffmCap: 0, nm52wH: s.yearHigh || 0, nm52wL: s.yearLow || 0,
      isNifty50: false, isNifty500: true, isBankNifty: false, isFo: false
    }));

    const strategyGroups = await fetchClientsByStrategy(true);
    if (strategyGroups.length === 0) return;

    const filteredGroups = strategyId ? strategyGroups.filter(g => g.strategyId === strategyId) : strategyGroups;

    for (const { strategyId: sId, strategyName, configJson, assignedClients: strategyClients } of filteredGroups) {
      const strategy = { id: sId, name: strategyName };
      if (!configJson) continue;
      const config: any = configJson;

      const segment = config.basicInfo?.segment;
      if (!segment) continue;

      let matchingStocks = preOpenStocks.filter((stock) => {
        if (segment === 'NSE F&O' || segment === 'Futures' || segment === 'Options') return stock.isFo;
        if (segment === 'Nifty 50' || segment === 'Nifty') return stock.isNifty50;
        if (segment === 'Bank Nifty' || segment === 'BankNifty') return stock.isBankNifty;
        return true;
      });

      if (matchingStocks.length === 0) continue;
      
      const topCount = config.basicInfo?.topCount || 20;
      // Re-split gainers and losers from the matched set based on topCount
      const gainers = matchingStocks.filter(s => s.changePercent > 0).slice(0, topCount);
      const losers = matchingStocks.filter(s => s.changePercent < 0).reverse().slice(0, topCount);

      const finalStocks = [...gainers, ...losers];

      try {
        const preselectData = {
          strategyId: strategy.id,
          symbol: 'MULTIPLE',
          stockData: JSON.stringify(finalStocks)
        };
        await prisma.strategyPreselect.upsert({
          where: { strategyId: strategy.id },
          update: { stockData: preselectData.stockData, symbol: 'MULTIPLE' },
          create: preselectData
        });
        this.engine.preselectedStockByStrategy.set(strategy.id, finalStocks);
        console.log(`AlgoEngine preSelect: Saved ${finalStocks.length} pre-selected stocks for ${strategy.name}`);
      } catch (err) {
        console.error('AlgoEngine preSelect: Error saving to DB:', err);
      }
    }
  }

async executePreOpenTrades(adminId: string, mockStocks?: StockQuote[], strategyId?: string, legIndex?: number, dualLegGroupId?: string | null): Promise<void> {
    console.log('AlgoEngine: executePreOpenTrades (Ten AM) started.');

    // Helper delay (used for rate‑limit throttling)
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    // ---------------------------------------------------------------------
    // 1️⃣ Load 09:30 market‑watch snapshot (NIFTY 500) – source of top movers
    // ---------------------------------------------------------------------
    const dateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const mwSnapshot = await prisma.marketWatchSnapshot.findUnique({
      where: { indexName_date_timeSlot: { indexName: 'NIFTY 500', date: dateStr, timeSlot: '09:30' } }
    });
    if (!mwSnapshot || !mwSnapshot.data) {
      console.log('AlgoEngine TenAM: No 09:30 snapshot found.');
      return;
    }
    const nseData = mwSnapshot.data as any[];
    const sortedStocks = [...nseData].sort((a, b) => (b.pChange || 0) - (a.pChange || 0));

    // ---------------------------------------------------------------------
    // 2️⃣ Get Master Client – one token for all candle calls (avoids per‑client rate limits)
    // ---------------------------------------------------------------------
    const masterClient = await getMasterClient();
    if (!masterClient || !masterClient.accessToken) {
      console.error('AlgoEngine TenAM: No Master Client found. Cannot fetch candles.');
      return;
    }

    // ---------------------------------------------------------------------
    // 3️⃣ Load strategy groups (clients + config) and filter to Ten AM
    // ---------------------------------------------------------------------
    const strategyGroups = await fetchClientsByStrategy(true);
    const filteredGroups = strategyId ? strategyGroups.filter(g => g.strategyId === strategyId) : strategyGroups;

    for (const group of filteredGroups) {
      const engineType = group.configJson?.basicInfo?.engineType || '';
      if (engineType !== 'TEN_AM' && group.strategyName !== 'Ten AM Strategy' && group.configJson?.basicInfo?.name !== 'Ten AM Strategy') continue;
      const config: any = group.configJson;
      const topCount: number = config?.basicInfo?.topCount || 20;
      const selectPosition: number = config?.basicInfo?.selectPosition || 1; // e.g. 3rd matching stock
      const activeLegs = (config?.legs || []).filter((l: any) => l.enabled || l.isEnabled);
      if (activeLegs.length === 0) continue;

      // ---------------------------------------------------------------
      // 4️⃣ Lazy‑evaluation – find the selectPosition‑th matching Gainer & Loser
      // ---------------------------------------------------------------
      const gainers = sortedStocks.slice(0, topCount);
      const losers = sortedStocks.slice(-topCount).reverse();

      const findMatchingStock = async (list: any[], direction: 'buy' | 'sell', ohlcCondition: string = 'None') => {
        let matchesFound = 0;
        for (const stock of list) {
          if (config?.conditions && !(await matchesConditions(stock, config.conditions, this.engine.wsLive))) continue;

          // 4b️⃣ Fetch three 15‑minute candles (09:15, 09:30, 09:45) using Master token
          const from = dateStr + ' 09:15:00';
          const to = dateStr + ' 10:01:00'; // include the fully formed 09:45 candle which finishes at 10:00
          let liveToken = stock.instrumentToken;
          if (!liveToken && this.engine.wsLive?.instrumentToSymbol) {
            const instTokenStr = Object.entries(this.engine.wsLive.instrumentToSymbol).find(([, sym]) => sym === stock.symbol)?.[0];
            if (instTokenStr) liveToken = parseInt(instTokenStr, 10);
          }
          const candles = await KiteClient.getHistoricalData(
            masterClient.zerodhaApiKey,
            masterClient.accessToken,
            liveToken || stock.instrumentToken || stock.symbol,
            mapTimeframeToKiteInterval('15m'),
            from,
            to
          );
          // Respect Kite rate limit (≈3 req/sec) – small pause after each request
          await delay(350);
          if (!candles?.data?.candles?.length) continue;
          const hist = candles.data.candles as any[]; // [timestamp, open, high, low, close, volume]
          const pattern = hist.map(c => c[4] > c[1] ? 'G' : 'R'); // G = green, R = red
          const isGRG = direction === 'buy' && pattern[0] === 'G' && pattern[1] === 'R' && pattern[2] === 'G';
          const isRGR = direction === 'sell' && pattern[0] === 'R' && pattern[1] === 'G' && pattern[2] === 'R';
          let isMatch = ((direction === 'buy' && isGRG) || (direction === 'sell' && isRGR));

          if (isMatch && ohlcCondition !== 'None') {
            const firstCandle = hist[0];
            const open = firstCandle[1];
            const high = firstCandle[2];
            const low = firstCandle[3];
            const close = firstCandle[4];

            if (ohlcCondition === 'Open = High' && open !== high) isMatch = false;
            else if (ohlcCondition === 'Open = Low' && open !== low) isMatch = false;
            else if (ohlcCondition === 'Open = Close' && open !== close) isMatch = false;
            else if (ohlcCondition === 'High = Low' && high !== low) isMatch = false;
            else if (ohlcCondition === 'High = Close' && high !== close) isMatch = false;
            else if (ohlcCondition === 'Low = Close' && low !== close) isMatch = false;
          }

          if (isMatch) {
            matchesFound++;
            if (matchesFound === selectPosition) {
              stock.thirdCandleHigh = hist[2][2];
              stock.thirdCandleLow = hist[2][3];
              return stock;
            }
          }
        }
        // No matches found, do not trade
        return null;
      };

      const ohlcCond = config?.basicInfo?.ohlcCondition || 'None';
      const targetGainer = await findMatchingStock(gainers, 'buy', ohlcCond);
      const targetLoser = await findMatchingStock(losers, 'sell', ohlcCond);

      // ---------------------------------------------------------------
      // 5️⃣ Ultra‑fast concurrent processing of all clients (up to 500+)
      // ---------------------------------------------------------------
      await Promise.all(
        group.assignedClients.map(async (client) => {
          if (client.tradingStatus !== 'active' || !client.zerodhaApiKey || !client.accessToken) return;

          // ---- Risk Management (Max Open Positions, Daily Loss/Profit) ----
          const maxOpen = config?.riskManagement?.maxOpenPositions;
          if (maxOpen !== undefined && maxOpen !== null && maxOpen !== -1) {
            const openCount = await prisma.trade.count({
              where: { clientId: client.id, strategyId: group.strategyId, status: 'open' }
            });
            if (openCount >= maxOpen) {
              console.log(`AlgoEngine: Max open positions (${maxOpen}) reached for ${client.user?.name}. Skipping.`);
              return;
            }
          }

          const todayStartLocal = new Date();
          todayStartLocal.setHours(0, 0, 0, 0);
          const todayTrades = await prisma.trade.findMany({
            where: { clientId: client.id, strategyId: group.strategyId, createdAt: { gte: todayStartLocal }, pnl: { not: null } }
          });
          const todayPnl = todayTrades.reduce((sum, t) => sum + Number(t.pnl || 0), 0);
          
          const maxDailyLoss = config?.riskManagement?.maxDailyLoss;
          if (maxDailyLoss !== undefined && maxDailyLoss !== null && maxDailyLoss !== -1 && todayPnl <= -Number(maxDailyLoss)) {
            console.log(`AlgoEngine: Max daily loss (₹${maxDailyLoss}) reached for ${client.user?.name} (PnL: ₹${todayPnl}). Skipping.`);
            return;
          }
          
          const maxDailyProfit = config?.riskManagement?.maxDailyProfit;
          if (maxDailyProfit !== undefined && maxDailyProfit !== null && maxDailyProfit !== -1 && todayPnl >= Number(maxDailyProfit)) {
            console.log(`AlgoEngine: Max daily profit (₹${maxDailyProfit}) reached for ${client.user?.name} (PnL: ₹${todayPnl}). Skipping.`);
            return;
          }

          // ---- Margin & risk per leg ----
          const activeAccessToken = client.accessToken;
          const marginResult = await calculateClientCapitalAndRisk({
            client,
            activeAccessToken,
            onCacheMargin: (cId, margin) => this.engine.marginCache.set(cId, margin),
            config,
          });
          if (!marginResult.success) return;

          const legDivisor = activeLegs.length;
          const capitalAtRiskPerLeg = marginResult.capitalAtRisk / legDivisor;
          const buyingPowerPerLeg = marginResult.clientCapital / legDivisor;

          for (let li = 0; li < activeLegs.length; li++) {
            if (legIndex !== undefined && legIndex !== null && li !== legIndex) continue;
            const leg = activeLegs[li];
            
            const isBuy = leg.tradeAction?.action?.toLowerCase() === 'long' || leg.direction?.toLowerCase() === 'buy';
            const targetStock = isBuy ? targetGainer : targetLoser;
            
            if (!targetStock) {
              console.log(`AlgoEngine: No matching stock found for ${client.user?.name} Leg ${li + 1} (${isBuy ? 'buy' : 'sell'}). Skipping leg.`);
              continue;
            }

            // ---- DB Lock to Prevent Duplicates ----
            const todayStr = new Date().toISOString().split('T')[0];
            const dbLockKey = `trade_lock_${client.id}_${group.strategyId}_leg${li}_${todayStr}`;
            try {
              await prisma.appSettings.create({
                data: { settingKey: dbLockKey, settingValue: 'locked', type: 'lock' }
              });
            } catch (e) {
              console.log(`AlgoEngine DB Lock: Trade already processing for ${client.user?.name} Leg ${li + 1}. Skipping duplicate execution.`);
              continue;
            }

            // ---- Price calculations ----
            const entryBufferPct = leg.tradeAction?.entryBufferPercent !== undefined ? leg.tradeAction.entryBufferPercent : (leg.tradeAction?.bufferPercent || 0.1);
            const slBufferPct = leg.tradeAction?.slBufferPercent !== undefined ? leg.tradeAction.slBufferPercent : (leg.tradeAction?.bufferPercent || 0.1);
            
            const thirdCandleHigh = targetStock.thirdCandleHigh || targetStock.high;
            const thirdCandleLow = targetStock.thirdCandleLow || targetStock.low;
            
            const baseEntry = isBuy ? thirdCandleHigh : thirdCandleLow;
            const entryBufferVal = baseEntry * (entryBufferPct / 100);
            const entryPriceRaw = isBuy ? baseEntry + entryBufferVal : baseEntry - entryBufferVal;
            
            const baseSl = isBuy ? thirdCandleLow : thirdCandleHigh;
            const slBufferVal = baseSl * (slBufferPct / 100);
            const slPriceRaw = isBuy ? baseSl - slBufferVal : baseSl + slBufferVal;

            // ---- Quantity (rounded to tick size, calculated by Risk / SL diff) ----
            let difference = Math.abs(entryPriceRaw - slPriceRaw);
            if (difference <= 0) difference = 1;
            const rawQty = Math.max(1, Math.floor(capitalAtRiskPerLeg / difference));
            const qty = rawQty;

            const rrRatio = config?.target?.riskRewardRatio || 2;
            const targetPriceRaw = isBuy ? entryPriceRaw + (difference * rrRatio) : entryPriceRaw - (difference * rrRatio);

            const entryPrice = await getTickSizeAndRound(client.zerodhaApiKey, activeAccessToken, 'NSE', targetStock.symbol, entryPriceRaw);
            let slPrice = await getTickSizeAndRound(client.zerodhaApiKey, activeAccessToken, 'NSE', targetStock.symbol, slPriceRaw);
            let targetPrice = await getTickSizeAndRound(client.zerodhaApiKey, activeAccessToken, 'NSE', targetStock.symbol, targetPriceRaw);

            // ---- Circuit limit safety ----
            console.log(`AlgoEngine: Fetching circuit limits for ${targetStock.symbol}...`);
            const freshLimits = await getFreshCircuitLimits(client, 'NSE', targetStock.symbol, activeAccessToken);
            console.log(`AlgoEngine: Fetched circuit limits for ${targetStock.symbol}:`, freshLimits);
            
            if (freshLimits) {
              const { lower, upper } = freshLimits;
              if (entryPrice <= lower || entryPrice >= upper) {
                console.log(`Entry skipped for ${client.user?.name}: ${targetStock.symbol} hits circuit limits.`);
                await logFailedTrade(client, { id: group.strategyId, name: group.strategyName }, targetStock.symbol, 'CNC', entryPrice, 'Circuit Hit', { direction: isBuy ? 'LONG' : 'SHORT', legName: leg.name || '', legTimeframe: '15m', dualLegGroupId: null, quantity: qty, stopLoss: slPrice, target: targetPrice, slTriggerPrice: slPrice });
                continue;
              }
            }

            const tradeType = config?.basicInfo?.tradeType || 'Intraday';
            const productParam = tradeType === 'Delivery' ? 'CNC' : (tradeType === 'Carry Forward' || tradeType === 'Normal' || tradeType === 'NRML') ? 'NRML' : 'MIS';

            // ---- Build Order Payload ----
            console.log(`AlgoEngine: Building order payload for ${targetStock.symbol}...`);
            
            const marketProtectionVal = (leg.tradeAction?.marketProtection !== undefined && Number(leg.tradeAction.marketProtection) >= 0)
              ? Number(leg.tradeAction.marketProtection)
              : 0.05; // Matches preOpenStrategy default

            // ---- Place SL‑Market entry order ----
            let entryOrderId: string | null = null;
            try {
              const orderTypeParam = leg.tradeAction?.orderType === 'SL-Market' ? 'SL-M' : (leg.tradeAction?.orderType || 'SL-M');
              const orderPayload: any = {
                tradingsymbol: targetStock.symbol,
                exchange: 'NSE',
                transaction_type: isBuy ? 'BUY' : 'SELL',
                quantity: qty,
                order_type: orderTypeParam,
                product: productParam,
                price: entryPrice,
                trigger_price: entryPrice,
                validity: 'DAY',
                variety: 'regular',
                tag: 'algo_tenam',
                ...(orderTypeParam === 'MARKET' || orderTypeParam === 'SL-M' ? { market_protection: marketProtectionVal } : {})
              };

              console.log(`AlgoEngine: Calling KiteClient.placeOrder for ${targetStock.symbol}...`);
              let orderRes = await KiteClient.placeOrder(client.zerodhaApiKey, activeAccessToken, orderPayload, (client.proxyUrl || client.dedicatedIp));
              console.log(`AlgoEngine: KiteClient.placeOrder returned for ${targetStock.symbol}:`, orderRes);
              
              if (orderRes && orderRes.status === 'error') {
                if (orderRes.message?.includes('Trigger price') || 
                    orderRes.message?.includes('circuit') ||
                    orderRes.message?.includes('stoploss') ||
                    orderRes.message?.includes('lower than') ||
                    orderRes.message?.includes('higher than')) {
                  console.log(`AlgoEngine: Retrying with MARKET order due to circuit/trigger issue for ${targetStock.symbol}...`);
                  const fallbackParams = {
                    ...orderPayload,
                    order_type: 'MARKET',
                    price: undefined,
                    trigger_price: undefined,
                    market_protection: marketProtectionVal
                  };
                  orderRes = await KiteClient.placeOrder(client.zerodhaApiKey, activeAccessToken, fallbackParams, (client.proxyUrl || client.dedicatedIp));
                }
                
                if (orderRes && orderRes.status === 'error') {
                  const errMsg = orderRes?.message || 'Kite API error';
                  console.warn(`AlgoEngine: Entry order failed for ${client.user?.name} – ${targetStock.symbol}:`, errMsg);
                  // Save full trade record like Pre-Open does (with qty/SL/target visible in UI)
                  await prisma.trade.create({
                    data: {
                      clientId: client.id, strategyId: group.strategyId,
                      symbol: targetStock.symbol, orderType: 'CNC',
                      entryPrice, quantity: qty,
                      stopLoss: slPrice, target: targetPrice,
                      slTriggerPrice: slPrice,
                      originalEntryPrice: entryPriceRaw,
                      originalStopLoss: slPriceRaw,
                      originalTarget: targetPriceRaw,
                      status: 'FAILED', entryTime: new Date(),
                      entryOrderStatus: 'FAILED',
                      kiteResponse: orderRes || { error: errMsg },
                      direction: isBuy ? 'LONG' : 'SHORT',
                      legName: leg.name || '',
                      legTimeframe: '15m'
                    }
                  });
                  await prisma.strategyLog.create({
                    data: { strategyId: group.strategyId, message: `Ten AM order failed for ${client.user?.name} (${targetStock.symbol}): ${errMsg}`, logType: 'error' }
                  });
                  continue;
                }
              }
              
              entryOrderId = orderRes?.data?.order_id;
              
              if (!entryOrderId) {
                console.warn(`AlgoEngine: Entry order no ID for ${client.user?.name} – ${targetStock.symbol}`);
                await prisma.trade.create({
                  data: {
                    clientId: client.id, strategyId: group.strategyId,
                    symbol: targetStock.symbol, orderType: 'CNC',
                    entryPrice, quantity: qty,
                    stopLoss: slPrice, target: targetPrice,
                    slTriggerPrice: slPrice,
                    originalEntryPrice: entryPriceRaw,
                    originalStopLoss: slPriceRaw,
                    originalTarget: targetPriceRaw,
                    status: 'FAILED', entryTime: new Date(),
                    entryOrderStatus: 'FAILED',
                    kiteResponse: orderRes || {},
                    direction: isBuy ? 'LONG' : 'SHORT',
                    legName: leg.name || '',
                    legTimeframe: '15m'
                  }
                });
                continue;
              }


              if (entryOrderId) {
                console.log(`Entry order placed ${entryOrderId} for ${client.user?.name} – ${targetStock.symbol}`);
                let tradeId = '';
                try {
                  const pendingTrade = await prisma.trade.create({
                    data: {
                      clientId: client.id,
                      strategyId: group.strategyId,
                      symbol: targetStock.symbol,
                      orderType: 'CNC',
                      entryPrice: entryPrice,
                      quantity: qty,
                      stopLoss: slPrice,
                      target: targetPrice,
                      originalEntryPrice: entryPriceRaw,
                      originalStopLoss: slPriceRaw,
                      originalTarget: targetPriceRaw,
                      status: 'pending',
                      entryTime: new Date(),
                      entryOrderId: entryOrderId,
                      entryOrderStatus: 'OPEN',
                      kiteResponse: orderRes || {},
                      direction: isBuy ? 'LONG' : 'SHORT',
                      legName: leg.name || '',
                      legTimeframe: '15m'
                    }
                  });
                  tradeId = pendingTrade.id;
                  console.log(`AlgoEngine: Pending trade saved for ${client.user?.name} - ${targetStock.symbol}`);
                } catch (pendingErr) {
                  console.error(`AlgoEngine: Failed to save pending trade for ${client.user?.name}:`, pendingErr);
                }

                // ---- Poll for entry fill (Pre-Open Style) ----
                let entryFilled = false;
                let latestOrderStatus = 'OPEN';
                let slOrderIdStr: string | null = null;
                let tgtOrderIdStr: string | null = null;
                let tgtOrderStatusVal: string | null = null;
                
                const maxPolls = 30;
                for (let attempt = 0; attempt < maxPolls; attempt++) {
                  await delay(2000);
                  try {
                    const statusRes = await KiteClient.getOrderById(client.zerodhaApiKey as string, activeAccessToken, entryOrderId as string, (client.proxyUrl || client.dedicatedIp));
                    const latest = getLatestOrderState(statusRes?.data);
                    if (latest?.status) {
                      latestOrderStatus = latest.status;
                    }
                    if (latest?.status?.toUpperCase() === 'COMPLETE') {
                      entryFilled = true;
                      console.log(`Entry order ${entryOrderId} COMPLETE for ${client.user?.name}`);
                      
                      // Circuit limit check before SL/Target
                      if (client.zerodhaApiKey && activeAccessToken) {
                        const freshLimitsSLT = await getFreshCircuitLimits(client, 'NSE', targetStock.symbol, activeAccessToken);
                        if (freshLimitsSLT) {
                          const { upper, lower } = freshLimitsSLT;
                          if (upper > 0 && lower > 0) {
                            if (isBuy) {
                              if (slPrice < lower) {
                                slPrice = lower + 0.05;
                                console.log(`AlgoEngine: Adjusted SL to Lower Circuit + 0.05 for ${targetStock.symbol} LONG: ₹${slPrice}`);
                              }
                              if (targetPrice > upper) {
                                targetPrice = upper;
                                console.log(`AlgoEngine: Adjusted Target to Upper Circuit for ${targetStock.symbol} LONG: ₹${targetPrice}`);
                              }
                            } else {
                              if (slPrice > upper) {
                                slPrice = upper - 0.05;
                                console.log(`AlgoEngine: Adjusted SL to Upper Circuit - 0.05 for ${targetStock.symbol} SHORT: ₹${slPrice}`);
                              }
                              if (targetPrice < lower) {
                                targetPrice = lower;
                                console.log(`AlgoEngine: Adjusted Target to Lower Circuit for ${targetStock.symbol} SHORT: ₹${targetPrice}`);
                              }
                            }
                            slPrice = await getTickSizeAndRound(client.zerodhaApiKey, activeAccessToken, 'NSE', targetStock.symbol, slPrice);
                            targetPrice = await getTickSizeAndRound(client.zerodhaApiKey, activeAccessToken, 'NSE', targetStock.symbol, targetPrice);
                          }
                        }
                      }

                      // Place SL immediately
                      for (let slAttempt = 1; slAttempt <= 3; slAttempt++) {
                        try {
                          const slPayload: any = {
                            tradingsymbol: targetStock.symbol,
                            exchange: 'NSE',
                            transaction_type: isBuy ? 'SELL' : 'BUY',
                            quantity: qty,
                            product: 'CNC',
                            order_type: 'SL-M',
                            price: slPrice,
                            trigger_price: slPrice,
                            validity: 'DAY',
                            variety: 'regular',
                            market_protection: marketProtectionVal
                          };
                          const slRes = await KiteClient.placeOrder(client.zerodhaApiKey, activeAccessToken, slPayload, (client.proxyUrl || client.dedicatedIp));
                          if (slRes?.status === 'success' && slRes.data?.order_id) {
                            slOrderIdStr = slRes.data.order_id;
                            console.log(`SL order placed for ${client.user?.name}: ${slOrderIdStr} (attempt ${slAttempt})`);
                            break;
                          } else {
                            console.warn(`AlgoEngine: SL-M order failed (attempt ${slAttempt}/3): ${slRes?.message || 'unknown'}`);
                            if (slAttempt < 3) await delay(1000);
                          }
                        } catch (err) {
                          console.error(`Failed to place SL order (attempt ${slAttempt}/3):`, err);
                          if (slAttempt < 3) await delay(1000);
                        }
                      }

                      // Wait 30 seconds, then place Target
                      console.log(`Waiting 30 seconds before placing Target order for ${client.user?.name}...`);
                      await delay(30000);
                      for (let tgtAttempt = 1; tgtAttempt <= 3; tgtAttempt++) {
                        try {
                          const tgtPayload: any = {
                            tradingsymbol: targetStock.symbol,
                            exchange: 'NSE',
                            transaction_type: isBuy ? 'SELL' : 'BUY',
                            quantity: qty,
                            product: 'CNC',
                            order_type: 'LIMIT',
                            price: targetPrice,
                            validity: 'DAY',
                            variety: 'regular',
                          };
                          const tgtRes = await KiteClient.placeOrder(client.zerodhaApiKey, activeAccessToken, tgtPayload, (client.proxyUrl || client.dedicatedIp));
                          if (tgtRes?.status === 'success' && tgtRes.data?.order_id) {
                            tgtOrderIdStr = tgtRes.data.order_id;
                            console.log(`Target order placed for ${client.user?.name}: ${tgtOrderIdStr} (attempt ${tgtAttempt})`);
                            break;
                          } else {
                            console.warn(`AlgoEngine: Target LIMIT order failed (attempt ${tgtAttempt}/3): ${tgtRes?.message || 'unknown'}`);
                            if (tgtAttempt === 3) {
                              tgtOrderStatusVal = 'VIRTUAL_PENDING';
                              console.warn(`AlgoEngine: All 3 Target LIMIT order attempts failed/rejected on Zerodha for ${client.user?.name}. Transitioned to VIRTUAL target monitoring.`);
                            } else {
                              await delay(1000);
                            }
                          }
                        } catch (err) {
                          console.error(`Failed to place Target order (attempt ${tgtAttempt}/3):`, err);
                          if (tgtAttempt === 3) {
                            tgtOrderStatusVal = 'VIRTUAL_PENDING';
                          } else {
                            await delay(1000);
                          }
                        }
                      }

                      break;
                    }
                    
                    const orderCancelled = latest?.status === 'CANCELLED' || latest?.status === 'REJECTED';
                    if (orderCancelled) {
                      console.warn(`AlgoEngine: Entry order ${entryOrderId} ${latest?.status}. Aborting.`);
                      break;
                    }
                  } catch (e) {
                    console.error('Polling entry status error:', e);
                  }
                }

                if (!entryFilled) {
                  console.log(`AlgoEngine: Entry order ${entryOrderId} placed (trigger pending). SL/Target will be placed by monitoring scheduler once entry fills.`);
                }

                if (tradeId) {
                  await prisma.trade.update({
                    where: { id: tradeId },
                    data: {
                      status: 'open',
                      entryOrderStatus: entryFilled ? 'filled' : (latestOrderStatus === 'COMPLETE' ? 'filled' : latestOrderStatus),
                      slOrderId: slOrderIdStr,
                      slTriggerPrice: slPrice,
                      targetOrderId: tgtOrderIdStr,
                      targetOrderStatus: tgtOrderStatusVal || (tgtOrderIdStr ? 'OPEN' : null)
                    }
                  });
                }
              }
            } catch (err) {
              console.error('Failed to place entry order:', err);
              await logFailedTrade(client, { id: group.strategyId, name: group.strategyName }, targetStock.symbol, 'CNC', entryPrice, 'Entry Fail', { direction: isBuy ? 'LONG' : 'SHORT', legName: leg.name || '', legTimeframe: '15m', dualLegGroupId: null, quantity: qty, stopLoss: slPrice, target: targetPrice, slTriggerPrice: slPrice });
              continue;
            }
          }
        })
      );
    }
  }
}
