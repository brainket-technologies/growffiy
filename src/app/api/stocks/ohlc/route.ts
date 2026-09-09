import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/database/db';
import { algoEngine } from '../../../../shared/models/algoEngine';
import { KiteClient } from '../../../../shared/services/kite';

// In-memory state to track background fetches (resets on server restart)
const fetchState: Record<string, { running: boolean; done: boolean; processed: number; total: number; error?: string }> = {};

function getJobKey(date: string, time: string) {
  return `${date}_${time}`;
}

// Background fetch job (fire-and-forget)
async function runBackgroundFetch(dateParam: string, timeParam: string, jobKey: string, customSymbols?: string[]) {
  try {
    const client = await prisma.client.findFirst({
      where: { accessToken: { not: null }, zerodhaApiKey: { not: null } }
    });

    if (!client || !client.zerodhaApiKey || !client.accessToken) {
      fetchState[jobKey] = { running: false, done: true, processed: 0, total: 0, error: 'No active Zerodha client session.' };
      return;
    }

    // Get list of active stock symbols from engine or custom list
    let symbols = customSymbols && customSymbols.length > 0 ? customSymbols : algoEngine.getStocks().map(s => s.symbol);
    if (symbols.length === 0) {
      symbols = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'LT', 'ITC', 'AXISBANK', 'KOTAKBANK'];
    }

    // Get instrument tokens mappings
    const wsLive = (algoEngine as any).wsLive;
    if (wsLive && Object.keys(wsLive.instrumentToSymbol).length === 0) {
      await wsLive.ensureInstrumentMapping();
    }

    const instrumentToSymbol = wsLive ? wsLive.instrumentToSymbol : {};
    const symbolToToken: { [symbol: string]: string } = {};
    for (const [tokenStr, sym] of Object.entries(instrumentToSymbol)) {
      if (symbols.includes(sym as string)) {
        symbolToToken[sym as string] = tokenStr;
      }
    }

    const targetTimes = ['09:16', '09:20', '09:30', '09:45', '10:00', '12:00'];
    let processed = 0;
    const total = symbols.filter(s => !!symbolToToken[s]).length;

    fetchState[jobKey] = { running: true, done: false, processed: 0, total };

    // Concurrent batch processing (15 parallel workers) to maximize speed performance
    const CONCURRENCY = 15;
    const worker = async () => {
      while (symbols.length > 0) {
        const symbol = symbols.shift();
        if (!symbol) break;

        const token = symbolToToken[symbol];
        if (!token) continue;

        fetchState[jobKey] = { running: true, done: false, processed, total };

        // Highly optimized minimum delay to prevent request overlap
        await new Promise(resolve => setTimeout(resolve, 20));
      }
    };

    // Run parallel workers
    const workers = Array.from({ length: CONCURRENCY }, () => worker());
    await Promise.all(workers);


    console.log(`BG Fetch [${jobKey}]: Completed. Processed ${processed} symbols.`);
    fetchState[jobKey] = { running: false, done: true, processed, total };
  } catch (e: any) {
    console.error(`BG Fetch [${jobKey}]: Fatal error:`, e.message || e);
    fetchState[jobKey] = { running: false, done: true, processed: 0, total: 0, error: e.message };
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const dateParam = url.searchParams.get('date');
    const timeParam = url.searchParams.get('time');
    const triggerFetch = url.searchParams.get('fetch') === 'true';
    const pollStatus = url.searchParams.get('poll') === 'true';

    if (!dateParam || !timeParam) {
      return NextResponse.json({ success: false, error: 'date and time parameters are required.' }, { status: 400 });
    }

    const jobKey = getJobKey(dateParam, timeParam);

    // === POLL: Frontend asks for current status ===
    if (pollStatus) {
      const state = fetchState[jobKey];
      if (!state) {
        // No job running — return current DB data
        const dbRecords = await getDbRecords(dateParam, timeParam);
        return NextResponse.json({ success: true, status: 'idle', stocks: mapRecords(dbRecords) });
      }
      if (state.running) {
        return NextResponse.json({ success: true, status: 'running', processed: state.processed, total: state.total });
      }
      if (state.done) {
        // Job done — return DB data and clear state
        const dbRecords = await getDbRecords(dateParam, timeParam);
        delete fetchState[jobKey];
        return NextResponse.json({ success: true, status: 'done', stocks: mapRecords(dbRecords), processed: state.processed, total: state.total });
      }
    }

    // === TRIGGER: Start background fetch ===
    if (triggerFetch) {
      const forceParam = url.searchParams.get('force') === 'true';
      const categoryParam = url.searchParams.get('category') || 'NIFTY 500';
      
      const existing = fetchState[jobKey];
      if (existing?.running) {
        // Already running — return current progress
        return NextResponse.json({ success: true, status: 'running', processed: existing.processed, total: existing.total });
      }

      // 1. Fetch active index symbols list dynamically
      const { fetchStocksByNSEIndex } = require('../../../../shared/utils/marketWatchHelper');
      const customSymbols = await fetchStocksByNSEIndex(categoryParam);

      // Force delete existing records for this slot if overriding
      if (forceParam) {
        await prisma.historicalOhlc.deleteMany({
          where: { date: dateParam, time: timeParam }
        });
      }

      // Start background fetch (fire-and-forget)
      console.log(`API /api/stocks/ohlc: Explicit trigger fetch (force=${forceParam}) for category ${categoryParam} with ${customSymbols.length} symbols...`);
      runBackgroundFetch(dateParam, timeParam, jobKey, customSymbols); // intentionally NOT awaited

      return NextResponse.json({ success: true, status: 'started', message: 'Background fetch started. Poll /api/stocks/ohlc?date=...&time=...&poll=true for progress.' });
    }

    // === DEFAULT: Fetch from DB ===
    const dbRecords = await getDbRecords(dateParam, timeParam);
    return NextResponse.json({ success: true, date: dateParam, time: timeParam, stocks: mapRecords(dbRecords) });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const dateParam = url.searchParams.get('date');
    const where = dateParam ? { date: dateParam } : {};
    const result = await prisma.historicalOhlc.deleteMany({ where });
    return NextResponse.json({ success: true, deleted: result.count });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function getDbRecords(date: string, time: string) {
  return prisma.historicalOhlc.findMany({ where: { date, time } });
}

function mapRecords(dbRecords: any[]) {
  // Build category flag map from live preOpenCache so historical stocks get correct isFo/isNifty50/etc. flags
  const preOpenCache: any[] = (algoEngine as any).preOpenCache || [];
  const flagMap = new Map<string, { isFo: boolean; isNifty50: boolean; isNifty500: boolean; isBankNifty: boolean; isSme: boolean }>();
  for (const s of preOpenCache) {
    flagMap.set(s.symbol, {
      isFo: !!s.isFo,
      isNifty50: !!s.isNifty50,
      isNifty500: !!s.isNifty500,
      isBankNifty: !!s.isBankNifty,
      isSme: !!s.isSme,
    });
  }

  return dbRecords.map(rec => {
    const change = rec.close - rec.open;
    const changePercent = rec.open > 0 ? parseFloat(((change / rec.open) * 100).toFixed(2)) : 0;
    const flags = flagMap.get(rec.symbol) ?? { isFo: false, isNifty50: false, isNifty500: false, isBankNifty: false, isSme: false };
    return {
      symbol: rec.symbol,
      open: rec.open,
      high: rec.high,
      low: rec.low,
      close: rec.close,
      ltp: rec.close,
      prevClose: rec.open,
      change,
      changePercent,
      volume: 0,
      iep: rec.open,
      final: rec.close,
      finalQuantity: 0,
      value: 0,
      ffmCap: 0,
      nm52wH: rec.high,
      nm52wL: rec.low,
      // Category flags — essential for F&O / Nifty 50 / Nifty 500 / Bank Nifty / SME filters
      isFo: flags.isFo,
      isNifty50: flags.isNifty50,
      isNifty500: flags.isNifty500,
      isBankNifty: flags.isBankNifty,
      isSme: flags.isSme,
    };
  });
}
