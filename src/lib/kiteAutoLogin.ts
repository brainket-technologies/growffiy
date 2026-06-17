import { generateTOTP } from './totp';
import { KiteClient } from './kite';
import { prisma } from './db';

// Helper to parse cookies from Set-Cookie headers
function parseCookies(cookieHeaders: string[] | null): string {
  if (!cookieHeaders) return '';
  return cookieHeaders
    .map(header => {
      const parts = header.split(';')[0];
      return parts;
    })
    .join('; ');
}

export async function performKiteAutoLogin(clientId: string): Promise<{ success: boolean; accessToken?: string; error?: string }> {
  try {
    if (process.env.KITE_AUTO_LOGIN_ENABLED !== 'true') {
      console.log(`KiteAutoLogin: Auto-login is disabled (KITE_AUTO_LOGIN_ENABLED is not 'true')`);
      return { success: false, error: 'Auto-login is disabled via environment configuration' };
    }

    console.log(`KiteAutoLogin: Initiating auto-login for client ID: ${clientId}`);

    // 1. Fetch Client Credentials from Database
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: { user: true }
    });

    if (!client) {
      return { success: false, error: 'Client not found in database' };
    }

    const {
      zerodhaClientId: userId,
      zerodhaPassword: password,
      zerodhaTotpSecret: totpSecret,
      zerodhaApiKey: apiKey,
      zerodhaApiSecret: apiSecret
    } = client;

    if (!userId || !password || !totpSecret || !apiKey || !apiSecret) {
      return { 
        success: false, 
        error: 'Missing required credentials (ClientID, Password, TOTP Secret, API Key, or API Secret)' 
      };
    }

    // 2. Step 1: Login request (Post Client ID + Password)
    console.log(`KiteAutoLogin: Sending login request for Zerodha user ${userId}...`);
    const loginParams = new URLSearchParams();
    loginParams.append('user_id', userId);
    loginParams.append('password', password);

    const loginRes = await fetch('https://kite.zerodha.com/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: loginParams.toString()
    });

    const loginData = await loginRes.json();
    if (loginData.status !== 'success' || !loginData.data?.request_id) {
      return { 
        success: false, 
        error: `Login step failed: ${loginData.message || 'Invalid Client ID or Password'}` 
      };
    }

    const requestId = loginData.data.request_id;
    // Capture session cookies
    const loginCookieHeaders = loginRes.headers.getSetCookie();
    let cookies = parseCookies(loginCookieHeaders);

    // 3. Step 2: Two-Factor Authentication (TOTP Verification)
    console.log('KiteAutoLogin: Generating TOTP code and submitting 2FA...');
    const totpCode = generateTOTP(totpSecret);
    
    const twofaParams = new URLSearchParams();
    twofaParams.append('user_id', userId);
    twofaParams.append('request_id', requestId);
    twofaParams.append('twofa_value', totpCode);
    twofaParams.append('twofa_type', 'totp');

    const twofaRes = await fetch('https://kite.zerodha.com/api/twofa', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookies,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: twofaParams.toString()
    });

    const twofaData = await twofaRes.json();
    if (twofaData.status !== 'success') {
      return { 
        success: false, 
        error: `2FA step failed: ${twofaData.message || 'Invalid TOTP/2FA Secret Key'}` 
      };
    }

    // Capture main session cookies (like enctoken, public_token)
    const twofaCookieHeaders = twofaRes.headers.getSetCookie();
    cookies = parseCookies(twofaCookieHeaders);

    // 4. Step 3: Kite Connect authorization redirection
    console.log('KiteAutoLogin: Requesting connect redirection to fetch request token...');
    const connectUrl = `https://kite.zerodha.com/connect/login?api_key=${apiKey}&v=3&redirect_params=state%3D${clientId}`;

    const connectRes = await fetch(connectUrl, {
      method: 'GET',
      headers: {
        'Cookie': cookies,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      redirect: 'manual' // Capture redirect details manually to fetch request_token
    });

    const locationHeader = connectRes.headers.get('location');
    if (!locationHeader) {
      return { 
        success: false, 
        error: 'Kite Connect redirection failed: Location header was missing in response.' 
      };
    }

    // Parse request_token out of the Location URL query parameters
    const redirectUrl = new URL(locationHeader);
    const requestToken = redirectUrl.searchParams.get('request_token');

    if (!requestToken) {
      return { 
        success: false, 
        error: `Kite Connect redirect parameters did not contain request_token. Redirect URL: ${locationHeader}` 
      };
    }

    // 5. Step 4: Token exchange (generate access token via standard Kite Connect exchange)
    console.log('KiteAutoLogin: Exchanging request_token for access_token...');
    const kiteData = await KiteClient.generateSession(apiKey, apiSecret, requestToken);

    if (kiteData.status !== 'success' || !kiteData.data?.access_token) {
      return { 
        success: false, 
        error: `Kite session token exchange failed: ${kiteData.message || 'Invalid request token'}` 
      };
    }

    const accessToken = kiteData.data.access_token;

    // 6. Step 5: Save token to database
    await prisma.client.update({
      where: { id: clientId },
      data: {
        accessToken: accessToken,
        zerodhaSession: JSON.stringify(kiteData)
      }
    });

    // 7. Write Audit Log
    try {
      const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
      if (admin) {
        await prisma.auditLog.create({
          data: {
            adminId: admin.id,
            action: 'Kite Token Auto-Refreshed',
            newValue: `Automatically refreshed Kite token for ${client.user?.name || 'Client'} via TOTP auto-login.`,
          }
        });
      }
    } catch {}

    console.log(`KiteAutoLogin: Auto-login completed successfully. New access_token saved for client: ${client.user?.name || 'Client'}`);
    return { success: true, accessToken };
  } catch (err: any) {
    console.error('KiteAutoLogin: Critical auto-login failure:', err);
    return { success: false, error: err.message || 'Auto-login crashed unexpectedly' };
  }
}
