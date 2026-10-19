export function batchArray<T>(arr: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    batches.push(arr.slice(i, i + size));
  }
  return batches;
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function todayDateKey(): string {
  return new Date().toLocaleDateString();
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export async function concurrentMap<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency: number,
  timeoutMs: number = 0
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;

  const worker = async (): Promise<void> => {
    while (index < items.length) {
      const i = index++;
      try {
        const task = timeoutMs > 0
          ? Promise.race([
              fn(items[i]),
              new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs))
            ])
          : fn(items[i]);
        results[i] = await task;
      } catch {
        results[i] = undefined as any;
      }
    }
  };

  const workerCount = Math.min(Math.max(1, concurrency), items.length);
  const workers = Array.from({ length: workerCount }, () => worker());
  await Promise.allSettled(workers);
  return results;
}
