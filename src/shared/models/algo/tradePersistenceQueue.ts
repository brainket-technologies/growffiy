import crypto from 'crypto';
import { prisma } from '@/database/db';

export class TradePersistenceQueueService {
  private queue: any[] = [];
  private inMemoryTradesById: Map<string, any> = new Map();
  private isFlushing = false;
  private flushIntervalTimer: any = null;
  private readonly BATCH_SIZE = 100;
  private readonly FLUSH_INTERVAL_MS = 250; // Flushes every 250ms

  constructor() {
    this.startWorker();
  }

  private startWorker() {
    if (this.flushIntervalTimer) return;
    this.flushIntervalTimer = setInterval(() => {
      this.flush().catch(err => {
        console.error('[TradePersistenceQueue] Error during auto-flush:', err);
      });
    }, this.FLUSH_INTERVAL_MS);
  }

  /**
   * Enqueue a new trade for asynchronous bulk persistence.
   * Returns pre-assigned UUID in RAM (< 0.001ms) so the trading loop never waits for DB disk I/O.
   */
  public enqueue(tradeData: any): string {
    const tradeId = tradeData.id || crypto.randomUUID();
    const preparedData = {
      ...tradeData,
      id: tradeId,
      createdAt: tradeData.createdAt || new Date(),
      updatedAt: tradeData.updatedAt || new Date()
    };

    this.inMemoryTradesById.set(tradeId, preparedData);
    this.queue.push(preparedData);

    // If buffer threshold reached, trigger immediate flush
    if (this.queue.length >= this.BATCH_SIZE) {
      this.flush().catch(() => {});
    }

    return tradeId;
  }

  /**
   * Bulk insert pending trades into PostgreSQL via createMany.
   */
  public async flush(): Promise<void> {
    if (this.isFlushing || this.queue.length === 0) return;
    this.isFlushing = true;

    // Take current slice of trades to insert
    const batch = this.queue.splice(0, this.BATCH_SIZE);

    try {
      await prisma.trade.createMany({
        data: batch,
        skipDuplicates: true
      });
      console.log(`[TradePersistenceQueue] Bulk inserted ${batch.length} trades into PostgreSQL (Queue remaining: ${this.queue.length}).`);
    } catch (err) {
      console.error(`[TradePersistenceQueue] Failed to bulk insert ${batch.length} trades:`, err);
      // Re-insert into queue for retry
      this.queue.unshift(...batch);
    } finally {
      this.isFlushing = false;
      // Keep in-memory cache bounded to last 10,000 trades
      if (this.inMemoryTradesById.size > 10000) {
        const keysToDelete = Array.from(this.inMemoryTradesById.keys()).slice(0, 2000);
        for (const k of keysToDelete) {
          this.inMemoryTradesById.delete(k);
        }
      }
    }
  }

  /**
   * Get trade by ID (In-memory fast lookup first, fallback to DB).
   */
  public async getTrade(tradeId: string): Promise<any> {
    if (this.inMemoryTradesById.has(tradeId)) {
      return this.inMemoryTradesById.get(tradeId);
    }
    return prisma.trade.findUnique({ where: { id: tradeId } });
  }

  /**
   * Stop worker on shutdown.
   */
  public stop() {
    if (this.flushIntervalTimer) {
      clearInterval(this.flushIntervalTimer);
      this.flushIntervalTimer = null;
    }
  }
}

// Global Singleton Instance
const globalForQueue = global as unknown as { tradePersistenceQueue: TradePersistenceQueueService };
export const tradePersistenceQueue = globalForQueue.tradePersistenceQueue || new TradePersistenceQueueService();
if (process.env.NODE_ENV !== 'production') globalForQueue.tradePersistenceQueue = tradePersistenceQueue;
