// Run: npx tsx scripts/verify-nse-symbols.ts
import https from 'https';
import zlib from 'zlib';

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

async function testSymbol(symbol: string, cookies: string): Promise<{ count: number; ok: boolean }> {
  try {
    const url = `https://www.nseindia.com/api/NextApi/apiClient/marketWatchApi?functionName=getIndicesData&symbol=${encodeURIComponent(symbol)}`;
    const r = await httpGet(url, {
      'User-Agent': UA, 'Accept': 'application/json, text/plain, */*',
      'Accept-Encoding': 'gzip, deflate, br', 'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://www.nseindia.com/market-data/live-equity-market',
      'Cookie': cookies, 'sec-fetch-dest': 'empty', 'sec-fetch-mode': 'cors', 'sec-fetch-site': 'same-origin',
    });
    if (r.status !== 200) return { count: 0, ok: false };
    const d = JSON.parse(r.body);
    const count = d?.data?.data?.length ?? 0;
    return { count, ok: count > 0 };
  } catch { return { count: 0, ok: false }; }
}

const ALL_INDICES = [
  // Derivatives
  'NIFTY 50', 'NIFTY BANK', 'NIFTY FIN SERVICE', 'NIFTY IND FPI 150', 'NIFTY MID SELECT', 'NIFTY NEXT 50',
  // Broad
  'NIFTY 100', 'NIFTY 200', 'NIFTY 500', 'NIFTY LARGEMID250', 'NIFTY MICROCAP250', 'NIFTY MIDCAP 100',
  'NIFTY MIDCAP150', 'NIFTY MIDCAP 50', 'NIFTY MIDSML400 5050', 'NIFTY MIDSML400',
  'NIFTY SMLCAP 500', 'NIFTY SMLCAP 100', 'NIFTY SMLCAP 250', 'NIFTY SMLCAP 50',
  'NIFTY TOTAL MKT', 'NIFTY500 LargMidSml EW', 'NIFTY500 MULTICAP',
  // Sectoral
  'NIFTY AUTO', 'NIFTY CEMENT', 'NIFTY CHEMICALS', 'NIFTY CONSR DURBL',
  'NIFTY FIN SERVICES EX-BNK', 'NIFTY FIN SER 2550', 'NIFTY FMCG',
  'NIFTY HEALTHCARE', 'NIFTY IT', 'NIFTY MEDIA', 'NIFTY METAL',
  'NIFTY MIDSMALL HLTHCR', 'NIFTY MIDSML FINSERV', 'NIFTY MIDSML IT&TELE',
  'NIFTY OIL AND GAS', 'NIFTY PHARMA', 'NIFTY PSU BANK', 'NIFTY PVT BANK',
  'NIFTY REALTY', 'NIFTY REITs&InvITs', 'NIFTY500 HLTHCR',
  // Thematic
  'NIFTY CAPITAL MARKETS', 'NIFTY COMMODITIES', 'NIFTY INDIA CONSUMPTION',
  'NIFTY CORE HOUSING', 'NIFTY IND SEL 5 CORP GRP', 'NIFTY CPSE', 'NIFTY ENERGY',
  'NIFTY EV & NEW AGE AUTOMOTIVE', 'NIFTY HOUSING', 'NIFTY IND DEFENCE',
  'NIFTY INDIA DIGITAL', 'NIFTY INDIA TOURISM', 'NIFTY INDIA MANUFACTURING',
  'NIFTY INFRA', 'NIFTY IND INFRA&LOGI', 'NIFTY INDIA INTERNET', 'NIFTY IPO',
  'NIFTY MIDCAP LIQ 15', 'NIFTY MNC', 'NIFTY MOBILITY',
  'NIFTY MIDSML INDIA CONSUM', 'NIFTY500 MCP INFRA 503020', 'NIFTY500 MC IND MFG 503020',
  'NIFTY IND NEW AGE CONSUM', 'NIFTY NON-CYCLIC CONSR', 'NIFTY PSE',
  'NIFTY IND RAILWAYS PSU', 'NIFTY RURAL', 'NIFTY SERV SECTOR',
  'NIFTY SHARIAH 25', 'NIFTY SME EMERGE', 'NIFTY TATA GRP 25% CAP',
  'NIFTY TRANS & LOGISTIC', 'NIFTY WAVES',
  'NIFTY100 ENH ESG', 'NIFTY100 ESG', 'NIFTY100 LIQ 15',
  'NIFTY50 SHARIAH', 'NIFTY500 SHARIAH', 'NIFTY CONGLOMERATE 50',
  // Strategy
  'NIFTY ALPHA 50', 'NIFTY ALPHALOWVOL 30', 'NIFTY ALPHAQULOWVOL 30',
  'NIFTY ALP QUA VAL LV 30', 'NIFTY DIV OPPS 50', 'NIFTY GROWTH SECT 15',
  'NIFTY HIGH BETA 50', 'NIFTY LOW VOLATILITY 50', 'NIFTY MIDCAP150 QLTY 50',
  'NIFTY500 MC MOMQUL 50', 'NIFTY QUAL LV 30', 'NIFTY SMLCAP250 QLT 50',
  'NIFTY TOTMKT MOMQUL 50', 'NIFTY TOP 10 EW', 'NIFTY TOP 15 EW', 'NIFTY TOP 20 EW',
  'NIFTY100 ALPHA 30', 'NIFTY100 EQL WGT', 'NIFTY100 LOWVOL 30', 'NIFTY100 QLTY 30',
  'NIFTY200 ALPHA 30', 'NIFTY200 QLTY 30', 'NIFTY200 VALUE 30', 'NIFTY200 MOMENTM 30',
  'NIFTY50 EQL WGT', 'NIFTY50 VALUE 20', 'NIFTY500 EQL WGT', 'NIFTY500 FLXCAP QLT 30',
  'NIFTY500 LOWVOL 50', 'NIFTY500 MULTIFACTOR 50', 'NIFTY500 QLTY 50',
  'NIFTY500 VALUE 50', 'NIFTY500 MOMENTM 50', 'NIFTY MIDCAP150 MOMENTM 50',
  'NIFTY MIDSML400 MOMQUL 100', 'NIFTY SMLCAP250 MOMQUL 100',
  // Others
  'SECURITIES IN F&O',
];

async function main() {
  console.log('Fetching NSE cookies...');
  const cookies = await getCookies();
  console.log('Cookies OK. Testing symbols...\n');

  const results: { symbol: string; count: number; ok: boolean }[] = [];

  for (const sym of ALL_INDICES) {
    await new Promise(r => setTimeout(r, 400)); // 400ms delay between calls
    const { count, ok } = await testSymbol(sym, cookies);
    results.push({ symbol: sym, count, ok });
    console.log(`${ok ? '✅' : '❌'} [${count}] ${sym}`);
  }

  console.log('\n\n=== FAILED SYMBOLS ===');
  results.filter(r => !r.ok).forEach(r => console.log(`❌ "${r.symbol}"`));

  console.log('\n=== SUCCESS SUMMARY ===');
  console.log(`OK: ${results.filter(r => r.ok).length} / ${results.length}`);
}

main().catch(console.error);
