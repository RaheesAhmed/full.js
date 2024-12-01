import type {
  DataContext,
  DataFetcher,
  DataOptions,
  DataResult,
  MutationOptions,
  RealtimeConfig
} from './types';
import { MemoryCache } from './cache';
import { GlobalStateManager } from './state';
import { WebSocketRealtimeManager } from './realtime';
import { createError, ErrorCodes } from '../errors';

export class DataManager {
  private cache: MemoryCache;
  private state: GlobalStateManager;
  private realtime: WebSocketRealtimeManager | null = null;
  private fetchers: Map<string, DataFetcher<unknown>> = new Map();

  constructor() {
    this.cache = new MemoryCache();
    this.state = new GlobalStateManager();
  }

  /**
   * Initialize realtime functionality
   */
  initializeRealtime(config: RealtimeConfig): void {
    if (config.enabled) {
      this.realtime = new WebSocketRealtimeManager(config);
      this.realtime.connect().catch(error => {
        console.error('Failed to initialize realtime:', error);
      });
    }
  }

  /**
   * Register a data fetcher
   */
  registerFetcher<T>(fetcher: DataFetcher<T>): void {
    this.fetchers.set(fetcher.key, fetcher as DataFetcher<unknown>);
  }

  /**
   * Fetch data with caching and real-time updates
   */
  async fetch<T>(
    key: string,
    options: DataOptions<T> = {}
  ): Promise<DataResult<T>> {
    const fetcher = this.fetchers.get(key) as DataFetcher<T> | undefined;
    
    if (!fetcher) {
      throw createError({
        code: ErrorCodes.FETCHER_NOT_FOUND,
        message: `No fetcher registered for key: ${key}`,
        solution: 'Register a fetcher before attempting to fetch data'
      });
    }

    try {
      // Check cache first
      if (options.cache) {
        const cached = this.cache.get<T>(key);
        if (cached && !cached.isStale) {
          return this.createResult(cached.data);
        }
      }

      // Fetch fresh data
      const data = await fetcher.fetch();

      // Validate data if needed
      if (fetcher.validate && !fetcher.validate(data)) {
        throw createError({
          code: ErrorCodes.DATA_VALIDATION_FAILED,
          message: `Data validation failed for key: ${key}`,
          solution: 'Check the data structure and validation rules'
        });
      }

      // Cache the result
      if (options.cache) {
        this.cache.set(key, {
          data,
          timestamp: Date.now(),
          ttl: typeof options.cache.strategy === 'number' 
            ? options.cache.strategy 
            : 300000, // 5 minutes default
          tags: options.cache.tags || [],
          isStale: false
        });
      }

      // Set up real-time updates if configured
      if (options.realtime && this.realtime) {
        this.setupRealtimeUpdates(key, options.realtime);
      }

      // Update state if configured
      if (options.state) {
        this.state.set(key, data, options.state);
      }

      return this.createResult(data);
    } catch (error) {
      throw createError({
        code: ErrorCodes.DATA_FETCH_FAILED,
        message: `Failed to fetch data for key: ${key}`,
        details: error instanceof Error ? error.message : 'Unknown error',
        solution: 'Check network connectivity and server status'
      });
    }
  }

  /**
   * Mutate data with optimistic updates
   */
  async mutate<T, R = void>(
    key: string,
    mutationFn: (data: T) => Promise<R>,
    options: MutationOptions<T, R> = {}
  ): Promise<R> {
    const currentData = this.cache.get<T>(key)?.data;
    let optimisticData: T | undefined;

    try {
      // Apply optimistic update if configured
      if (options.optimisticUpdate && currentData) {
        optimisticData = options.optimisticUpdate(currentData);
        this.cache.set(key, {
          data: optimisticData,
          timestamp: Date.now(),
          ttl: 0, // No caching for optimistic updates
          tags: [],
          isStale: true
        });
      }

      // Perform actual mutation
      const result = await mutationFn(currentData as T);

      // Handle success
      if (options.onSuccess) {
        options.onSuccess(result);
      }

      // Revalidate if needed
      if (options.revalidate) {
        await this.cache.revalidate([key]);
      }

      return result;
    } catch (error) {
      // Rollback optimistic update if needed
      if (options.rollbackOnError && currentData) {
        this.cache.set(key, {
          data: currentData,
          timestamp: Date.now(),
          ttl: 0,
          tags: [],
          isStale: true
        });
      }

      // Handle error
      if (options.onError) {
        options.onError(error instanceof Error ? error : new Error('Unknown error'));
      }

      throw error;
    }
  }

  private createResult<T>(data: T): DataResult<T> {
    return {
      data,
      error: null,
      isLoading: false,
      isValidating: false,
      mutate: async (newData?: T) => {
        // Implementation will be added
      },
      refresh: async () => {
        // Implementation will be added
      }
    };
  }

  private setupRealtimeUpdates(key: string, config: RealtimeConfig): void {
    if (!this.realtime || !config.enabled) {
      return;
    }

    const channel = config.channel || key;
    this.realtime.subscribe(
      channel,
      (data) => {
        this.cache.set(key, {
          data,
          timestamp: Date.now(),
          ttl: 0,
          tags: [],
          isStale: false
        });
      },
      {
        debounce: config.debounce,
        batch: config.batchUpdates
      }
    );
  }

  getContext(): DataContext {
    return {
      cache: this.cache,
      state: this.state,
      realtime: this.realtime!
    };
  }
}

// Create and export singleton instance
export const dataManager = new DataManager(); 