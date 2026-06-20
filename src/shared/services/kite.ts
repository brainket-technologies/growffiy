import crypto from 'crypto';

export class KiteClient {
  private static BASE_URL = 'https://api.kite.trade';
  private static KITE_VERSION = '3';
  public static KITE_FRONTEND_URL = 'https://kite.zerodha.com';

  /**
   * Generates the login connect redirect URL.
   */
  public static getLoginUrl(apiKey: string, clientId: string) {
    return `${this.KITE_FRONTEND_URL}/connect/login?api_key=${apiKey}&v=${this.KITE_VERSION}&redirect_params=state%3D${clientId}`;
  }

  /**
   * Generates a secure checksum and exchanges the request_token for an access_token.
   * Format: sha256(api_key + request_token + api_secret)
   */
  public static async generateSession(apiKey: string, apiSecret: string, requestToken: string) {
    const checksum = crypto
      .createHash('sha256')
      .update(apiKey + requestToken + apiSecret)
      .digest('hex');

    const params = new URLSearchParams();
    params.append('api_key', apiKey);
    params.append('request_token', requestToken);
    params.append('checksum', checksum);

    const response = await fetch(`${this.BASE_URL}/session/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Kite-Version': this.KITE_VERSION,
      },
      body: params.toString(),
    });

    const data = await response.json();
    return data;
  }

  /**
   * Fetches the user profile.
   */
  public static async getProfile(apiKey: string, accessToken: string) {
    const response = await fetch(`${this.BASE_URL}/user/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `token ${apiKey}:${accessToken}`,
        'X-Kite-Version': this.KITE_VERSION,
      },
    });
    return response.json();
  }

  /**
   * Fetches user funds and margins.
   */
  public static async getMargins(apiKey: string, accessToken: string, segment?: string) {
    const endpoint = segment ? `/user/margins/${segment}` : '/user/margins';
    const response = await fetch(`${this.BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `token ${apiKey}:${accessToken}`,
        'X-Kite-Version': this.KITE_VERSION,
      },
    });
    return response.json();
  }

  /**
   * Invalidates the active access_token session.
   */
  public static async logout(apiKey: string, accessToken: string) {
    const response = await fetch(`${this.BASE_URL}/session/token?api_key=${apiKey}&access_token=${accessToken}`, {
      method: 'DELETE',
      headers: {
        'X-Kite-Version': this.KITE_VERSION,
      },
    });
    return response.json();
  }

  /**
   * Fetches live quotes for the specified instruments.
   */
  public static async getQuotes(apiKey: string, accessToken: string, instruments: string[]) {
    const query = instruments.map(ins => `i=${ins}`).join('&');
    const response = await fetch(`${this.BASE_URL}/market/quotes?${query}`, {
      method: 'GET',
      headers: {
        'Authorization': `token ${apiKey}:${accessToken}`,
        'X-Kite-Version': this.KITE_VERSION,
      },
    });
    return response.json();
  }

  /**
   * Fetches all orders for the current day.
   */
  public static async getOrders(apiKey: string, accessToken: string) {
    const response = await fetch(`${this.BASE_URL}/orders`, {
      method: 'GET',
      headers: {
        'Authorization': `token ${apiKey}:${accessToken}`,
        'X-Kite-Version': this.KITE_VERSION,
      },
    });
    return response.json();
  }

  /**
   * Fetches a single order by order_id.
   */
  public static async getOrderById(apiKey: string, accessToken: string, orderId: string) {
    const response = await fetch(`${this.BASE_URL}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `token ${apiKey}:${accessToken}`,
        'X-Kite-Version': this.KITE_VERSION,
      },
    });
    return response.json();
  }

  /**
   * Modifies an existing order (e.g., trailing SL trigger price).
   */
  public static async modifyOrder(
    apiKey: string,
    accessToken: string,
    orderId: string,
    params: {
      order_type?: 'MARKET' | 'LIMIT' | 'SL' | 'SL-M';
      quantity?: number;
      price?: number;
      trigger_price?: number;
      validity?: 'DAY' | 'IOC';
    }
  ) {
    const bodyParams = new URLSearchParams();
    if (params.order_type) bodyParams.append('order_type', params.order_type);
    if (params.quantity !== undefined) bodyParams.append('quantity', String(params.quantity));
    if (params.price !== undefined) bodyParams.append('price', String(params.price));
    if (params.trigger_price !== undefined) bodyParams.append('trigger_price', String(params.trigger_price));
    if (params.validity) bodyParams.append('validity', params.validity);

    const response = await fetch(`${this.BASE_URL}/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `token ${apiKey}:${accessToken}`,
        'X-Kite-Version': this.KITE_VERSION,
      },
      body: bodyParams.toString(),
    });
    return response.json();
  }

  /**
   * Cancels an order by order_id.
   */
  public static async cancelOrder(apiKey: string, accessToken: string, orderId: string, variety: string = 'regular') {
    const response = await fetch(`${this.BASE_URL}/orders/${variety}/${orderId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `token ${apiKey}:${accessToken}`,
        'X-Kite-Version': this.KITE_VERSION,
      },
    });
    return response.json();
  }

  /**
   * Places a regular order on Zerodha Kite.
   */
   public static async placeOrder(
    apiKey: string,
    accessToken: string,
    params: {
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
    }
  ) {
    const bodyParams = new URLSearchParams();
    bodyParams.append('exchange', params.exchange);
    bodyParams.append('tradingsymbol', params.tradingsymbol);
    bodyParams.append('transaction_type', params.transaction_type);
    bodyParams.append('quantity', String(params.quantity));
    bodyParams.append('order_type', params.order_type);
    bodyParams.append('product', params.product);
    if (params.validity) bodyParams.append('validity', params.validity);
    if (params.price !== undefined) bodyParams.append('price', String(params.price));
    if (params.trigger_price !== undefined) bodyParams.append('trigger_price', String(params.trigger_price));
    if (params.market_protection !== undefined) bodyParams.append('market_protection', String(params.market_protection));

    const variety = params.variety || 'regular';
    const response = await fetch(`${this.BASE_URL}/orders/${variety}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `token ${apiKey}:${accessToken}`,
        'X-Kite-Version': this.KITE_VERSION,
      },
      body: bodyParams.toString(),
    });

    return response.json();
  }

  /**
   * Fetches historical candle data from Zerodha Kite.
   */
  public static async getHistoricalData(
    apiKey: string,
    accessToken: string,
    instrumentToken: string,
    interval: string,
    from: string,
    to: string
  ) {
    const response = await fetch(
      `${this.BASE_URL}/instruments/historical/${instrumentToken}/${interval}?from=${from}&to=${to}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `token ${apiKey}:${accessToken}`,
          'X-Kite-Version': this.KITE_VERSION,
        },
      }
    );
    return response.json();
  }
}

