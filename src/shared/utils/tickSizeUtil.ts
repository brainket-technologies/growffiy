import { KiteClient } from '../services/kite';

export async function getTickSizeAndRound(
  apiKey: string,
  accessToken: string,
  exchange: string,
  symbol: string,
  price: number
): Promise<number> {
  let tickSize = 0.05; // Default tick size for Indian stock market
  try {
    const instrumentKey = `${exchange}:${symbol}`;
    const quoteRes = await KiteClient.getQuotes(apiKey, accessToken, [instrumentKey]);
    if (quoteRes?.status === 'success' && quoteRes.data?.[instrumentKey]) {
      const fetchedTickSize = quoteRes.data[instrumentKey].tick_size;
      if (typeof fetchedTickSize === 'number' && fetchedTickSize > 0) {
        tickSize = fetchedTickSize;
      }
    }
  } catch (err) {
    console.warn(`[TickSizeUtil] Failed to fetch tick size for ${exchange}:${symbol}, defaulting to 0.05:`, err);
  }

  // Round to nearest multiple of tick size
  const rounded = Math.round(price / tickSize) * tickSize;
  // Format to avoid floating point representation issues (e.g. 0.15000000000000002)
  return Number(rounded.toFixed(4));
}
