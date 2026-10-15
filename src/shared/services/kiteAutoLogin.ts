import { createHash } from 'crypto';
import https from 'https';
import { generateTOTP } from './totp';
import { prisma } from '@/database/db';

function extractCookies(res: { headers: { getSetCookie: () => string[] } }): string {
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

interface AutoLoginResponse {
  status: number;
  headers: {
    get: (name: string) => string | null;
    getSetCookie: () => string[];
  };
  json: () => Promise<any>;
  text: () => Promise<string>;
}

/**
 * Executes an HTTP/HTTPS request for Kite auto-login.
 * If client has a proxyUrl or dedicatedIp configured, routes through that proxy/IP.
 * If no proxy is assigned or if the proxy fails, gracefully falls back to the direct server IP.
 */
async function autoLoginFetch(url: string, options: any = {}, proxyOrIp?: string | null): Promise<AutoLoginResponse> {
  const ip = proxyOrIp ? String(proxyOrIp).trim() : '';
  const hasProxy = ip && ip !== 'null' && ip !== 'undefined' && ip !== '0.0.0.0' && ip !== '66.116.210.206';

  // If no dedicated proxy/IP, use direct server IP (standard fetch)
  if (!hasProxy) {
    const directRes = await fetch(url, options);
    return {
      status: directRes.status,
      headers: {
        get: (name: string) => directRes.headers.get(name),
        getSetCookie: () => directRes.headers.getSetCookie ? directRes.headers.getSetCookie() : []
      },
      json: () => directRes.json(),
      text: () => directRes.text()
    };
  }

  let agent: any;
  try {
    if (ip.startsWith('http://') || ip.startsWith('https://')) {
      const { HttpsProxyAgent } = require('https-proxy-agent');
      agent = new HttpsProxyAgent(ip);
    } else {
      agent = new https.Agent({ localAddress: ip, keepAlive: true });
    }
  } catch (agentErr: any) {
    console.warn(`[AutoLogin] Could not create proxy agent for (${ip}). Falling back to direct server IP:`, agentErr.message);
    const directRes = await fetch(url, options);
    return {
      status: directRes.status,
      headers: {
        get: (name: string) => directRes.headers.get(name),
        getSetCookie: () => directRes.headers.getSetCookie ? directRes.headers.getSetCookie() : []
      },
      json: () => directRes.json(),
      text: () => directRes.text()
    };
  }

  return new Promise<AutoLoginResponse>((resolve, reject) => {
    try {
      const parsedUrl = new URL(url);
      const postBody = options.body ? (typeof options.body === 'string' ? options.body : options.body.toString()) : '';
      const reqHeaders = { ...(options.headers || {}) };
      if (postBody) {
        reqHeaders['Content-Length'] = Buffer.byteLength(postBody);
      }

      const req = https.request({
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: parsedUrl.pathname + parsedUrl.search,
        method: options.method || 'GET',
        headers: reqHeaders,
        agent,
        timeout: 15000
      }, (res) => {
        let bodyData = '';
        res.on('data', chunk => bodyData += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode || 200,
            headers: {
              get: (name: string) => {
                const lower = name.toLowerCase();
                const val = res.headers[lower];
                return Array.isArray(val) ? val.join(', ') : (val || null);
              },
              getSetCookie: () => {
                const sc = res.headers['set-cookie'];
                return Array.isArray(sc) ? sc : (sc ? [sc] : []);
              }
            },
            text: async () => bodyData,
            json: async () => {
              try {
                return JSON.parse(bodyData);
              } catch {
                return { status: 'error', message: bodyData };
              }
            }
          });
        });
      });

      req.on('timeout', () => {
        req.destroy(new Error(`Proxy request timed out after 15000ms (${ip})`));
      });

      req.on('error', (err: any) => {
        console.warn(`[AutoLogin] Proxy request failed (${ip}: ${err.message}). Falling back to direct server IP...`);
        fetch(url, options).then(directRes => {
          resolve({
            status: directRes.status,
            headers: {
              get: (name: string) => directRes.headers.get(name),
              getSetCookie: () => directRes.headers.getSetCookie ? directRes.headers.getSetCookie() : []
            },
            json: () => directRes.json(),
            text: () => directRes.text()
          });
        }).catch(reject);
      });

      if (postBody) req.write(postBody);
      req.end();
    } catch (dispatchErr: any) {
      console.warn(`[AutoLogin] Proxy dispatch error. Falling back to direct server IP:`, dispatchErr.message);
      fetch(url, options).then(directRes => {
        resolve({
          status: directRes.status,
          headers: {
            get: (name: string) => directRes.headers.get(name),
            getSetCookie: () => directRes.headers.getSetCookie ? directRes.headers.getSetCookie() : []
          },
          json: () => directRes.json(),
          text: () => directRes.text()
        });
      }).catch(reject);
    }
  });
}

