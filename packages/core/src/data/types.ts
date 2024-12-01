import type { ReactNode } from 'react';

// Data fetching types
export interface DataFetcher<T> {
  fetch: () => Promise<T>;
  key: string;
  validate?: (data: T) => boolean;
}

// Cache configuration
export interface CacheConfig {
  strategy: CacheStrategy;
  ttl?: number;
  staleWhileRevalidate?: boolean;
  tags?: string[];
}

export type CacheStrategy = 
  | 'no-cache'
  | 'force-cache'
  | 'stale-while-revalidate'
  | 'revalidate-on-mount'
  | number;

// Cache entry
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  tags: string[];
  isStale: boolean;
}

// Real-time configuration
export interface RealtimeConfig {
  enabled: boolean;
  channel?: string;
  events?: string[];
  debounce?: number;
  batchUpdates?: boolean;
}

// State management types
export interface StateConfig<T> {
  initial: T;
  persist?: boolean;
  scope?: 'local' | 'session' | 'global';
  onChange?: (newValue: T, oldValue: T) => void;
}

// Data context
export interface DataContext {
  cache: DataCache;
  state: StateManager;
  realtime: RealtimeManager;
}

// Data hook result
export interface DataResult<T> {
  data: T | undefined;
  error: Error | null;
  isLoading: boolean;
  isValidating: boolean;
  mutate: (data?: T) => Promise<void>;
  refresh: () => Promise<void>;
}

// Data options
export interface DataOptions<T> {
  cache?: CacheConfig;
  realtime?: RealtimeConfig;
  state?: StateConfig<T>;
  suspense?: boolean;
  errorBoundary?: boolean;
}

// Mutation options
export interface MutationOptions<T, R> {
  optimisticUpdate?: (currentData: T) => T;
  rollbackOnError?: boolean;
  onSuccess?: (result: R) => void;
  onError?: (error: Error) => void;
  revalidate?: boolean;
}

// Subscribe options
export interface SubscribeOptions {
  debounce?: number;
  throttle?: number;
  batch?: boolean;
  onError?: (error: Error) => void;
}

// Data cache interface
export interface DataCache {
  get<T>(key: string): CacheEntry<T> | undefined;
  set<T>(key: string, entry: CacheEntry<T>): void;
  delete(key: string): void;
  clear(): void;
  revalidate(tags?: string[]): Promise<void>;
}

// State manager interface
export interface StateManager {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
  subscribe<T>(key: string, callback: (value: T) => void): () => void;
  persist<T>(key: string, value: T): void;
  hydrate(): void;
}

// Realtime manager interface
export interface RealtimeManager {
  subscribe(channel: string, callback: (data: unknown) => void): () => void;
  publish(channel: string, data: unknown): void;
  connect(): Promise<void>;
  disconnect(): void;
} 