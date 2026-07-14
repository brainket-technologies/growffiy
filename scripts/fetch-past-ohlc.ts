import { prisma } from '../src/database/db';
import { KiteClient } from '../src/shared/services/kite';
import { algoEngine } from '../src/shared/models/algoEngine';

async function main() {
  console.log('--- One-time Zerodha OHLC Seeder Script ---');

  // 1. Load active client
  const client = await prisma.client.findFirst({
    where: { accessToken: { not: null }, zerodhaApiKey: { not: null } }
  });

  if (!client || !client.zerodhaApiKey || !client.accessToken) {
    console.error('No active Zerodha client session found in database. Please log in first.');
    process.exit(1);
  }
  console.log(`Using client credentials for client ID: ${client.zerodhaClientId}`);

  // 2. Initialize engine and symbol mappings
  const wsLive = (algoEngine as any).wsLive;
  if (wsLive) {
    console.log('Loading Zerodha instrument tokens mapping...');
    await wsLive.ensureInstrumentMapping();
  }

  // 3. Define target symbols
  // Let's seed top symbols from pre-open or watchlist
  let symbols = algoEngine.getStocks().map(s => s.symbol);
  if (symbols.length === 0) {
    // Default standard index stocks if engine not booted
    symbols = [
      'RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 
      'SBIN', 'LT', 'ITC', 'AXISBANK', 'KOTAKBANK', 
      'BHARTIARTL', 'BAJFINANCE', 'MARUTI', 'HCLTECH', 'ASIANPAINT'
    ];
  }
  console.log(`Targeting ${symbols.length} symbols: ${symbols.join(', ')}`);

  // Build symbol to instrument token mapping
  const instrumentToSymbol = wsLive ? wsLive.instrumentToSymbol : {};
  const symbolToToken: { [symbol: string]: string } = {};
  for (const [tokenStr, sym] of Object.entries(instrumentToSymbol)) {
    if (symbols.includes(sym as string)) {
      symbolToToken[sym as string] = tokenStr;
    }
  }

  // 4. Generate last 10 trading dates (excluding weekends)
  const datesToFetch: string[] = [];
  let d = new Date();
  while (datesToFetch.length < 10) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) { // Skip Sat (6) and Sun (0)
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      datesToFetch.push(`${yyyy}-${mm}-${dd}`);
    }
    d.setDate(d.getDate() - 1);
  }
  console.log(`Target dates to fetch: ${datesToFetch.join(', ')}`);

  const targetTimes = ['09:20', '09:30', '09:45', '12:00'];
  let successfulUpserts = 0;

  // 5. Fetch and insert for each symbol
  for (const symbol of symbols) {
    const token = symbolToToken[symbol];
    if (!token) {
      console.warn(`No instrument token mapping found for symbol: ${symbol}`);
      continue;
    }

    // We can fetch up to 30 days of 1-minute candles in a single call from Zerodha!
    const earliestDate = datesToFetch[datesToFetch.length - 1];
    const latestDate = datesToFetch[0];
    const fromTime = `${earliestDate} 09:15:00`;
    const toTime = `${latestDate} 15:30:00`;

    try {
      console.log(`Fetching historical candles for ${symbol} from ${fromTime} to ${toTime}...`);
      const res = await KiteClient.getHistoricalData(
        client.zerodhaApiKey,
        client.accessToken,
        token,
        'minute',
        fromTime,
        toTime
      );

      if (res.status === 'success' && Array.isArray(res.data?.candles)) {
        const candles = res.data.candles;

        const intervalConfig: Record<string, { startTime: string; count: number }> = {
          '09:20': { startTime: '09:20', count: 5 },
          '09:30': { startTime: '09:30', count: 5 },
          '09:45': { startTime: '09:45', count: 5 },
          '12:00': { startTime: '12:00', count: 5 },
        };

        for (const dateStr of datesToFetch) {
          for (const timeStr of targetTimes) {
            const cfg = intervalConfig[timeStr];
            if (!cfg) continue;

            const startIdx = candles.findIndex((c: any) => {
              const timestampStr = String(c[0]);
              return timestampStr.startsWith(dateStr) && timestampStr.includes(`${cfg.startTime}:00`);
            });

            if (startIdx === -1) continue;

            const group = candles.slice(startIdx, startIdx + cfg.count);
            if (group.length === 0) continue;

            const open = Number(group[0][1]);
            const high = Math.max(...group.map((c: any) => Number(c[2])));
            const low = Math.min(...group.map((c: any) => Number(c[3])));
            const close = Number(group[group.length - 1][4]);

            await prisma.historicalOhlc.upsert({
              where: { date_time_symbol: { date: dateStr, time: timeStr, symbol } },
              update: { open, high, low, close },
              create: { date: dateStr, time: timeStr, symbol, open, high, low, close }
            });
            successfulUpserts++;
          }
        }
      }
    } catch (e: any) {
      console.error(`Error processing symbol ${symbol}:`, e.message || e);
    }

    // Rate limiting: 350ms delay
    await new Promise(resolve => setTimeout(resolve, 350));
  }

  console.log(`--- Seeding completed. Successfully saved ${successfulUpserts} records. ---`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
