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

function extractRedirectFromBody(body: string): string | null {
  const metaMatch = body.match(/<meta[^>]*http-equiv=["']refresh["'][^>]*content=["']\d+;\s*url=['"]([^'"]+)['"]/i);
  if (metaMatch) return metaMatch[1];
  const formMatch = body.match(/<form[^>]*action=["']([^"']+)["']/i);
  if (formMatch && !formMatch[1].includes('logout') && !formMatch[1].includes('login')) return formMatch[1];
  const jsMatch = body.match(/window\.location\.href\s*=\s*['"]([^'"]+)['"]/);
  if (jsMatch) return jsMatch[1];
  const anchorMatch = body.match(/<a[^>]*href=["']([^"']+)["'][^>]*>.*?(?:continue|proceed|next|authorize)/i);
  if (anchorMatch) return anchorMatch[1];
  return null;
}

const KITE = 'https://kite.zerodha.com';
const API = 'https://api.kite.trade';

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

    const { zerodhaClientId: userId, zerodhaPassword: password, zerodhaTotpSecret: totpSecret } = client;

    if (!userId || !password || !totpSecret) {
      return { success: false, error: 'Missing client credentials (User ID, Password, or TOTP Secret)' };
    }

    const masterApiKeySetting = await prisma.appSettings.findUnique({ where: { settingKey: 'master_zerodha_api_key' } });
    const masterApiSecretSetting = await prisma.appSettings.findUnique({ where: { settingKey: 'master_zerodha_api_secret' } });
    const apiKey = masterApiKeySetting?.settingValue || '';
    const apiSecret = masterApiSecretSetting?.settingValue || '';

    if (!apiKey || !apiSecret) {
      return { success: false, error: 'Master Zerodha API credentials not configured in settings' };
    }

    let requestToken: string | null = null;

    // ── Step 1: Initial connect page visit (get kf_session cookie) ──
    let res = await fetch(`${KITE}/connect/login?v=3&api_key=${apiKey}`, { redirect: 'manual' });
    let allCookies = extractCookies(res);

    // ── Step 2: Login ──
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

    // ── Step 3: 2FA with skip_session=true ──
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

    // ── Step 4: Get request_token (try multiple methods) ──

    // Method A: 2FA response already contains redirect / request_token
    if (twofaData.data?.redirect) {
      const rtMatch = twofaData.data.redirect.match(/request_token=([A-Za-z0-9]+)/);
      if (rtMatch) requestToken = rtMatch[1];
    }
    if (!requestToken && twofaData.data?.request_token) {
      requestToken = twofaData.data.request_token;
    }

    // Method B: Visit connect login page, expect HTTP redirect
    if (!requestToken) {
      res = await fetch(`${KITE}/connect/login?v=3&api_key=${apiKey}&skip_session=true&redirect_params=state%3D${clientId}`, {
        redirect: 'manual', headers: { Cookie: allCookies }
      });
      const location1 = res.headers.get('location') || '';

      if (location1) {
        const rtMatch = location1.match(/request_token=([A-Za-z0-9]+)/);
        if (rtMatch) {
          requestToken = rtMatch[1];
        } else {
          // Follow redirect and check next one
          const finishRes = await fetch(location1, {
            redirect: 'manual', headers: { Cookie: allCookies }
          });
          const location2 = finishRes.headers.get('location') || '';
          if (location2) {
            const rtMatch2 = location2.match(/request_token=([A-Za-z0-9]+)/);
            if (rtMatch2) requestToken = rtMatch2[1];
          }
        }
      }

      // Method C: No HTTP redirect — try to extract from HTML body
      if (!requestToken) {
        const body = await res.text();
        const redirectUrl = extractRedirectFromBody(body);
        if (redirectUrl) {
          const rtMatch = redirectUrl.match(/request_token=([A-Za-z0-9]+)/);
          if (rtMatch) {
            requestToken = rtMatch[1];
          } else {
            // Follow the extracted redirect URL
            const followRes = await fetch(redirectUrl.startsWith('http') ? redirectUrl : `${KITE}${redirectUrl}`, {
              redirect: 'manual', headers: { Cookie: allCookies }
            });
            const loc = followRes.headers.get('location') || '';
            const rtMatch2 = loc.match(/request_token=([A-Za-z0-9]+)/);
            if (rtMatch2) requestToken = rtMatch2[1];
          }
        }
      }
    }

    if (!requestToken) {
      return { success: false, error: 'No redirect after connect step' };
    }

    // ── Step 5: Exchange for access token ──
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

    // ── Step 6: Save to DB ──
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
