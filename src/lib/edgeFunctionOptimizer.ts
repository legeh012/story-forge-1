import { supabase } from "@/integrations/supabase/client";

// Utility to create cache keys from prompts
export const createCacheKey = (prefix: string, data: any): string => {
  const normalized = JSON.stringify(data, Object.keys(data).sort());
  return `${prefix}:${btoa(normalized).slice(0, 50)}`;
};

// Cache wrapper for AI responses
export const withCache = async <T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  ttl: number = 300000 // 5 minutes default
): Promise<T> => {
  // Try to get from cache
  const { data: cacheData } = await supabase.functions.invoke('ai-response-cache', {
    body: { operation: 'get', key: cacheKey }
  });

  if (cacheData?.hit) {
    console.log('⚡ Cache hit:', cacheKey);
    return cacheData.data as T;
  }

  // Cache miss - fetch data
  console.log('💾 Cache miss, fetching:', cacheKey);
  const result = await fetcher();

  // Store in cache (fire and forget)
  supabase.functions.invoke('ai-response-cache', {
    body: { operation: 'set', key: cacheKey, data: result, ttl }
  });

  return result;
};

// Batch database operations (type-safe wrapper removed due to Supabase type complexity)
// Use directly: await supabase.from('table').insert(records)

// Parallel execution with concurrency limit
export const parallelExecute = async <T, R>(
  items: T[],
  executor: (item: T) => Promise<R>,
  concurrency: number = 5
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
