import type {
  Plugin,
  PluginConfig,
  PluginHooks,
  DataContext,
  CacheAPI,
} from "./types";
import { createError, ErrorCodes } from "../errors";

export function createDataPlugin(): Plugin {
  const config: PluginConfig = {
    name: "@full/plugin-data",
    version: "0.1.0",
    enabled: true,
  };

  const hooks: PluginHooks = {
    onInit: async () => {
      // Initialize data manager
      await dataManager.initialize();
    },
    onBeforeRoute: async (ctx) => {
      // Prefetch data for route
      await dataManager.prefetch(ctx.path);
    },
  };

  return {
    config,
    hooks,
    api: {} as any, // Will be injected by plugin manager
    context: {} as any, // Will be injected by plugin manager
  };
}

// Data manager implementation
class DataManager {
  private cache: Map<string, any> = new Map();
  private fetchers: Map<string, () => Promise<any>> = new Map();
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();
  private prefetchQueue: Set<string> = new Set();

  // Initialize
  async initialize(): Promise<void> {
    // Setup cache invalidation
    setInterval(() => this.invalidateCache(), 60000);
  }

  // Register data fetcher
  register<T>(key: string, fetcher: () => Promise<T>): void {
    if (this.fetchers.has(key)) {
      throw createError({
        code: ErrorCodes.FETCHER_ALREADY_EXISTS,
        message: `Fetcher for key ${key} already exists`,
        solution:
          "Use a different key or unregister the existing fetcher first",
      });
    }
    this.fetchers.set(key, fetcher);
  }

  // Fetch data
  async fetch<T>(key: string): Promise<T> {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }

    // Get fetcher
    const fetcher = this.fetchers.get(key);
    if (!fetcher) {
      throw createError({
        code: ErrorCodes.FETCHER_NOT_FOUND,
        message: `No fetcher registered for key ${key}`,
        solution: "Register a fetcher before attempting to fetch data",
      });
    }

    try {
      // Fetch data
      const data = await fetcher();

      // Cache result
      this.cache.set(key, data);

      // Notify subscribers
      this.notifySubscribers(key, data);

      return data;
    } catch (error) {
      throw createError({
        code: ErrorCodes.DATA_FETCH_FAILED,
        message: `Failed to fetch data for key ${key}`,
        details: error instanceof Error ? error.message : "Unknown error",
        solution: "Check the fetcher implementation and error handling",
      });
    }
  }

  // Mutate data
  async mutate<T>(key: string, data: T): Promise<void> {
    // Update cache
    this.cache.set(key, data);

    // Notify subscribers
    this.notifySubscribers(key, data);
  }

  // Subscribe to data changes
  subscribe<T>(key: string, callback: (data: T) => void): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key)?.add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.get(key)?.delete(callback);
      if (this.subscribers.get(key)?.size === 0) {
        this.subscribers.delete(key);
      }
    };
  }

  // Prefetch data for route
  async prefetch(path: string): Promise<void> {
    if (this.prefetchQueue.has(path)) return;
    this.prefetchQueue.add(path);

    try {
      // Get data dependencies for route
      const dependencies = this.getRouteDependencies(path);

      // Fetch all dependencies in parallel
      await Promise.all(dependencies.map((key) => this.fetch(key)));
    } finally {
      this.prefetchQueue.delete(path);
    }
  }

  // Get cache API
  getCacheAPI(): CacheAPI {
    return {
      get: <T>(key: string) => this.cache.get(key) as T | undefined,
      set: <T>(key: string, value: T) => this.cache.set(key, value),
      delete: (key: string) => this.cache.delete(key),
      clear: () => this.cache.clear(),
    };
  }

  // Private methods
  private invalidateCache(): void {
    // Implementation will be added
  }

  private notifySubscribers(key: string, data: any): void {
    this.subscribers.get(key)?.forEach((callback) => callback(data));
  }

  private getRouteDependencies(path: string): string[] {
    // Implementation will be added
    return [];
  }
}

// Export data manager instance
export const dataManager = new DataManager();
