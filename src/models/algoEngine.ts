import { prisma } from '../lib/db';
import { API_ENDPOINTS } from '../lib/constants';

export interface StockQuote {
  symbol: string;
  name: string;
  ltp: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  volume: number;
  change: number;
  changePercent: number;
  iep: number;
  final: number;
  finalQuantity: number;
  value: number; // in Crores
  ffmCap: number; // in Crores
  nm52wH: number;
  nm52wL: number;
}

class AlgoEngineService {
  private isTradingActive: boolean = false;
  private preOpenCache: StockQuote[] = [];
  private lastPreOpenFetchTime: number = 0;
  private preOpenCacheDate: string = '';

  constructor() {
    // Standby engine
  }

  public isWsConnected(): boolean {
    return false;
  }

  public getStocks(): StockQuote[] {
    return this.preOpenCache;
  }

  public toggleTrading(status: boolean) {
    this.isTradingActive = status;
  }

  public getTradingStatus(): boolean {
    return this.isTradingActive;
  }

  public async executePreOpenTrades(adminId: string): Promise<void> {
    // Trading logic removed
    return;
  }

  public async fetchLivePreOpenFromNSE(): Promise<StockQuote[]> {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': API_ENDPOINTS.NSE_REFERER,
    };

    try {
      console.log('Initiating pre-open fetch from official NSE India API...');
      // 1. Visit home page to generate cookie session
      const homeRes = await fetch(API_ENDPOINTS.NSE_HOME, { headers });
      const rawCookies = homeRes.headers.get('set-cookie') || '';
      const cookies = rawCookies.split(',').map(c => c.split(';')[0]).join('; ');

      // 2. Query the pre-open endpoint using the cookies
      const dataRes = await fetch(API_ENDPOINTS.NSE_PRE_OPEN, {
        headers: {
          ...headers,
          'Cookie': cookies,
        }
      });

      if (!dataRes.ok) {
        throw new Error(`NSE API responded with status ${dataRes.status}`);
      }

      const nseJson = await dataRes.json();
      if (!nseJson || !Array.isArray(nseJson.data)) {
        throw new Error('Invalid JSON format from NSE Pre-Open API');
      }

      console.log(`Successfully retrieved ${nseJson.data.length} pre-open quotes from NSE.`);

      const freshStocks: StockQuote[] = nseJson.data
        .filter((nseItem: any) => nseItem.metadata && nseItem.metadata.symbol)
        .map((nseItem: any) => {
          const symbol = nseItem.metadata.symbol;
          const name = nseItem.metadata.companyName || symbol;
          const prevClose = nseItem.metadata.prevClose || 100.0;
          const iep = nseItem.metadata.lastPrice || nseItem.metadata.iep || prevClose;
          const change = nseItem.metadata.change || 0;
          const changePercent = nseItem.metadata.pChange || 0;
          const ltp = iep;
          const open = iep;
          const high = nseItem.metadata.high || iep;
          const low = nseItem.metadata.low || iep;
          const volume = nseItem.detail?.quantity || nseItem.metadata.quantity || 0;
          const ffmCap = ltp * 50.0;
          const value = (volume * ltp) / 10000000;

          return {
            symbol,
            name,
            ltp,
            open,
            high,
            low,
            prevClose,
            volume,
            change,
            changePercent,
            iep,
            final: ltp,
            finalQuantity: volume,
            value,
            ffmCap,
            nm52wH: parseFloat((prevClose * 1.25).toFixed(2)),
            nm52wL: parseFloat((prevClose * 0.75).toFixed(2))
          };
        });

      const dateStr = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      this.preOpenCache = freshStocks;
      this.preOpenCacheDate = dateStr;
      this.lastPreOpenFetchTime = Date.now();

      await savePreOpenQuotesToDb(freshStocks, dateStr);
      return freshStocks;
    } catch (err) {
      console.error('NSE API pre-open fetch failed:', err);
      // Fallback to shared database cache
      const dbData = await getPreOpenQuotesFromDb();
      if (dbData) {
        this.preOpenCache = dbData.quotes;
        this.preOpenCacheDate = dbData.date;
      }
      return this.preOpenCache;
    }
  }

  public async fetchLivePreOpenFromKite(): Promise<StockQuote[]> {
    // Dynamic pre-open fallback direct to NSE fetch
    return this.fetchLivePreOpenFromNSE();
  }

  public async getPreOpenStocks(): Promise<StockQuote[]> {
    // If memory cache is empty, load from database first (for serverless instances)
    if (this.preOpenCache.length === 0) {
      const dbData = await getPreOpenQuotesFromDb();
      if (dbData) {
        this.preOpenCache = dbData.quotes;
        this.preOpenCacheDate = dbData.date;
        this.lastPreOpenFetchTime = Date.now();
      }
    }

    if (this.preOpenCache.length === 0 || Date.now() - this.lastPreOpenFetchTime > 5 * 60 * 1000) {
      await this.fetchLivePreOpenFromNSE();
    }
    return this.preOpenCache;
  }

  public getPreOpenDate(): string {
    return this.preOpenCacheDate || new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
}

async function savePreOpenQuotesToDb(quotes: StockQuote[], date: string) {
  try {
    await prisma.appSettings.upsert({
      where: { settingKey: 'PRE_OPEN_QUOTES_DATA' },
      update: { settingValue: JSON.stringify({ quotes, date }) },
      create: { settingKey: 'PRE_OPEN_QUOTES_DATA', settingValue: JSON.stringify({ quotes, date }), type: 'json' }
    });
  } catch (error) {
    console.error('Failed to save pre-open quotes to appSettings:', error);
  }
}

async function getPreOpenQuotesFromDb(): Promise<{ quotes: StockQuote[], date: string } | null> {
  try {
    const setting = await prisma.appSettings.findUnique({
      where: { settingKey: 'PRE_OPEN_QUOTES_DATA' }
    });
    if (setting) {
      return JSON.parse(setting.settingValue);
    }
  } catch (error) {
    console.error('Failed to get pre-open quotes from appSettings:', error);
  }
  return null;
}

const globalForAlgo = global as unknown as { algoEngine: AlgoEngineService };
export const algoEngine = globalForAlgo.algoEngine || new AlgoEngineService();
if (process.env.NODE_ENV !== 'production') globalForAlgo.algoEngine = algoEngine;
