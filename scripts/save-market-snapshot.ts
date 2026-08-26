// Run via: npx tsx scripts/save-market-snapshot.ts "09:20"
import { PrismaClient } from '@prisma/client';
import https from 'https';
import zlib from 'zlib';

const prisma = new PrismaClient();
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const agent = new https.Agent({ keepAlive: true, rejectUnauthorized: false });

function httpGet(url: string, headers: Record<string, string>): Promise<{ status: number; body: string; cookies: string[] }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request({ hostname: parsed.hostname, path: parsed.pathname + parsed.search, method: 'GET', headers, agent, timeout: 15000 }, (res) => {
      const cookies: string[] = [];
      const raw = res.headers['set-cookie'];
      if (Array.isArray(raw)) cookies.push(...raw.map(c => c.split(';')[0].trim()));
      else if (raw) cookies.push(raw.split(';')[0].trim());
      const chunks: Buffer[] = [];
      const enc = res.headers['content-encoding'] ?? '';
      let stream: NodeJS.ReadableStream = res;
      if (enc.includes('br')) stream = res.pipe(zlib.createBrotliDecompress());
      else if (enc.includes('gzip')) stream = res.pipe(zlib.createGunzip());
      stream.on('data', (c: Buffer) => chunks.push(c));
      stream.on('end', () => resolve({ status: res.statusCode ?? 0, body: Buffer.concat(chunks).toString('utf8'), cookies }));
      stream.on('error', reject);
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.on('error', reject);
    req.end();
  });
}

async function getCookies(): Promise<string> {
  const base = { 'User-Agent': UA, 'Accept': 'text/html,*/*;q=0.8', 'Accept-Encoding': 'gzip, deflate, br', 'Accept-Language': 'en-US,en;q=0.9', 'Connection': 'keep-alive' };
  const r1 = await httpGet('https://www.nseindia.com/', base);
  const map: Record<string,string> = {};
  for (const c of r1.cookies) { const eq = c.indexOf('='); if (eq>0) map[c.slice(0,eq)] = c.slice(eq+1); }
  const r2 = await httpGet('https://www.nseindia.com/market-data/live-equity-market', { ...base, 'Cookie': Object.entries(map).map(([k,v]) => `${k}=${v}`).join('; '), 'Referer': 'https://www.nseindia.com/' });
  for (const c of r2.cookies) { const eq = c.indexOf('='); if (eq>0) map[c.slice(0,eq)] = c.slice(eq+1); }
  return Object.entries(map).map(([k,v]) => `${k}=${v}`).join('; ');
}

async function fetchIndexData(symbol: string, cookies: string) {
  const url = `https://www.nseindia.com/api/NextApi/apiClient/marketWatchApi?functionName=getIndicesData&symbol=${encodeURIComponent(symbol)}`;
  const r = await httpGet(url, {
    'User-Agent': UA, 'Accept': 'application/json, text/plain, */*',
    'Accept-Encoding': 'gzip, deflate, br', 'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.nseindia.com/market-data/live-equity-market',
    'Cookie': cookies, 'sec-fetch-dest': 'empty', 'sec-fetch-mode': 'cors', 'sec-fetch-site': 'same-origin',
  });
  if (r.status !== 200) return null;
  const d = JSON.parse(r.body);
  return d?.data?.data || [];
}

const INDICES = [
  'NIFTY 50', 'NIFTY BANK', 'NIFTY FIN SERVICE', 'NIFTY MID SELECT', 'NIFTY NEXT 50', 'NIFTY 100', 'NIFTY 200', 'NIFTY 500',
  'NIFTY MIDCAP 100', 'NIFTY SMLCAP 100', 'NIFTY AUTO', 'NIFTY FMCG', 'NIFTY IT', 'NIFTY METAL', 'NIFTY PHARMA', 'NIFTY REALTY'
  // Extend as needed, keeping it to the most important ones to avoid script taking too long.
];

async function main() {
  const timeSlot = process.argv[2];
  if (!timeSlot) {
    console.error("Please provide a time slot, e.g., '09:20'");
    process.exit(1);
  }

  const dateStr = new Date().toISOString().split('T')[0];
  console.log(`Starting snapshot for ${dateStr} ${timeSlot}...`);

  const cookies = await getCookies();

  for (const index of INDICES) {
    console.log(`Fetching ${index}...`);
    try {
      const data = await fetchIndexData(index, cookies);
      if (data && data.length > 0) {
        await prisma.marketWatchSnapshot.upsert({
          where: {
            indexName_date_timeSlot: {
              indexName: index,
              date: dateStr,
              timeSlot: timeSlot
            }
          },
          update: { data },
          create: {
            indexName: index,
            date: dateStr,
            timeSlot: timeSlot,
            data
          }
        });
        console.log(`Saved ${index} (${data.length} stocks)`);
      }
    } catch (e) {
      console.error(`Failed for ${index}:`, e);
    }
    await new Promise(r => setTimeout(r, 500)); // Rate limit
  }

  console.log("Done.");
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