const KITE = 'https://kite.zerodha.com';
const API = 'https://api.kite.trade';

export async function performKiteAutoLogin(clientId: string, totpSecretOverride?: string): Promise<{ success: boolean; accessToken?: string; error?: string; user_name?: string }> {
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

    // Use override secret (e.g. from TOTP save flow) or fall back to DB value
    const effectiveTotpSecret = totpSecretOverride ? totpSecretOverride.trim().toUpperCase().replace(/\s+/g, '') : totpSecret;

    if (!userId || !password || !effectiveTotpSecret) {
      return { success: false, error: 'Missing client credentials (User ID, Password, or TOTP Secret)' };
    }

    const apiKey = (client.zerodhaApiKey || '').trim();
    const apiSecret = (client.zerodhaApiSecret || '').trim();

    if (!apiKey || !apiSecret) {
      return { success: false, error: 'Client-specific Zerodha Kite API Key & Secret are required for login' };
    }

    // Determine network egress: Use client's assigned proxy/dedicated IP, or fallback to server IP
    const proxyTarget = client.proxyUrl || client.dedicatedIp;
    if (proxyTarget && proxyTarget !== '66.116.210.206' && proxyTarget !== '0.0.0.0') {
      console.log(`[AutoLogin] Routing login for ${client.user?.name || userId} via dedicated IP/proxy: ${proxyTarget.startsWith('http') ? proxyTarget.replace(/:[^:]*@/, ':***@') : proxyTarget}`);
    } else {
      console.log(`[AutoLogin] Routing login for ${client.user?.name || userId} via default server IP`);
    }

    let requestToken: string | null = null;

    // ── Step 1: Initial connect page visit (get kf_session cookie) ──
    let res = await autoLoginFetch(`${KITE}/connect/login?v=3&api_key=${apiKey}`, { redirect: 'manual' }, proxyTarget);
    let allCookies = extractCookies(res);

    // ── Step 2: Login ──
    res = await autoLoginFetch(`${KITE}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': allCookies },
      body: new URLSearchParams({ user_id: userId, password }).toString()
    }, proxyTarget);
    const loginData = await res.json();
    if (loginData.status !== 'success' || !loginData.data?.request_id) {
      return { success: false, error: `Login failed: ${loginData.message || 'Invalid credentials'}` };
    }
    allCookies = mergeCookies(allCookies, extractCookies(res));

    // ── Step 3: 2FA with skip_session=true ──
    const totp = generateTOTP(effectiveTotpSecret);
    res = await autoLoginFetch(`${KITE}/api/twofa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': allCookies },
      body: new URLSearchParams({ user_id: userId, request_id: loginData.data.request_id, twofa_value: totp, twofa_type: 'totp', skip_session: 'true' }).toString()
    }, proxyTarget);
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
      res = await autoLoginFetch(`${KITE}/connect/login?v=3&api_key=${apiKey}&skip_session=true&redirect_params=state%3D${clientId}`, {
        redirect: 'manual', headers: { Cookie: allCookies }
      }, proxyTarget);
      const location1 = res.headers.get('location') || '';

      if (location1) {
        const rtMatch = location1.match(/request_token=([A-Za-z0-9]+)/);
        if (rtMatch) {
          requestToken = rtMatch[1];
        } else {
          // Follow redirect and check next one
          const finishRes = await autoLoginFetch(location1, {
            redirect: 'manual', headers: { Cookie: allCookies }
          }, proxyTarget);
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
            const followRes = await autoLoginFetch(redirectUrl.startsWith('http') ? redirectUrl : `${KITE}${redirectUrl}`, {
              redirect: 'manual', headers: { Cookie: allCookies }
            }, proxyTarget);
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
    console.log(`[AutoLogin Debug] apiKey len: ${apiKey.length}, reqToken len: ${requestToken.length}, apiSecret len: ${apiSecret.length}`);
    console.log(`[AutoLogin Debug] reqToken startsWith: ${requestToken.substring(0,4)}, apiKey startsWith: ${apiKey.substring(0,4)}`);
    const sessionRes = await autoLoginFetch(`${API}/session/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Kite-Version': '3' },
      body: new URLSearchParams({ api_key: apiKey, request_token: requestToken, checksum }).toString()
    }, proxyTarget);
    const sessionData = await sessionRes.json();
    if (sessionData.status !== 'success' || !sessionData.data?.access_token) {
      console.error('[AutoLogin Debug] Session exchange failed:', sessionData);
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
