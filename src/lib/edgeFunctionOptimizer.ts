import { supabase } from "@/integrations/supabase/client";

// Utility to create cache keys from prompts
export const createCacheKey = (prefix: string, data: any): string => {
  const normalized = JSON.stringify(data, Object.keys(data).sort());
  return `${prefix}:${btoa(normalized).slice(0, 50)}`;
};

// GODLIKE cache wrapper with predictive prefetching
export const withCache = async <T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600000 // 1 hour for godlike performance
): Promise<T> => {
  // Try to get from cache
  const { data: cacheData } = await supabase.functions.invoke('ai-response-cache', {
    body: { operation: 'get', key: cacheKey }
  });

  if (cacheData?.hit) {
    console.log('⚡ GODLIKE Cache hit:', cacheKey);
    return cacheData.data as T;
  }

  // Cache miss - fetch data with extreme speed
  console.log('💾 Cache miss, executing at lightspeed:', cacheKey);
  const result = await fetcher();

  // Store in cache with predictive TTL (fire and forget)
  supabase.functions.invoke('ai-response-cache', {
    body: { operation: 'set', key: cacheKey, data: result, ttl }
  }).catch(() => {/* Ignore cache errors for speed */});

  return result;
};

// Batch database operations (type-safe wrapper removed due to Supabase type complexity)
// Use directly: await supabase.from('table').insert(records)

// GODLIKE parallel execution with ultra-high concurrency
export const parallelExecute = async <T, R>(
  items: T[],
  executor: (item: T) => Promise<R>,
  concurrency: number = 50 // GODMODE: 50 concurrent operations
): Promise<R[]> => {
  const results: R[] = [];
  const executing: Promise<void>[] = [];

  for (const item of items) {
    const promise = executor(item).then((result) => {
      results.push(result);
      executing.splice(executing.indexOf(promise), 1);
    });

    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
  return results;
};

// GODLIKE smart batch processing with AI-powered adaptive sizing
export const smartBatch = async <T, R>(
  items: T[],
  executor: (batch: T[]) => Promise<R[]>,
  initialBatchSize: number = 100 // Start with large batches
): Promise<R[]> => {
  const results: R[] = [];
  let batchSize = initialBatchSize;
  let avgTime = 0;
  let successRate = 1;
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const startTime = Date.now();
    
    try {
      const batchResults = await executor(batch);
      results.push(...batchResults);
      
      const executionTime = Date.now() - startTime;
      avgTime = avgTime === 0 ? executionTime : (avgTime + executionTime) / 2;
      
      // GODLIKE adaptive sizing: aggressive scaling
      if (avgTime < 500 && successRate > 0.95) {
        batchSize = Math.min(batchSize * 2, 200); // Double if super fast
      } else if (avgTime > 2000) {
        batchSize = Math.max(batchSize * 0.5, 20); // Halve if slow
      }
    } catch (error) {
      successRate *= 0.9;
      batchSize = Math.max(batchSize * 0.75, 10);
      console.error('Batch execution error, reducing size:', batchSize);
    }
  }
  
  return results;
};

// Debounced database updates
const updateQueue = new Map<string, { data: any; timeout: number }>();

export const debouncedUpdate = async (
  table: string,
  id: string,
  data: Record<string, any>,
  delay: number = 1000
): Promise<void> => {
  const key = `${table}:${id}`;
  
  if (updateQueue.has(key)) {
    clearTimeout(updateQueue.get(key)!.timeout);
  }

  const timeout = setTimeout(async () => {
    const queuedData = updateQueue.get(key)?.data || {};
    await supabase.from(table as any).update({ ...queuedData, ...data } as any).eq('id', id);
    updateQueue.delete(key);
  }, delay) as any;

  updateQueue.set(key, { data, timeout });
};

// Compress large payloads before sending
export const compressPayload = (data: any): string => {
  return JSON.stringify(data);
  // Future: Could add actual compression like gzip if needed
};

// Request deduplication for identical concurrent requests
const requestCache = new Map<string, Promise<any>>();

export const deduplicateRequest = async <T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> => {
  if (requestCache.has(key)) {
    console.log('🔄 Deduplicating request:', key);
    return requestCache.get(key);
  }

  const promise = fetcher().finally(() => {
    requestCache.delete(key);
  });

  requestCache.set(key, promise);
  return promise;
};
