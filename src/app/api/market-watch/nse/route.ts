import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import zlib from 'zlib';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// Reusable HTTPS agent (keep-alive)
const agent = new https.Agent({ keepAlive: true, rejectUnauthorized: false });

function httpGet(url: string, headers: Record<string, string>, timeoutMs = 12000): Promise<{ status: number; body: string; cookies: string[] }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request(
      {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: 'GET',
        headers,
        agent,
        timeout: timeoutMs,
      },
      (res) => {
        const cookies: string[] = [];
        const rawCookies = res.headers['set-cookie'];
        if (Array.isArray(rawCookies)) cookies.push(...rawCookies.map(c => c.split(';')[0].trim()));
        else if (typeof rawCookies === 'string') cookies.push((rawCookies as string).split(';')[0].trim());

        const chunks: Buffer[] = [];
        const enc = res.headers['content-encoding'] ?? '';

        let stream: NodeJS.ReadableStream = res;
        if (enc.includes('br')) {
          stream = res.pipe(zlib.createBrotliDecompress());
        } else if (enc.includes('gzip')) {
          stream = res.pipe(zlib.createGunzip());
        } else if (enc.includes('deflate')) {
          stream = res.pipe(zlib.createInflate());
        }

        stream.on('data', (chunk: Buffer) => chunks.push(chunk));
        stream.on('end', () => resolve({ status: res.statusCode ?? 0, body: Buffer.concat(chunks).toString('utf8'), cookies }));
        stream.on('error', reject);
      }
    );
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
    req.on('error', reject);
    req.end();
  });
}

// Cookie cache
let cookieMap: Record<string, string> = {};
let cookieExpiry = 0;
let refreshPromise: Promise<void> | null = null;

function mergeCookieList(existing: Record<string, string>, newCookies: string[]): void {
  for (const c of newCookies) {
    const eq = c.indexOf('=');
    if (eq > 0) existing[c.slice(0, eq).trim()] = c.slice(eq + 1).trim();
  }
}

function buildCookieHeader(map: Record<string, string>): string {
  return Object.entries(map).map(([k, v]) => `${k}=${v}`).join('; ');
}

async function doRefresh(): Promise<void> {
  const map: Record<string, string> = {};

  const baseHeaders = {
    'User-Agent': UA,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
  };

  // Step 1 – homepage
  const r1 = await httpGet('https://www.nseindia.com/', baseHeaders, 10000);
  mergeCookieList(map, r1.cookies);

  // Step 2 – market page
  const r2 = await httpGet('https://www.nseindia.com/market-data/live-equity-market', {
    ...baseHeaders,
    'Cookie': buildCookieHeader(map),
    'Referer': 'https://www.nseindia.com/',
  }, 10000);
  mergeCookieList(map, r2.cookies);

  cookieMap    = map;
  cookieExpiry = Date.now() + 9 * 60 * 1000;
}

async function getCookies(): Promise<string> {
  if (Object.keys(cookieMap).length > 0 && Date.now() < cookieExpiry) return buildCookieHeader(cookieMap);
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => { refreshPromise = null; });
  }
  await refreshPromise;
  return buildCookieHeader(cookieMap);
}

export async function GET(req: NextRequest) {
  const symbol = new URL(req.url).searchParams.get('symbol');
  if (!symbol) return NextResponse.json({ success: false, error: 'symbol required' }, { status: 400 });

  try {
    const cookies = await getCookies();
    const nseUrl  = `https://www.nseindia.com/api/NextApi/apiClient/marketWatchApi?functionName=getIndicesData&symbol=${encodeURIComponent(symbol)}`;

    const apiHeaders = {
      'User-Agent': UA,
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Referer': 'https://www.nseindia.com/market-data/live-equity-market',
      'Cookie': cookies,
      'sec-ch-ua': '"Chromium";v="124"',
      'sec-ch-ua-mobile': '?0',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'Connection': 'keep-alive',
    };

    let result = await httpGet(nseUrl, apiHeaders, 12000);

    // If blocked, refresh and retry once
    if (result.status === 401 || result.status === 403 || result.status === 429) {
      cookieExpiry = 0;
      const freshCookies = await getCookies();
      result = await httpGet(nseUrl, { ...apiHeaders, 'Cookie': freshCookies }, 12000);
    }

    if (result.status !== 200) {
      return NextResponse.json({ success: false, error: `NSE returned HTTP ${result.status}` }, { status: 502 });
    }

    const data = JSON.parse(result.body);
    return NextResponse.json({ success: true, ...data });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Unknown error' }, { status: 500 });
  }
}
