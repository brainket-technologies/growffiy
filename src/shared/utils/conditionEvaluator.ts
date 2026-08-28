import { applyOperator, calculateRSI, calculateEMA, calculateSMA, calculateMACD, calculateATR, calculateVWAP, calculateBollingerBands, calculateSuperTrend, calculateADX } from '../services/indicators';

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

/**
 * Evaluate strategy scanner conditions for a given stock.
 */
export async function matchesConditions(
  stock: any,
  conditions: any[],
  wsLive: any,
  client?: any,
  conditionCache?: Map<string, boolean>,
  conditionCacheDateRef?: { date: string }
): Promise<boolean> {
  if (!conditions || !Array.isArray(conditions) || conditions.length === 0) return true;

  const strategyId = client?.strategy?.id;
  if (strategyId && conditionCache && conditionCacheDateRef) {
    const todayDateKey = new Date().toLocaleDateString();
    if (conditionCacheDateRef.date !== todayDateKey) {
      conditionCache.clear();
      conditionCacheDateRef.date = todayDateKey;
    }
    const cacheKey = `${strategyId}_${stock.symbol}`;
    if (conditionCache.has(cacheKey)) {
      return conditionCache.get(cacheKey)!;
    }
  }

  for (const cond of conditions) {
    const val = Number(cond.value);
    if (cond.indicator === 'Pre Open Change %') {
      const pct = stock.changePercent !== undefined ? stock.changePercent : stock.pChange;
      if (cond.operator === '<' && !(pct < val)) return false;
      if (cond.operator === '>' && !(pct > val)) return false;
      if (cond.operator === '<=' && !(pct <= val)) return false;
      if (cond.operator === '>=' && !(pct >= val)) return false;
      if (cond.operator === '==' && !(pct == val)) return false;
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
      const candles = await wsLive.fetchHistoricalCandles(client, stock.symbol, kiteInterval, 5);
      if (candles.length < 2) return true;
      const closePrices = candles.map((c: any) => c[4]);
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

  if (strategyId && conditionCache) {
    conditionCache.set(`${strategyId}_${stock.symbol}`, true);
  }
  return true;
}
