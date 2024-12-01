import type { ReactNode, ComponentType, PropsWithChildren } from 'react';
import type { OptimizeConfig } from '../types';

// Base component types
export interface ComponentConfig<P = {}> {
  name: string;
  render: (props: P) => ReactNode;
  optimize?: OptimizeConfig;
}

// Component options
export interface ComponentOptions {
  displayName?: string;
  memo?: boolean;
  errorBoundary?: boolean;
  suspense?: boolean;
  ssr?: boolean;
}

// Higher-order component types
export type HOC<InProps = any, OutProps = InProps> = (
  WrappedComponent: ComponentType<InProps>
) => ComponentType<OutProps>;

// Component context
export interface ComponentContext {
  name: string;
  props: Record<string, unknown>;
  children?: ReactNode;
  parent?: string;
}

// Error boundary props
export interface ErrorBoundaryProps {
  fallback?: ReactNode | ((error: Error) => ReactNode);
  onError?: (error: Error) => void;
}

// Suspense boundary props
export interface SuspenseBoundaryProps {
  fallback?: ReactNode;
  maxDuration?: number;
}

// Component event handlers
export interface ComponentEvents<T = unknown> {
  onMount?: () => void | (() => void);
  onUpdate?: (prev: T, next: T) => void;
  onUnmount?: () => void;
  onError?: (error: Error) => void;
}

// Style types
export interface StyleConfig {
  base?: string;
  variants?: Record<string, Record<string, string>>;
  compounds?: Record<string, string>;
  states?: Record<string, string>;
  responsive?: Record<string, string>;
}

// Animation types
export interface AnimationConfig {
  enter?: string;
  exit?: string;
  duration?: number;
  delay?: number;
  easing?: string;
}

// Component metadata
export interface ComponentMeta {
  name: string;
  description?: string;
  props?: Record<string, PropMeta>;
  examples?: string[];
  version?: string;
}

// Prop metadata
export interface PropMeta {
  type: string;
  required?: boolean;
  default?: unknown;
  description?: string;
  validation?: (value: unknown) => boolean;
} 