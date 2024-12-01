import type { DataCache, CacheEntry, CacheConfig } from './types';
import { createError, ErrorCodes } from '../errors';

export class MemoryCache implements DataCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private revalidationQueue: Set<string> = new Set();
  private isRevalidating = false;

  get<T>(key: string): CacheEntry<T> | undefined {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    
    if (!entry) {
      return undefined;
    }

    // Check if entry is expired
    if (this.isExpired(entry)) {
      this.delete(key);
      return undefined;
    }

    // Check if entry is stale
    if (this.isStale(entry)) {
      entry.isStale = true;
      this.queueRevalidation(key);
    }

    return entry;
  }

  set<T>(key: string, entry: CacheEntry<T>): void {
    this.cache.set(key, entry as CacheEntry<unknown>);
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  async revalidate(tags?: string[]): Promise<void> {
    if (this.isRevalidating) {
      return;
    }

    this.isRevalidating = true;

    try {
      const entries = Array.from(this.cache.entries());
      const toRevalidate = tags
        ? entries.filter(([_, entry]) => 
            tags.some(tag => entry.tags.includes(tag))
          )
        : entries;

      await Promise.all(
        toRevalidate.map(async ([key, entry]) => {
          try {
            // Implementation will be added when data fetcher is available
            this.revalidationQueue.delete(key);
          } catch (error) {
            throw createError({
              code: ErrorCodes.CACHE_REVALIDATION_FAILED,
              message: `Failed to revalidate cache entry: ${key}`,
              details: error instanceof Error ? error.message : 'Unknown error',
              solution: 'Check data fetcher implementation and network connectivity'
            });
          }
        })
      );
    } finally {
      this.isRevalidating = false;
    }
  }

  private isExpired(entry: CacheEntry<unknown>): boolean {
    if (entry.ttl === 0) return false;
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private isStale(entry: CacheEntry<unknown>): boolean {
    if (!entry.ttl) return false;
    const staleTime = entry.ttl * 0.75; // 75% of TTL
    return Date.now() - entry.timestamp > staleTime;
  }

  private queueRevalidation(key: string): void {
    if (this.revalidationQueue.has(key)) {
      return;
    }

    this.revalidationQueue.add(key);
    
    // Debounce revalidation to avoid thundering herd
    setTimeout(() => {
      if (this.revalidationQueue.size > 0) {
        this.revalidate();
      }
    }, 100);
  }
}

export function createCacheEntry<T>(
  data: T,
  config: CacheConfig
): CacheEntry<T> {
  return {
    data,
    timestamp: Date.now(),
    ttl: typeof config.strategy === 'number' 
      ? config.strategy 
      : getTTLFromStrategy(config.strategy),
    tags: config.tags || [],
    isStale: false
  };
}

function getTTLFromStrategy(strategy: string): number {
  switch (strategy) {
    case 'no-cache':
      return 0;
    case 'force-cache':
      return Infinity;
    case 'stale-while-revalidate':
      return 60 * 1000; // 1 minute
    case 'revalidate-on-mount':
      return 0;
    default:
      return 300 * 1000; // 5 minutes
  }
} 