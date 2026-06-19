type Candle = number[];

export function applyOperator(value: number, operator: string, compareValue: number): boolean {
  switch (operator) {
    case '>': return value > compareValue;
    case '<': return value < compareValue;
    case '==': return value === compareValue;
    case '>=': return value >= compareValue;
    case '<=': return value <= compareValue;
    case 'crosses-above': return value >= compareValue;
    case 'crosses-below': return value <= compareValue;
    default: return true;
  }
}

export function calculateSMA(values: number[], period: number): number {
  if (values.length < period) return values[values.length - 1];
  const slice = values.slice(values.length - period);
  return slice.reduce((sum, v) => sum + v, 0) / period;
}

export function calculateEMA(values: number[], period: number): number {
  if (values.length < 1) return 0;
  if (values.length < period) return calculateSMA(values, period);
  const k = 2 / (period + 1);
  let ema = calculateSMA(values.slice(0, period), period);
  for (let i = period; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k);
  }
  return ema;
}

export function calculateRSI(values: number[], period = 14): number {
  if (values.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = values.length - period; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

export function calculateMACD(values: number[]): { macd: number; signal: number; histogram: number } {
  const ema12 = calculateEMA(values, 12);
  const ema26 = calculateEMA(values, 26);
  const macdLine = ema12 - ema26;
  const macdValues = values.map((_, i) => {
    const e12 = calculateEMA(values.slice(0, i + 1), 12);
    const e26 = calculateEMA(values.slice(0, i + 1), 26);
    return e12 - e26;
  });
  const signal = calculateEMA(macdValues, 9);
  return { macd: macdLine, signal, histogram: macdLine - signal };
}

export function calculateATR(candles: Candle[], period = 14): number {
  if (candles.length < 2) return candles[0][2] - candles[0][3];
  let trSum = 0;
  const count = Math.min(candles.length, period);
  for (let i = candles.length - count; i < candles.length; i++) {
    const high = candles[i][2];
    const low = candles[i][3];
    const prevClose = i > 0 ? candles[i - 1][4] : candles[i][1];
    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    trSum += tr;
  }
  return trSum / count;
}

export function calculateVWAP(candles: Candle[]): number {
  let pvSum = 0, vSum = 0;
  for (const c of candles) {
    const typicalPrice = (c[2] + c[3] + c[4]) / 3;
    const volume = c[5] || 0;
    pvSum += typicalPrice * volume;
    vSum += volume;
  }
  return vSum > 0 ? pvSum / vSum : candles[candles.length - 1][4];
}

export function calculateBollingerBands(values: number[], period = 20): { upper: number; middle: number; lower: number } {
  const middle = calculateSMA(values, period);
  const slice = values.slice(values.length - period);
  const variance = slice.reduce((sum, v) => sum + Math.pow(v - middle, 2), 0) / period;
  const stdDev = Math.sqrt(variance);
  return { upper: middle + 2 * stdDev, middle, lower: middle - 2 * stdDev };
}

export function calculateSuperTrend(candles: Candle[], period = 10, multiplier = 3): { value: number; direction: 'up' | 'down' } {
  const atr = calculateATR(candles.slice(-period), period);
  const last = candles[candles.length - 1];
  const close = last[4];
  const hl2 = (last[2] + last[3]) / 2;
  const upperBand = hl2 + multiplier * atr;
  const lowerBand = hl2 - multiplier * atr;
  return { value: close > lowerBand ? lowerBand : upperBand, direction: close > lowerBand ? 'up' : 'down' };
}

export function calculateADX(candles: Candle[]): number {
  if (candles.length < 14) return 25;
  let plusDM = 0, minusDM = 0, tr = 0;
  const count = 14;
  for (let i = candles.length - count; i < candles.length; i++) {
    const prev = candles[i - 1];
    const curr = candles[i];
    const upMove = curr[2] - prev[2];
    const downMove = prev[3] - curr[3];
    if (upMove > downMove && upMove > 0) plusDM += upMove;
    else if (downMove > upMove && downMove > 0) minusDM += downMove;
    tr += Math.max(curr[2] - curr[3], Math.abs(curr[2] - prev[4]), Math.abs(curr[3] - prev[4]));
  }
  const pdi = (plusDM / Math.max(tr, 0.01)) * 100;
  const ndi = (minusDM / Math.max(tr, 0.01)) * 100;
  const dx = Math.abs((pdi - ndi) / Math.max(pdi + ndi, 0.01)) * 100;
  return isNaN(dx) ? 25 : Math.min(dx, 100);
}
