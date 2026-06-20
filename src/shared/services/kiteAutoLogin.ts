import { createHash } from 'crypto';
import { generateTOTP } from './totp';
import { prisma } from '../../database/db';

function extractCookies(res: Response): string {
  return res.headers.getSetCookie().map(c => c.split(';')[0]).join('; ');
}

function mergeCookies(existing: string, incoming: string): string {
  const map = new Map<string, string>();
  for (const cookie of [existing, incoming]) {
    for (const pair of cookie.split('; ').filter(Boolean)) {
      const [name] = pair.split('=');
      map.set(name, pair);
    }
  }
  return Array.from(map.values()).join('; ');
}

export async function performKiteAutoLogin(clientId: string): Promise<{ success: boolean; accessToken?: string; error?: string; user_name?: string }> {
  try {
    if (process.env.KITE_AUTO_LOGIN_ENABLED !== 'true') {
      return { success: false, error: 'Auto-login is disabled via environment configuration' };
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: { user: true }
    });

    if (!client) return { success: false, error: 'Client not found in database' };

    const { zerodhaClientId: userId, zerodhaPassword: password, zerodhaTotpSecret: totpSecret, zerodhaApiKey: apiKey, zerodhaApiSecret: apiSecret } = client;

    if (!userId || !password || !totpSecret || !apiKey || !apiSecret) {
      return { success: false, error: 'Missing required credentials' };
    }

    const KITE = 'https://kite.zerodha.com';
    const API = 'https://api.kite.trade';

    // 1. Initial connect page visit (get kf_session cookie)
    let res = await fetch(`${KITE}/connect/login?v=3&api_key=${apiKey}`, { redirect: 'manual' });
    let allCookies = extractCookies(res);

    // 2. Login
    res = await fetch(`${KITE}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': allCookies },
      body: new URLSearchParams({ user_id: userId, password })
    });
    const loginData = await res.json();
    if (loginData.status !== 'success' || !loginData.data?.request_id) {
      return { success: false, error: `Login failed: ${loginData.message || 'Invalid credentials'}` };
    }
    allCookies = mergeCookies(allCookies, extractCookies(res));

    // 3. 2FA with skip_session=true
    const totp = generateTOTP(totpSecret);
    res = await fetch(`${KITE}/api/twofa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': allCookies },
      body: new URLSearchParams({ user_id: userId, request_id: loginData.data.request_id, twofa_value: totp, twofa_type: 'totp', skip_session: 'true' })
    });
    const twofaData = await res.json();
    if (twofaData.status !== 'success') {
      return { success: false, error: `2FA failed: ${twofaData.message || 'Invalid TOTP'}` };
    }
    allCookies = mergeCookies(allCookies, extractCookies(res));

    // 4. Connect redirect
    res = await fetch(`${KITE}/connect/login?v=3&api_key=${apiKey}&skip_session=true`, {
      redirect: 'manual', headers: { Cookie: allCookies }
    });
    const location1 = res.headers.get('location') || '';
    if (!location1) {
      return { success: false, error: 'No redirect after connect step' };
    }

    // 5. Follow to /connect/finish or get request_token directly
    const finishRes = await fetch(location1, {
      redirect: 'manual', headers: { Cookie: allCookies }
    });
    const location2 = finishRes.headers.get('location') || '';
    if (!location2) {
      return { success: false, error: 'No redirect from finish page' };
    }

    // 6. Extract request_token
    const rtMatch = location2.match(/request_token=([A-Za-z0-9]+)/);
    if (!rtMatch) {
      return { success: false, error: `No request_token in redirect: ${location2.substring(0, 100)}` };
    }
    const requestToken = rtMatch[1];

    // 7. Exchange for access token
    const checksum = createHash('sha256').update(apiKey + requestToken + apiSecret).digest('hex');
    const sessionRes = await fetch(`${API}/session/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Kite-Version': '3' },
      body: new URLSearchParams({ api_key: apiKey, request_token: requestToken, checksum })
    });
    const sessionData = await sessionRes.json();
    if (sessionData.status !== 'success' || !sessionData.data?.access_token) {
      return { success: false, error: `Session exchange failed: ${sessionData.message || 'Invalid request_token'}` };
    }

    const accessToken = sessionData.data.access_token;
    const userName = sessionData.data.user_name;

    // 8. Save to DB
    await prisma.client.update({
      where: { id: clientId },
      data: { accessToken, zerodhaSession: JSON.stringify(sessionData.data) }
    });

    try {
      const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
      if (admin) {
        await prisma.auditLog.create({
          data: { adminId: admin.id, action: 'Kite Token Auto-Refreshed', newValue: `Token refreshed for ${client.user?.name || userName || 'Client'}` }
        });
      }
    } catch {}

    return { success: true, accessToken, user_name: userName };
  } catch (err: any) {
    console.error('KiteAutoLogin error:', err);
    return { success: false, error: err.message || 'Auto-login crashed' };
  }
}
