import { prisma } from '../../../../database/db';
import { KiteClient, kiteFetch } from '../../../services/kite';
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
  if (!tf) return 'minute';
  const map: Record<string, string> = {
    '1m': 'minute', '3m': '3minute', '5m': '5minute', '10m': '10minute',
    '15m': '15minute', '30m': '30minute', '60m': '60minute', '1h': '60minute', '1d': 'day'
  };
  return map[tf.toLowerCase()] || 'minute';
}

export class FirstMinuteStrategy {
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

    const preOpenStocksRaw = await getPreOpenStocks();
    if (!preOpenStocksRaw || preOpenStocksRaw.length === 0) return;

    let symbolToToken: any = {};
    try {
      console.log('AlgoEngine preSelect: Fetching instruments to map tokens via public proxy...');
      const masterClient = await getMasterClient();
      const res = await kiteFetch('https://api.kite.trade/instruments/NSE', { method: 'GET' }, masterClient?.dedicatedIp);
      const text = await res.text();
      const lines = text.split('\n');
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i]) continue;
        const cols = lines[i].split(',');
        if (cols.length > 2) {
          const exchange = cols[cols.length - 1].trim();
          if (exchange === 'NSE' || exchange === 'NFO') {
            const sym = cols[2].replace(/"/g, '').trim();
            symbolToToken[sym] = parseInt(cols[0], 10);
          }
        }
      }
      console.log(`AlgoEngine preSelect: Mapped ${Object.keys(symbolToToken).length} instruments.`);
    } catch (e: any) {
      console.error('AlgoEngine preSelect: Failed to fetch kite instruments:', e.message);
    }

    // Filter purely equity NSE stocks first
    const preOpenStocks: StockQuote[] = preOpenStocksRaw.map(s => ({
      symbol: s.symbol, name: s.name || s.symbol, ltp: s.ltp || 0,
      open: s.open || 0, high: s.high || 0, low: s.low || 0,
      prevClose: s.prevClose || 0, volume: s.volume || 0,
      change: s.change || 0, changePercent: s.changePercent || 0, iep: s.iep || s.ltp || 0,
      final: s.final || 0, finalQuantity: s.finalQuantity || 0, value: s.value || 0,
      ffmCap: s.ffmCap || 0, nm52wH: s.nm52wH || 0, nm52wL: s.nm52wL || 0,
      isNifty50: s.isNifty50 || false, isNifty500: s.isNifty500 || false, isBankNifty: s.isBankNifty || false, isFo: s.isFo || false,
      instrumentToken: symbolToToken[s.symbol] || s.instrumentToken || 0
    }));

    const strategyGroups = await fetchClientsByStrategy(true);
    if (strategyGroups.length === 0) return;

    const filteredGroups = strategyId ? strategyGroups.filter(g => g.strategyId === strategyId) : strategyGroups;

    for (const { strategyId: sId, strategyName, configJson } of filteredGroups) {
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
      
      const topCount = config.basicInfo?.topCount || 10;
      
      const sortedByChange = [...matchingStocks].sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0));
      const gainers = sortedByChange.filter(s => s.changePercent > 0).slice(0, topCount);
      const losers = sortedByChange.filter(s => s.changePercent < 0).reverse().slice(0, topCount);

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
    console.log('AlgoEngine: executePreOpenTrades (First Minute) started.');
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
    const dateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    const masterClient = await getMasterClient();
    if (!masterClient || !masterClient.accessToken) {
      console.error('AlgoEngine First Minute: No Master Client found. Cannot fetch candles.');
      return;
    }

    const strategyGroups = await fetchClientsByStrategy(false);
    const filteredGroups = strategyId ? strategyGroups.filter(g => g.strategyId === strategyId) : strategyGroups;

    for (const group of filteredGroups) {
      const engineType = group.configJson?.basicInfo?.engineType || '';
      if (engineType !== 'FIRST_MINUTE' && !group.strategyName.toLowerCase().includes('first minute') && !group.configJson?.basicInfo?.name?.toLowerCase().includes('first minute') && !group.strategyName.toLowerCase().includes('oh preopen') && !group.configJson?.basicInfo?.name?.toLowerCase().includes('oh preopen')) continue;
      const config: any = group.configJson;
      const topCount: number = config?.basicInfo?.topCount || 10;
      const selectPosition: number = config?.basicInfo?.selectPosition || 1;
      const activeLegs = (config?.legs || []).filter((l: any) => l.enabled || l.isEnabled);
      if (activeLegs.length === 0) continue;

      let preselectedStocks: StockQuote[] = [];
      try {
        const dbRecord = await prisma.strategyPreselect.findUnique({ where: { strategyId: group.strategyId } });
        if (dbRecord) preselectedStocks = JSON.parse(dbRecord.stockData);
      } catch (e) {}

      if (!preselectedStocks || preselectedStocks.length === 0) {
        preselectedStocks = this.engine.preselectedStockByStrategy.get(group.strategyId) || [];
      }

      if (!preselectedStocks || preselectedStocks.length === 0) continue;

      const gainers = preselectedStocks.filter(s => s.changePercent > 0).sort((a, b) => b.changePercent - a.changePercent).slice(0, topCount);
      const losers = preselectedStocks.filter(s => s.changePercent < 0).sort((a, b) => a.changePercent - b.changePercent).slice(0, topCount);

      const findMatchingStock = async (list: any[], requiredPattern: 'Green' | 'Red' | 'None', selectPos: number, ohlcCondition: string = 'None') => {
        let matchesFound = 0;
        for (const stock of list) {
          if (config?.conditions && !(await matchesConditions(stock, config.conditions, this.engine.wsLive))) continue;

          const legEntry = config?.legs?.[0]?.entryTime;
          let toTime = '09:30:00';
          if (legEntry && typeof legEntry === 'string') {
            toTime = legEntry.length === 5 ? legEntry + ':00' : legEntry;
          }
          const from = dateStr + ' 09:15:00';
          const to = dateStr + ' ' + toTime; 
          let liveToken = stock.instrumentToken;
          if (!liveToken && this.engine.wsLive?.instrumentToSymbol) {
            const instTokenStr = Object.entries(this.engine.wsLive.instrumentToSymbol).find(([, sym]) => sym === stock.symbol)?.[0];
            if (instTokenStr) liveToken = parseInt(instTokenStr, 10);
          }
          let tfStr = '1m';
          const uiTf = config?.legs?.[0]?.timeframe;
          const n = (group.strategyName + ' ' + (group.configJson?.basicInfo?.name || '')).toLowerCase();
          
          if (uiTf) {
            tfStr = uiTf;
          } else if (n.includes('15m') || n.includes('15 m') || n.includes('15-m') || n.includes('15 min')) {
            tfStr = '15m';
          } else if (n.includes('5m') || n.includes('5 m') || n.includes('5-m') || n.includes('5 min')) {
            tfStr = '5m';
          } else if (n.includes('3m') || n.includes('3 m') || n.includes('3-m') || n.includes('3 min')) {
            tfStr = '3m';
          }

          let candles: any = null;
          let hist: any[] = [];
          const targetIndex = selectPos - 1;
          const tokenStr = liveToken || stock.instrumentToken || stock.symbol;
          
          for (let attempt = 1; attempt <= 6; attempt++) {
            candles = await KiteClient.getHistoricalData(
              masterClient.zerodhaApiKey,
              masterClient.accessToken,
              tokenStr,
              mapTimeframeToKiteInterval(tfStr),
              from,
              to
            );
            
            if (candles?.data?.candles?.length > targetIndex) {
              hist = candles.data.candles;
              break;
            }
            if (attempt < 6) await delay(250); 
          }
          
          if (!hist || hist.length <= targetIndex) {
            console.log(`[FIRST MINUTE] ${stock.symbol} historical data not available for ${tfStr} at pos ${selectPos} after retries.`);
            continue;
          }
          
          const c = hist[targetIndex];
          const open = c[1];
          const close = c[4];
          const high = c[2];
          const low = c[3];
          
          let isMatch = false;
          if (requiredPattern === 'Red' && close < open) isMatch = true;
          else if (requiredPattern === 'Green' && close > open) isMatch = true;
          else if (requiredPattern === 'None' || !requiredPattern) isMatch = true;

          if (isMatch && ohlcCondition !== 'None') {
            if (ohlcCondition === 'Open = High' && open !== high) isMatch = false;
            else if (ohlcCondition === 'Open = Low' && open !== low) isMatch = false;
            else if (ohlcCondition === 'Open = Close' && open !== close) isMatch = false;
            else if (ohlcCondition === 'High = Low' && high !== low) isMatch = false;
            else if (ohlcCondition === 'High = Close' && high !== close) isMatch = false;
            else if (ohlcCondition === 'Low = Close' && low !== close) isMatch = false;
          }

          if (isMatch) {
             stock.firstCandleHigh = high;
             stock.firstCandleLow = low;
             stock.firstCandleOpen = open;
             stock.firstCandleClose = close;
             stock.firstCandleTimestamp = c[0];
             return stock;
          }
        }
        return null;
      };

      let gainerLegPattern: 'Green' | 'Red' | 'None' = 'Green';
      let loserLegPattern: 'Green' | 'Red' | 'None' = 'Red';
      let gainerSelectPos = 1;
      let loserSelectPos = 1;

      let gainerOhlc = config?.basicInfo?.ohlcCondition || 'None';
      let loserOhlc = config?.basicInfo?.ohlcCondition || 'None';

      // Extract patterns and positions from the config
      if (activeLegs.length > 0) {
         const leg1 = activeLegs[0];
         if (leg1.tradeAction?.candlePattern) gainerLegPattern = leg1.tradeAction.candlePattern as any;
         if (leg1.tradeAction?.selectPosition) gainerSelectPos = Number(leg1.tradeAction.selectPosition) || 1;
      }
      if (activeLegs.length > 1) {
         const leg2 = activeLegs[1];
         if (leg2.tradeAction?.candlePattern) loserLegPattern = leg2.tradeAction.candlePattern as any;
         if (leg2.tradeAction?.selectPosition) loserSelectPos = Number(leg2.tradeAction.selectPosition) || 1;
      }

      const targetGainer = await findMatchingStock(gainers, gainerLegPattern, gainerSelectPos, gainerOhlc);
      const targetLoser = await findMatchingStock(losers, loserLegPattern, loserSelectPos, loserOhlc);

      await Promise.all(
        group.assignedClients.map(async (client) => {
          if (client.tradingStatus !== 'active' || !client.zerodhaApiKey || !client.accessToken) return;

          const maxOpen = config?.riskManagement?.maxOpenPositions;
          if (maxOpen !== undefined && maxOpen !== null && maxOpen !== -1) {
            const openCount = await prisma.trade.count({
              where: { clientId: client.id, strategyId: group.strategyId, status: 'open' }
            });
            if (openCount >= maxOpen) return;
          }

          const todayStartLocal = new Date();
          todayStartLocal.setHours(0, 0, 0, 0);
          const todayTrades = await prisma.trade.findMany({
            where: { clientId: client.id, strategyId: group.strategyId, createdAt: { gte: todayStartLocal }, pnl: { not: null } }
          });
          const todayPnl = todayTrades.reduce((sum, t) => sum + Number(t.pnl || 0), 0);
          
          const maxDailyLoss = config?.riskManagement?.maxDailyLoss;
          if (maxDailyLoss !== undefined && maxDailyLoss !== null && maxDailyLoss !== -1 && todayPnl <= -Number(maxDailyLoss)) return;
          
          const maxDailyProfit = config?.riskManagement?.maxDailyProfit;
          if (maxDailyProfit !== undefined && maxDailyProfit !== null && maxDailyProfit !== -1 && todayPnl >= Number(maxDailyProfit)) return;

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

          for (let li = 0; li < activeLegs.length; li++) {
            if (legIndex !== undefined && legIndex !== null && li !== legIndex) continue;
            const leg = activeLegs[li];
            
            const isBuy = leg.tradeAction?.action?.toLowerCase() === 'long' || leg.tradeAction?.action?.toLowerCase() === 'buy';
            
            const selectionType = config?.basicInfo?.selectionType?.toLowerCase() || '';
            let targetStock = null;

            if (selectionType.includes('gapdown') || selectionType.includes('loser')) {
              targetStock = targetLoser;
            } else if (selectionType.includes('gapup') || selectionType.includes('gainer')) {
              targetStock = targetGainer;
            } else {
              // Backward compatibility
              targetStock = li === 0 ? targetGainer : targetLoser; 
            }
            
            if (!targetStock) continue;

            const todayStr = new Date().toISOString().split('T')[0];
            const dbLockKey = `trade_lock_${client.id}_${group.strategyId}_leg${li}_${todayStr}`;
            try {
              await prisma.appSettings.create({
                data: { settingKey: dbLockKey, settingValue: 'locked', type: 'lock' }
              });
            } catch (e) {
              continue;
            }

            const entryBufferPct = leg.tradeAction?.entryBufferPercent !== undefined ? leg.tradeAction.entryBufferPercent : (leg.tradeAction?.bufferPercent || 0.2);
            
            const priceType = leg.tradeAction?.candlePriceType?.toLowerCase();
            let baseEntry: number;
            if (priceType === 'high') {
              baseEntry = targetStock.firstCandleHigh;
            } else if (priceType === 'low') {
              baseEntry = targetStock.firstCandleLow;
            } else {
              baseEntry = isBuy ? targetStock.firstCandleHigh : targetStock.firstCandleLow;
            }

            const entryBufferVal = baseEntry * (entryBufferPct / 100);
            const entryPriceRaw = isBuy ? baseEntry + entryBufferVal : baseEntry - entryBufferVal;
            
            const slType = config.stoploss?.type || 'Fixed %';
            const slVal = slType === 'Fixed Points' ? (config.stoploss?.fixedPoints || 10) : (config.stoploss?.fixedPercent || 1);
            let slPriceRaw = 0;
            let slPoints = 0;
            
            if (slType === 'Fixed Points') {
               slPoints = slVal;
               slPriceRaw = isBuy ? entryPriceRaw - slVal : entryPriceRaw + slVal;
            } else {
               slPoints = entryPriceRaw * (slVal / 100);
               slPriceRaw = isBuy ? entryPriceRaw - slPoints : entryPriceRaw + slPoints;
            }
            if (slPoints <= 0) slPoints = 1;

            let qty = Math.floor(capitalAtRiskPerLeg / slPoints);
            if (qty <= 0) {
              console.log(`AlgoEngine: Quantity calculated as 0 for ${client.user?.name} in ${targetStock.symbol}. Risk capital too low for SL difference. Skipping leg.`);
              continue;
            }

            if (marginResult.marginRate !== undefined && marginResult.marginRate !== null && marginResult.marginRate > 0) {
              const qtyByBuyingPower = Math.floor((marginResult.clientCapital / legDivisor) / (entryPriceRaw * marginResult.marginRate));
              qty = Math.min(qty, qtyByBuyingPower);
            }
            
            if (qty <= 0) {
              await logFailedTrade(client, { id: group.strategyId, name: group.strategyName }, targetStock.symbol, 'MIS', entryPriceRaw, `Qty calculation resulted in 0 (Risk: ₹${capitalAtRiskPerLeg.toFixed(2)} / SL Points: ₹${slPoints.toFixed(2)})`, { direction: isBuy ? 'LONG' : 'SHORT', legName: leg.name || '', legTimeframe: '1m', dualLegGroupId: null, quantity: 0, stopLoss: slPriceRaw, target: 0, slTriggerPrice: slPriceRaw });
              continue;
            }

            const tgtType = config.target?.type || 'Profit %';
            let targetPriceRaw = 0;
            if (tgtType === 'Risk Reward Ratio') {
               const rrRatio = config.target?.riskRewardRatio || 3;
               const difference = Math.abs(entryPriceRaw - slPriceRaw);
               targetPriceRaw = isBuy ? entryPriceRaw + (difference * rrRatio) : entryPriceRaw - (difference * rrRatio);
            } else {
               const tgtVal = config.target?.profitPercent || 3;
               const tgtAmt = entryPriceRaw * (tgtVal / 100);
               targetPriceRaw = isBuy ? entryPriceRaw + tgtAmt : entryPriceRaw - tgtAmt;
            }

            const entryPrice = await getTickSizeAndRound(client.zerodhaApiKey, activeAccessToken, 'NSE', targetStock.symbol, entryPriceRaw);
            let slPrice = await getTickSizeAndRound(client.zerodhaApiKey, activeAccessToken, 'NSE', targetStock.symbol, slPriceRaw);
            let targetPrice = await getTickSizeAndRound(client.zerodhaApiKey, activeAccessToken, 'NSE', targetStock.symbol, targetPriceRaw);

            const freshLimits = await getFreshCircuitLimits(client, 'NSE', targetStock.symbol, activeAccessToken);
            if (freshLimits) {
              const { lower, upper } = freshLimits;
              if (entryPrice <= lower || entryPrice >= upper) {
                await logFailedTrade(client, { id: group.strategyId, name: group.strategyName }, targetStock.symbol, 'MIS', entryPrice, 'Circuit Hit', { direction: isBuy ? 'LONG' : 'SHORT', legName: leg.name || '', legTimeframe: '1m', dualLegGroupId: null, quantity: qty, stopLoss: slPrice, target: targetPrice, slTriggerPrice: slPrice });
                continue;
              }
            }

            const tradeType = config?.basicInfo?.tradeType || 'Intraday';
            const productParam = tradeType === 'Delivery' ? 'CNC' : (tradeType === 'Carry Forward' || tradeType === 'Normal' || tradeType === 'NRML') ? 'NRML' : 'MIS';

            const marketProtectionVal = (leg.tradeAction?.marketProtection !== undefined && Number(leg.tradeAction.marketProtection) >= 0)
              ? Number(leg.tradeAction.marketProtection)
              : 0.05;

            let orderTypeParam: 'MARKET' | 'LIMIT' | 'SL' | 'SL-M' = 'MARKET';
            let priceParam: number | undefined = undefined;
            let triggerPriceParam: number | undefined = undefined;
            const configOrderType = leg.tradeAction?.orderType;

            if (configOrderType === 'Limit') {
              orderTypeParam = 'LIMIT';
              priceParam = entryPrice;
            } else if (configOrderType === 'SL-Limit') {
              orderTypeParam = 'SL';
              triggerPriceParam = entryPrice;
              priceParam = entryPrice;
            } else if (configOrderType === 'SL-Market') {
              orderTypeParam = 'SL-M';
              triggerPriceParam = entryPrice;
            } else {
              orderTypeParam = 'MARKET';
            }

            let entryOrderId: string | null = null;
            try {
              const orderPayload: any = {
                tradingsymbol: targetStock.symbol,
                exchange: 'NSE',
                transaction_type: isBuy ? 'BUY' : 'SELL',
                quantity: qty,
                order_type: orderTypeParam,
                product: productParam,
                price: priceParam,
                trigger_price: triggerPriceParam,
                validity: 'DAY',
                variety: 'regular',
                tag: 'algo_firstmin',
                ...(orderTypeParam === 'MARKET' || orderTypeParam === 'SL-M' ? { market_protection: marketProtectionVal } : {})
              };

              let orderRes = await KiteClient.placeOrder(client.zerodhaApiKey, activeAccessToken, orderPayload, (client.proxyUrl || client.dedicatedIp));
              
              if (orderRes && orderRes.status === 'error') {
                if (orderRes.message?.includes('Trigger price') || 
                    orderRes.message?.includes('circuit') ||
                    orderRes.message?.includes('stoploss') ||
                    orderRes.message?.includes('lower than') ||
                    orderRes.message?.includes('higher than')) {
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
                  await prisma.trade.create({
                    data: {
                      clientId: client.id, strategyId: group.strategyId,
                      symbol: targetStock.symbol, orderType: productParam,
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
                      legTimeframe: '1m'
                    }
                  });
                  await prisma.strategyLog.create({
                    data: { strategyId: group.strategyId, message: `First Minute order failed for ${client.user?.name} (${targetStock.symbol}): ${errMsg}`, logType: 'error' }
                  });
                  continue;
                }
              }
              
              entryOrderId = orderRes?.data?.order_id;
              
              if (!entryOrderId) {
                await prisma.trade.create({
                  data: {
                    clientId: client.id, strategyId: group.strategyId,
                    symbol: targetStock.symbol, orderType: productParam,
                    entryPrice, quantity: qty,
                    stopLoss: slPrice, target: targetPrice,
                    slTriggerPrice: slPrice,
                    status: 'FAILED', entryTime: new Date(),
                    entryOrderStatus: 'FAILED',
                    kiteResponse: orderRes || {},
                    direction: isBuy ? 'LONG' : 'SHORT',
                    legName: leg.name || '',
                    legTimeframe: '1m'
                  }
                });
                continue;
              }

              if (entryOrderId) {
                let tradeId = '';
                try {
                  const pendingTrade = await prisma.trade.create({
                    data: {
                      clientId: client.id,
                      strategyId: group.strategyId,
                      symbol: targetStock.symbol,
                      orderType: productParam,
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
                      legTimeframe: '1m'
                    }
                  });
                  tradeId = pendingTrade.id;
                } catch (pendingErr) {}

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
                    if (latest?.status) latestOrderStatus = latest.status;
                    
                    if (latest?.status?.toUpperCase() === 'COMPLETE') {
                      // Try to acquire lock to prevent duplicate SL/Tgt orders by TradingScheduler
                      if (tradeId) {
                        const lockRes = await prisma.trade.updateMany({
                          where: { id: tradeId, OR: [{ slOrderStatus: null }, { slOrderStatus: { not: 'PROCESSING_SL_TGT' } }] },
                          data: { slOrderStatus: 'PROCESSING_SL_TGT' }
                        });
                        if (lockRes.count === 0) {
                          console.log(`AlgoEngine Monitor: Trade ${tradeId} SL/Tgt is already being processed by scheduler. Skipping internal strategy loop.`);
                          break;
                        }
                      }

                      entryFilled = true;
                      console.log(`Entry order ${entryOrderId} COMPLETE for ${client.user?.name}`);
                      
                      if (client.zerodhaApiKey && activeAccessToken) {
                        const freshLimitsSLT = await getFreshCircuitLimits(client, 'NSE', targetStock.symbol, activeAccessToken);
                        if (freshLimitsSLT) {
                          const { upper, lower } = freshLimitsSLT;
                          if (upper > 0 && lower > 0) {
                            if (isBuy) {
                              if (slPrice < lower) slPrice = lower + 0.05;
                              if (targetPrice > upper) targetPrice = upper;
                            } else {
                              if (slPrice > upper) slPrice = upper - 0.05;
                              if (targetPrice < lower) targetPrice = lower;
                            }
                            slPrice = await getTickSizeAndRound(client.zerodhaApiKey, activeAccessToken, 'NSE', targetStock.symbol, slPrice);
                            targetPrice = await getTickSizeAndRound(client.zerodhaApiKey, activeAccessToken, 'NSE', targetStock.symbol, targetPrice);
                          }
                        }
                      }

                      try {
                        const slPayload: any = {
                          tradingsymbol: targetStock.symbol,
                          exchange: 'NSE',
                          transaction_type: isBuy ? 'SELL' : 'BUY',
                          quantity: qty,
                          product: productParam,
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
                        }
                      } catch (err) {
                        console.error(`Failed to place SL order:`, err);
                      }

                      await delay(10000); // 10 seconds delay for target
                      for (let tgtAttempt = 1; tgtAttempt <= 1; tgtAttempt++) {
                        try {
                          const tgtPayload: any = {
                            tradingsymbol: targetStock.symbol,
                            exchange: 'NSE',
                            transaction_type: isBuy ? 'SELL' : 'BUY',
                            quantity: qty,
                            product: productParam,
                            order_type: 'LIMIT',
                            price: targetPrice,
                            validity: 'DAY',
                            variety: 'regular',
                          };
                          const tgtRes = await KiteClient.placeOrder(client.zerodhaApiKey, activeAccessToken, tgtPayload, (client.proxyUrl || client.dedicatedIp));
                          if (tgtRes?.status === 'success' && tgtRes.data?.order_id) {
                            tgtOrderIdStr = tgtRes.data.order_id;
                          } else {
                            tgtOrderStatusVal = 'VIRTUAL_PENDING';
                          }
                        } catch (err) {
                          tgtOrderStatusVal = 'VIRTUAL_PENDING';
                        }
                      }
                      break;
                    }
                    
                    if (latest?.status === 'CANCELLED' || latest?.status === 'REJECTED') {
                      break;
                    }
                  } catch (e) {}
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
              await logFailedTrade(client, { id: group.strategyId, name: group.strategyName }, targetStock.symbol, productParam, entryPrice, 'Entry Fail', { direction: isBuy ? 'LONG' : 'SHORT', legName: leg.name || '', legTimeframe: '1m', dualLegGroupId: null, quantity: qty, stopLoss: slPrice, target: targetPrice, slTriggerPrice: slPrice });
              continue;
            }
          }
        })
      );
    }
  }
}
