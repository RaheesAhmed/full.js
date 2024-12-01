import type { ReactNode } from 'react';

// Base configurations
export interface BaseConfig {
  name: string;
}

// Page types
export interface PageConfig extends BaseConfig {
  data?: DataConfig<unknown>;
  secure?: SecurityConfig;
  optimize?: OptimizeConfig;
}

// Component types
export interface ComponentConfig extends BaseConfig {
  render: (props: any) => ReactNode;
  optimize?: OptimizeConfig;
}

// Data management types
export interface DataConfig<T> {
  fetch: () => Promise<T>;
  cache?: CacheStrategy;
  validate?: (data: T) => boolean;
  realtime?: boolean;
}

// Security types
export interface SecurityConfig {
  auth?: boolean | AuthConfig;
  csrf?: boolean;
  headers?: HeadersConfig;
}

// Optimization types
export interface OptimizeConfig {
  lazy?: boolean;
  prefetch?: boolean;
  cache?: CacheStrategy;
}

// Cache strategies
export type CacheStrategy = 
  | 'no-cache'
  | 'force-cache'
  | 'stale-while-revalidate'
  | number;

// Auth configuration
export interface AuthConfig {
  type: 'jwt' | 'session';
  roles?: string[];
  redirect?: string;
}

// Headers configuration
export interface HeadersConfig {
  'Content-Security-Policy'?: string;
  'Strict-Transport-Security'?: string;
  'X-Frame-Options'?: string;
  'X-Content-Type-Options'?: string;
  [key: string]: string | undefined;
}

// Error types
export interface FullError extends Error {
  code: string;
  details?: unknown;
  solution?: string;
} 