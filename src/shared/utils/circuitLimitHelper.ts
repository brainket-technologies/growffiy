import { KiteClient } from '../services/kite';
import { getMasterClient } from './masterClient';

/**
 * Fetch upper and lower circuit limits for a specific exchange and symbol.
 * Uses master client credentials if available, otherwise falls back to client credentials.
 */
export async function getFreshCircuitLimits(
  client: any,
  exchange: string,
  symbol: string,
  accessToken?: string
): Promise<{ upper: number; lower: number } | null> {
  try {
    const masterClientData = await getMasterClient();
    const apiKey = masterClientData?.zerodhaApiKey || client.zerodhaApiKey;
    const token = masterClientData?.accessToken || accessToken || client.accessToken;
    if (!apiKey || !token) return null;

    const quoteRes = await KiteClient.getQuotes(apiKey, token, [`${exchange}:${symbol}`]);
    if (quoteRes?.status === 'success' && quoteRes.data?.[`${exchange}:${symbol}`]) {
      const q = quoteRes.data[`${exchange}:${symbol}`];
      if (q.upper_circuit_limit !== undefined && q.lower_circuit_limit !== undefined) {
        return {
          upper: Number(q.upper_circuit_limit),
          lower: Number(q.lower_circuit_limit)
        };
      }
    }
  } catch (e) {
    console.error(`getFreshCircuitLimits: Failed to fetch fresh circuit limits for ${symbol}:`, e);
  }
  return null;
}
