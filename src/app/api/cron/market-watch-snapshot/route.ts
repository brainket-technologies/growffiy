import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import zlib from 'zlib';
import { prisma } from '../../../../database/db';

export const dynamic = 'force-dynamic';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const agent = new https.Agent({ keepAlive: true, rejectUnauthorized: false });

// ── Indices to snapshot ───────────────────────────────────────────────────────
const SNAPSHOT_INDICES = [
  'NIFTY 50', 'NIFTY BANK', 'NIFTY FIN SERVICE', 'NIFTY MID SELECT',
  'NIFTY NEXT 50', 'NIFTY 100', 'NIFTY 200', 'NIFTY 500',
  'NIFTY MIDCAP 100', 'NIFTY MIDCAP 150', 'NIFTY MIDCAP 50',
  'NIFTY SMALLCAP 100', 'NIFTY SMALLCAP 250', 'NIFTY SMALLCAP 50',
  'NIFTY TOTAL MARKET', 'NIFTY MICROCAP 250', 'NIFTY LARGEMIDCAP 250',
  'NIFTY AUTO', 'NIFTY FMCG', 'NIFTY IT', 'NIFTY METAL',
  'NIFTY PHARMA', 'NIFTY REALTY', 'NIFTY PSU BANK', 'NIFTY PRIVATE BANK',
  'NIFTY OIL & GAS', 'NIFTY HEALTHCARE INDEX', 'NIFTY CONSUMER DURABLES',
  'NIFTY MEDIA', 'NIFTY CHEMICALS', 'NIFTY CEMENT',
];

// ── Allowed time slots ────────────────────────────────────────────────────────
const ALLOWED_SLOTS = ['09:20', '09:30', '09:45', '12:00'];

// ── HTTP helper ───────────────────────────────────────────────────────────────
function httpGet(url: string, headers: Record<string, string>): Promise<{ status: number; body: string; cookies: string[] }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request(
      { hostname: parsed.hostname, path: parsed.pathname + parsed.search, method: 'GET', headers, agent, timeout: 15000 },
      (res) => {
        const cookies: string[] = [];
        const raw = res.headers['set-cookie'];
        if (Array.isArray(raw)) cookies.push(...raw.map(c => c.split(';')[0].trim()));
        else if (typeof raw === 'string') cookies.push((raw as string).split(';')[0].trim());

        const chunks: Buffer[] = [];
        const enc = res.headers['content-encoding'] ?? '';
        let stream: NodeJS.ReadableStream = res;
        if (enc.includes('br')) stream = res.pipe(zlib.createBrotliDecompress());
        else if (enc.includes('gzip')) stream = res.pipe(zlib.createGunzip());

        stream.on('data', (c: Buffer) => chunks.push(c));
        stream.on('end', () => resolve({ status: res.statusCode ?? 0, body: Buffer.concat(chunks).toString('utf8'), cookies }));
        stream.on('error', reject);
      }
    );
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.on('error', reject);
    req.end();
  });
}

async function getCookies(): Promise<string> {
  const base = {
    'User-Agent': UA, 'Accept': 'text/html,*/*;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br', 'Accept-Language': 'en-US,en;q=0.9',
    'Connection': 'keep-alive',
  };
  const map: Record<string, string> = {};
  const r1 = await httpGet('https://www.nseindia.com/', base);
  for (const c of r1.cookies) { const eq = c.indexOf('='); if (eq > 0) map[c.slice(0, eq)] = c.slice(eq + 1); }

  const cookie1 = Object.entries(map).map(([k, v]) => `${k}=${v}`).join('; ');
  const r2 = await httpGet('https://www.nseindia.com/market-data/live-equity-market', {
    ...base, 'Cookie': cookie1, 'Referer': 'https://www.nseindia.com/',
  });
  for (const c of r2.cookies) { const eq = c.indexOf('='); if (eq > 0) map[c.slice(0, eq)] = c.slice(eq + 1); }

  return Object.entries(map).map(([k, v]) => `${k}=${v}`).join('; ');
}

async function fetchIndexData(symbol: string, cookies: string): Promise<any[] | null> {
  const url = `https://www.nseindia.com/api/NextApi/apiClient/marketWatchApi?functionName=getIndicesData&symbol=${encodeURIComponent(symbol)}`;
  try {
    const r = await httpGet(url, {
      'User-Agent': UA, 'Accept': 'application/json, text/plain, */*',
      'Accept-Encoding': 'gzip, deflate, br', 'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://www.nseindia.com/market-data/live-equity-market',
      'Cookie': cookies, 'Sec-Fetch-Dest': 'empty', 'Sec-Fetch-Mode': 'cors', 'Sec-Fetch-Site': 'same-origin',
    });
    if (r.status !== 200) return null;
    const d = JSON.parse(r.body);
    return d?.data?.data || [];
  } catch {
    return null;
  }
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ── Main cron handler ─────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    // Security check
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    const cronSecret = process.env.CRON_SECRET || 'growffiy_cron_secret';
    if (secret !== cronSecret) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Determine time slot (auto from IST time, or manual override)
    const manualSlot = searchParams.get('slot');
    let timeSlot = manualSlot;

    if (!timeSlot) {
      // Auto-detect from IST time
      const now = new Date();
      const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const hh = String(ist.getHours()).padStart(2, '0');
      const mm = String(ist.getMinutes()).padStart(2, '0');
      timeSlot = `${hh}:${mm}`;
    }

    if (!ALLOWED_SLOTS.includes(timeSlot)) {
      return NextResponse.json({ success: false, error: `Invalid time slot: ${timeSlot}. Allowed: ${ALLOWED_SLOTS.join(', ')}` }, { status: 400 });
    }

    const dateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // YYYY-MM-DD

    console.log(`[MarketWatch Cron] Starting snapshot: ${dateStr} ${timeSlot}`);

    const cookies = await getCookies();
    const results = { saved: 0, failed: 0, errors: [] as string[] };

    for (const indexName of SNAPSHOT_INDICES) {
      const data = await fetchIndexData(indexName, cookies);
      if (data && data.length > 0) {
        try {
          await prisma.marketWatchSnapshot.upsert({
            where: { indexName_date_timeSlot: { indexName, date: dateStr, timeSlot } },
            update: { data },
            create: { indexName, date: dateStr, timeSlot, data },
          });
          results.saved++;
          console.log(`[MarketWatch Cron] ✓ ${indexName} (${data.length} stocks)`);
        } catch (e: any) {
          results.failed++;
          results.errors.push(`DB error for ${indexName}: ${e.message}`);
        }
      } else {
        results.failed++;
        results.errors.push(`No data for ${indexName}`);
      }
      await sleep(400); // Rate limit between NSE calls
    }

    console.log(`[MarketWatch Cron] Done: ${results.saved} saved, ${results.failed} failed`);

    return NextResponse.json({
      success: true,
      date: dateStr,
      timeSlot,
      saved: results.saved,
      failed: results.failed,
      errors: results.errors,
    });

  } catch (err: any) {
    console.error('[MarketWatch Cron] Fatal error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
