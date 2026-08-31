import { LRUCache } from 'lru-cache';

export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  delPattern(pattern: string): Promise<void>;
}

/**
 * In-memory LRU Cache implementation for V1 single-instance backend.
 * Can be swapped with RedisCacheService in V2 with zero changes to business logic.
 */
export class MemoryCacheService implements ICacheService {
  private cache: LRUCache<string, any>;

  constructor(maxItems = 1000, defaultTtlMs = 60 * 1000) {
    this.cache = new LRUCache({
      max: maxItems,
      ttl: defaultTtlMs,
    });
  }

  async get<T>(key: string): Promise<T | null> {
    const val = this.cache.get(key);
    return (val as T) ?? null;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds ? ttlSeconds * 1000 : undefined;
    this.cache.set(key, value, { ttl });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async delPattern(pattern: string): Promise<void> {
    const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}

export const cacheService = new MemoryCacheService();
