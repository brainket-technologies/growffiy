import { Redis } from 'ioredis';

// Singleton instance to prevent multiple connections in dev mode (hot reloading)
const globalForRedis = global as unknown as { redis: Redis };

export const redis =
  globalForRedis.redis ||
  new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
    retryStrategy(times) {
      // Avoid hanging indefinitely if redis is not running locally.
      if (times > 3) {
        return null;
      }
      return Math.min(times * 50, 2000);
    }
  });

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

/**
 * Cache wrapper function
 * @param key Redis cache key
 * @param fetcher Function that returns data if cache misses
 * @param ttl Time-to-live in seconds (default 15 seconds for general APIs, enough to avoid spam)
 * @returns Cached or freshly fetched data
 */
export async function getCachedData<T>(key: string, fetcher: () => Promise<T>, ttl: number = 15): Promise<T> {
  // If Redis url is missing and not locally run, gracefully fallback
  if (!process.env.REDIS_URL && process.env.NODE_ENV === 'production') {
    return fetcher();
  }

  try {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }
  } catch (error) {
    console.error(`Redis cache GET error for key ${key}:`, error);
  }

  // If miss or error, fetch fresh data
  const data = await fetcher();

  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttl);
  } catch (error) {
    console.error(`Redis cache SET error for key ${key}:`, error);
  }

  return data;
}

export async function invalidateCache(keyPattern: string) {
  try {
    const keys = await redis.keys(keyPattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error(`Redis cache invalidation error for pattern ${keyPattern}:`, error);
  }
}
