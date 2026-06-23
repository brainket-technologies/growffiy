import { KiteClient } from '../services/kite';

const tickSizeCache = new Map<string, number>();
let cacheLoaded = false;
let loadingPromise: Promise<void> | null = null;

export async function loadTickSizes(apiKey: string, accessToken: string): Promise<void> {
  if (cacheLoaded) return;
  if (loadingPromise) return loadingPromise;
  loadingPromise = (async () => {
    try {
      const exchanges = ['NSE', 'NFO', 'BSE', 'CDS', 'MCX'];
      for (const exchange of exchanges) {
        const csv = await KiteClient.getInstrumentsCSV(apiKey, accessToken, exchange);
        const lines = csv.split('\n');
        const header = lines[0].split(',');
        const tickIdx = header.indexOf('tick_size');
        const symbolIdx = header.indexOf('tradingsymbol');
        if (tickIdx === -1 || symbolIdx === -1) continue;
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',');
          if (cols.length <= Math.max(tickIdx, symbolIdx)) continue;
          const key = `${exchange}:${cols[symbolIdx].replace(/"/g, '')}`;
          const tick = parseFloat(cols[tickIdx]);
          if (!isNaN(tick) && tick > 0) {
            tickSizeCache.set(key, tick);
          }
        }
      }
      cacheLoaded = true;
      console.log(`[TickSizeUtil] Loaded ${tickSizeCache.size} tick sizes`);
    } catch (err) {
      console.warn('[TickSizeUtil] Failed to load instruments CSV:', err);
      loadingPromise = null;
    }
  })();
  return loadingPromise;
}

export function getTickSize(symbol: string): number {
  return tickSizeCache.get(symbol) || 0.05;
}

export async function getTickSizeAndRound(
  apiKey: string,
  accessToken: string,
  exchange: string,
  symbol: string,
  price: number
): Promise<number> {
  if (!cacheLoaded) {
    await loadTickSizes(apiKey, accessToken);
  }
  const key = `${exchange}:${symbol}`;
  const tickSize = tickSizeCache.get(key) || 0.05;
  const rounded = Math.round(price / tickSize) * tickSize;
  return Number(rounded.toFixed(4));
}

export function roundToTick(price: number, tickSize: number): number {
  return Number((Math.round(price / tickSize) * tickSize).toFixed(4));
}
