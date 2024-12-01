import type { ReactNode } from 'react';
import type { PageConfig } from '../types';

// Route parameter types
export type RouteParams = Record<string, string | number>;

// Route segment types
export type RouteSegment = 
  | StaticSegment 
  | DynamicSegment 
  | CatchAllSegment 
  | OptionalSegment;

export interface StaticSegment {
  type: 'static';
  value: string;
}

export interface DynamicSegment {
  type: 'dynamic';
  name: string;
  pattern?: string;
}

export interface CatchAllSegment {
  type: 'catchAll';
  name: string;
}

export interface OptionalSegment {
  type: 'optional';
  name: string;
  pattern?: string;
}

// Middleware types
export interface Middleware {
  name: string;
  handler: MiddlewareHandler;
  phase?: 'before' | 'after';
}

export type MiddlewareHandler = (
  context: RouteContext,
  next: () => Promise<void>
) => Promise<void>;

// Route context
export interface RouteContext {
  params: RouteParams;
  query: URLSearchParams;
  pathname: string;
  data?: unknown;
}

// Route configuration
export interface RouteConfig {
  path: string;
  page?: PageConfig;
  layout?: ReactNode;
  middleware?: Middleware[];
  children?: RouteConfig[];
  group?: {
    middleware?: Middleware[];
    layout?: ReactNode;
  };
}

// Route match result
export interface RouteMatch {
  route: RouteConfig;
  params: RouteParams;
  score: number;
}

// Route tree node
export interface RouteNode {
  segment: RouteSegment;
  config?: RouteConfig;
  children: Map<string, RouteNode>;
  middleware: Middleware[];
  layout?: ReactNode;
}

// File-based routing types
export interface FileRoute {
  relativePath: string;
  absolutePath: string;
  route: string;
  isPage: boolean;
  isLayout: boolean;
  isMiddleware: boolean;
} 