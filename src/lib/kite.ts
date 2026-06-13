import crypto from 'crypto';

export class KiteClient {
  private static BASE_URL = 'https://api.kite.trade';
  private static KITE_VERSION = '3';

  /**
   * Generates the login connect redirect URL.
   */
  public static getLoginUrl(apiKey: string, clientId: string) {
    return `https://kite.zerodha.com/connect/login?api_key=${apiKey}&v=${this.KITE_VERSION}&redirect_params=state%3D${clientId}`;
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
}
