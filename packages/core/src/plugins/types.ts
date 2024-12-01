import type { ReactNode } from "react";

// Plugin lifecycle hooks
export interface PluginHooks {
  onInit?: () => void | Promise<void>;
  onBeforeRender?: (ctx: RenderContext) => void | Promise<void>;
  onAfterRender?: (ctx: RenderContext) => void | Promise<void>;
  onBeforeRoute?: (ctx: RouteContext) => void | Promise<void>;
  onAfterRoute?: (ctx: RouteContext) => void | Promise<void>;
  onError?: (error: Error, ctx: ErrorContext) => void | Promise<void>;
  onDestroy?: () => void | Promise<void>;
}

// Plugin configuration
export interface PluginConfig {
  name: string;
  version: string;
  dependencies?: string[];
  enabled?: boolean;
  options?: Record<string, unknown>;
}

// Plugin API
export interface PluginAPI {
  // Core functionality
  registerHook: (
    hook: keyof PluginHooks,
    callback: PluginHooks[keyof PluginHooks]
  ) => void;
  registerMiddleware: (middleware: Middleware) => void;
  registerComponent: (
    name: string,
    component: React.ComponentType<any>
  ) => void;
  registerRoute: (path: string, component: React.ComponentType<any>) => void;

  // State management
  getState: <T>(key: string) => T | undefined;
  setState: <T>(key: string, value: T) => void;
  subscribe: <T>(key: string, callback: (value: T) => void) => () => void;

  // Utilities
  logger: Logger;
  config: PluginConfig;
  context: PluginContext;
}

// Plugin context
export interface PluginContext {
  app: AppContext;
  router: RouterContext;
  data: DataContext;
  security: SecurityContext;
}

// Plugin instance
export interface Plugin {
  config: PluginConfig;
  hooks: PluginHooks;
  api: PluginAPI;
  context: PluginContext;
}

// Context types
export interface RenderContext {
  component: ReactNode;
  props: Record<string, unknown>;
  path: string;
}

export interface RouteContext {
  path: string;
  params: Record<string, string>;
  query: URLSearchParams;
  data?: unknown;
}

export interface ErrorContext {
  error: Error;
  component?: ReactNode;
  path?: string;
}

// Logger interface
export interface Logger {
  debug: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}

// Middleware type
export interface Middleware {
  name: string;
  handler: (ctx: RouteContext, next: () => Promise<void>) => Promise<void>;
}

// Context types
export interface AppContext {
  env: "development" | "production" | "test";
  version: string;
  root: HTMLElement | null;
}

export interface RouterContext {
  current: RouteContext;
  history: RouteContext[];
  navigate: (path: string) => Promise<void>;
}

export interface DataContext {
  cache: CacheAPI;
  fetch: <T>(key: string) => Promise<T>;
  mutate: <T>(key: string, data: T) => Promise<void>;
}

export interface SecurityContext {
  user?: unknown;
  isAuthenticated: boolean;
  permissions: string[];
  token?: string;
}

// Cache API
export interface CacheAPI {
  get: <T>(key: string) => T | undefined;
  set: <T>(key: string, value: T, ttl?: number) => void;
  delete: (key: string) => void;
  clear: () => void;
}
