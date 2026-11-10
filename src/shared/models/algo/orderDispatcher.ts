import { KiteClient } from '../../services/kite';

export interface DispatchOrderParams {
  apiKey: string;
  accessToken: string;
  orderParams: {
    exchange: string;
    tradingsymbol: string;
    transaction_type: 'BUY' | 'SELL';
    quantity: number;
    order_type: 'MARKET' | 'LIMIT' | 'SL' | 'SL-M';
    product: 'MIS' | 'CNC' | 'NRML';
    validity?: 'DAY' | 'IOC';
    price?: number;
    trigger_price?: number;
    market_protection?: number;
    variety?: 'regular' | 'amo';
    tag?: string;
  };
  proxyUrl?: string | null;
  dedicatedIp?: string | null;
}

export class OrderDispatcherService {
  // Tracks timestamp of last order sent per client API key (for Zerodha 10 req/s compliance)
  private lastOrderTimeByApiKey: Map<string, number> = new Map();
  // Minimum gap between two orders for the SAME API key: 100ms (10 orders/sec)
  private readonly PER_CLIENT_MIN_INTERVAL_MS = 100;

  /**
   * Dispatch an order to Zerodha Kite Connect with per-client rate limit protection.
   * - Across different clients: 100% parallel execution (0 wait time).
   * - For the SAME client (multiple strategies): Paces orders by 100ms to strictly comply
   *   with Zerodha's 10 requests/second limit, preventing Error 429 (Rate Limit Exceeded).
   */
  public async dispatchOrder(params: DispatchOrderParams): Promise<any> {
    const { apiKey, accessToken, orderParams, proxyUrl, dedicatedIp } = params;

    // Per-client micro-pacing check
    const lastTime = this.lastOrderTimeByApiKey.get(apiKey) || 0;
    const now = Date.now();
    const elapsed = now - lastTime;

    if (elapsed < this.PER_CLIENT_MIN_INTERVAL_MS) {
      const waitMs = this.PER_CLIENT_MIN_INTERVAL_MS - elapsed;
      await new Promise(resolve => setTimeout(resolve, waitMs));
    }

    this.lastOrderTimeByApiKey.set(apiKey, Date.now());

    // Execute order via KiteClient
    return KiteClient.placeOrder(
      apiKey,
      accessToken,
      orderParams,
      proxyUrl || dedicatedIp
    );
  }
}

// Global Singleton Instance
const globalForDispatcher = global as unknown as { orderDispatcher: OrderDispatcherService };
export const orderDispatcher = globalForDispatcher.orderDispatcher || new OrderDispatcherService();
if (process.env.NODE_ENV !== 'production') globalForDispatcher.orderDispatcher = orderDispatcher;

