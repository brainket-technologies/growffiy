import { prisma } from '@/database/db';
import { fetchClientsByStrategy, StrategyClientGroup, SelectedClient } from './clientSelector';
import { KiteClient } from '../../services/kite';
import { getMasterClient } from '../../utils/masterClient';
import { loadTickSizes } from '../../utils/tickSizeUtil';
import { concurrentMap } from '../../../core/helpers';

export class MasterDataCacheService {
  private clientGroupsByStrategy: Map<string, StrategyClientGroup> = new Map();
  private activeStrategyCountMap: Map<string, number> = new Map();
  public marginCache: Map<string, number> = new Map();
  private inMemoryLockSet: Set<string> = new Set();
  private activeSymbolDirections: Map<string, 'LONG' | 'SHORT'> = new Map();
  private excludedStocksSet: Set<string> = new Set();
  private isExcludedStocksLoaded: boolean = false;

  private isLoaded: boolean = false;
  private lastLoadedDate: string = '';
  private lastLoadedTimestamp: number = 0;
  private isLoading: boolean = false;

  /**
   * Load Master Data into memory (Scheduled at 09:00 AM daily or on demand).
   * Fetches all active strategies, eligible clients, pre-calculates activeStrategyCount (N)
   * per client, and pre-warms Kite instrument tick sizes.
   */
  public async loadDailyMasterData(force: boolean = false): Promise<void> {
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    if (!force && this.isLoaded && this.lastLoadedDate === todayStr) {
      console.log(`[MasterDataCache] Master data already loaded for today (${todayStr}).`);
      return;
    }

    if (this.isLoading) {
      console.log('[MasterDataCache] Master data loading already in progress. Waiting...');
      return;
    }

    this.isLoading = true;
    try {
      console.log(`[MasterDataCache] Loading daily master data for ${todayStr}...`);

      // 1. Fetch eligible clients per strategy (single database query through clientSelector)
      const groups = await fetchClientsByStrategy(false);
      this.clientGroupsByStrategy.clear();
      this.activeStrategyCountMap.clear();

      // Count active strategies per client (N divisor)
      const countMap = new Map<string, Set<string>>();
      for (const group of groups) {
        this.clientGroupsByStrategy.set(group.strategyId, group);
        for (const client of group.assignedClients) {
          if (!countMap.has(client.id)) {
            countMap.set(client.id, new Set<string>());
          }
          countMap.get(client.id)!.add(group.strategyId);
        }
      }

      for (const [clientId, stratSet] of countMap.entries()) {
        this.activeStrategyCountMap.set(clientId, stratSet.size);
      }

      console.log(`[MasterDataCache] Cached ${groups.length} active strategies and calculated strategy counts for ${countMap.size} clients.`);

      // 2. Pre-warm Tick Sizes for NSE instruments using master client
      try {
        const masterClient = await getMasterClient();
        if (masterClient?.zerodhaApiKey && masterClient?.accessToken) {
          console.log('[MasterDataCache] Pre-warming tick sizes...');
          await loadTickSizes(masterClient.zerodhaApiKey, masterClient.accessToken);
        }
      } catch (tickErr) {
        console.warn('[MasterDataCache] Non-blocking tick size pre-warm error:', tickErr);
      }

      // 3. Load global excluded stocks into fast in-memory Set
      try {
        await this.loadExcludedStocks();
      } catch (exErr) {
        console.warn('[MasterDataCache] Non-blocking excluded stocks load error:', exErr);
      }

      this.isLoaded = true;
      this.lastLoadedDate = todayStr;
      this.lastLoadedTimestamp = Date.now();
      console.log(`[MasterDataCache] Master data successfully loaded in memory for ${todayStr}.`);
    } catch (err) {
      console.error('[MasterDataCache] Failed to load daily master data:', err);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Pre-warm live Zerodha margins for clients of a specific strategy at T-20s.
   * Only fetches margins for clients whose margin is not already cached.
   */
  public async preWarmStrategyMargins(strategyId: string): Promise<void> {
    const group = this.clientGroupsByStrategy.get(strategyId);
    if (!group || group.assignedClients.length === 0) return;

    const uncachedClients = group.assignedClients.filter(c => 
      c.zerodhaApiKey && c.accessToken && !this.marginCache.has(c.id)
    );

    if (uncachedClients.length === 0) {
      console.log(`[MasterDataCache] Strategy "${group.strategyName}" - All ${group.assignedClients.length} clients already have margins cached.`);
      return;
    }

    console.log(`[MasterDataCache] Pre-warming live margins for ${uncachedClients.length} clients in strategy "${group.strategyName}"...`);
    const CONCURRENCY = 15;
    await concurrentMap(uncachedClients, async (client) => {
      try {
        const marginRes = await KiteClient.getMargins(client.zerodhaApiKey!, client.accessToken!);
        if (marginRes?.status === 'success' && marginRes.data?.equity?.net !== undefined) {
          this.marginCache.set(client.id, Number(marginRes.data.equity.net));
        }
      } catch {
        // Fallback to client.capital handled in marginHelper
      }
    }, CONCURRENCY);

    console.log(`[MasterDataCache] Pre-warmed margins. Total cached margins: ${this.marginCache.size}.`);
  }

  /**
   * Fast In-Memory Lock (Replaces heavy PostgreSQL appSettings.create table locks).
   * Returns true if lock was acquired, false if already locked today.
   */
  public acquireLock(lockKey: string): boolean {
    if (this.inMemoryLockSet.has(lockKey)) {
      return false;
    }
    this.inMemoryLockSet.add(lockKey);
    return true;
  }

  /**
   * Release an in-memory lock if needed.
   */
  public releaseLock(lockKey: string): void {
    this.inMemoryLockSet.delete(lockKey);
  }

  /**
   * Check if client already holds an active trade in the opposite direction for this symbol
   * (Prevents Zerodha MIS auto square-off conflict).
   */
  public hasOppositeDirection(clientId: string, symbol: string, requestedDirection: 'LONG' | 'SHORT'): boolean {
    const key = `${clientId}:${symbol}`;
    const activeDir = this.activeSymbolDirections.get(key);
    if (!activeDir) return false;
    return activeDir !== requestedDirection;
  }

  /**
   * Record active position direction for symbol conflict tracking.
   */
  public recordPosition(clientId: string, symbol: string, direction: 'LONG' | 'SHORT'): void {
    this.activeSymbolDirections.set(`${clientId}:${symbol}`, direction);
  }

  /**
   * Clear active position when trade closes.
   */
  public clearPosition(clientId: string, symbol: string): void {
    this.activeSymbolDirections.delete(`${clientId}:${symbol}`);
  }

  /**
   * Get pre-calculated count of active strategies for this client.
   * Guaranteed fallback to 1 if unknown.
   */
  public getActiveStrategyCount(clientId: string): number {
    return this.activeStrategyCountMap.get(clientId) || 1;
  }

  /**
   * Get cached group for strategy.
   */
  public getStrategyGroup(strategyId: string): StrategyClientGroup | undefined {
    return this.clientGroupsByStrategy.get(strategyId);
  }

  /**
   * Invalidate cached client when admin changes status or assignments.
   */
  public invalidateClient(clientId: string): void {
    this.isLoaded = false; // Forces fresh reload on next cycle
  }

  /**
   * Reset in-memory locks daily at midnight.
   */
  public clearDailyLocks(): void {
    this.inMemoryLockSet.clear();
    this.activeSymbolDirections.clear();
  }

  /**
   * Load excluded stocks from database into fast memory Set.
   */
  public async loadExcludedStocks(force: boolean = false): Promise<Set<string>> {
    if (!force && this.isExcludedStocksLoaded) {
      return this.excludedStocksSet;
    }
    try {
      const setting = await prisma.appSettings.findUnique({
        where: { settingKey: 'global_excluded_stocks' }
      });
      if (setting && setting.settingValue) {
        const parsed = JSON.parse(setting.settingValue);
        if (Array.isArray(parsed)) {
          this.excludedStocksSet = new Set(
            parsed.map((s: string) => String(s || '').toUpperCase().trim()).filter(Boolean)
          );
        }
      } else {
        this.excludedStocksSet = new Set();
      }
      this.isExcludedStocksLoaded = true;
      console.log(`[MasterDataCache] Loaded ${this.excludedStocksSet.size} global excluded stocks into memory.`);
    } catch (e) {
      console.error('[MasterDataCache] Error loading excluded stocks:', e);
    }
    return this.excludedStocksSet;
  }

  /**
   * Check if a stock symbol is blacklisted/excluded.
   * Runs in O(1) time (<0.001ms) with zero DB/network queries.
   */
  public isStockExcluded(symbol?: string): boolean {
    if (!symbol) return false;
    const cleanSym = String(symbol).toUpperCase().trim();
    return this.excludedStocksSet.has(cleanSym);
  }

  /**
   * Update excluded stocks in memory immediately when Admin updates via UI.
   */
  public setExcludedStocks(symbols: string[]): void {
    this.excludedStocksSet = new Set(
      symbols.map(s => String(s || '').toUpperCase().trim()).filter(Boolean)
    );
    this.isExcludedStocksLoaded = true;
    console.log(`[MasterDataCache] Synchronized ${this.excludedStocksSet.size} excluded stocks in active memory.`);
  }

  /**
   * Get list of currently excluded stock symbols.
   */
  public getExcludedStocks(): string[] {
    return Array.from(this.excludedStocksSet).sort();
  }
}

// Global Singleton Instance
const globalForCache = global as unknown as { masterDataCache: MasterDataCacheService };
export const masterDataCache = globalForCache.masterDataCache || new MasterDataCacheService();
if (process.env.NODE_ENV !== 'production') globalForCache.masterDataCache = masterDataCache;
