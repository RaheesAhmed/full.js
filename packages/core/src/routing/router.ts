import type { RouteConfig, RouteNode, RouteContext, Middleware } from './types';
import { parseRoute } from './parser';
import { matchRoute, validateMatch } from './matcher';
import { MiddlewareChain, builtInMiddlewares } from './middleware';
import { createError, ErrorCodes } from '../errors';

export class Router {
  private routeTree: RouteNode;
  private middlewareChain: MiddlewareChain;

  constructor() {
    // Initialize empty route tree
    this.routeTree = {
      segment: { type: 'static', value: '' },
      children: new Map(),
      middleware: []
    };

    // Initialize middleware chain with built-in middlewares
    this.middlewareChain = new MiddlewareChain();
    this.middlewareChain.add(builtInMiddlewares.errorBoundary);
    this.middlewareChain.add(builtInMiddlewares.timing);
    this.middlewareChain.add(builtInMiddlewares.logger);
  }

  /**
   * Add a route to the router
   */
  addRoute(config: RouteConfig): void {
    const segments = parseRoute(config.path);
    let current = this.routeTree;

    for (const segment of segments) {
      const key = segment.type === 'static' ? segment.value : segment.type;
      let child = current.children.get(key);

      if (!child) {
        child = {
          segment,
          children: new Map(),
          middleware: []
        };
        current.children.set(key, child);
      }

      current = child;
    }

    // Add route configuration
    current.config = config;

    // Add route-specific middleware
    if (config.middleware) {
      current.middleware.push(...config.middleware);
    }

    // Add group middleware if present
    if (config.group?.middleware) {
      current.middleware.push(...config.group.middleware);
    }
  }

  /**
   * Add middleware to the global chain
   */
  use(middleware: Middleware): void {
    this.middlewareChain.add(middleware);
  }

  /**
   * Match and execute a route
   */
  async execute(pathname: string): Promise<void> {
    // Find matching route
    const match = matchRoute(pathname, this.routeTree);
    if (!match) {
      throw createError({
        code: ErrorCodes.ROUTE_NOT_FOUND,
        message: `No route found for path: ${pathname}`,
        solution: 'Check the route configuration and URL'
      });
    }

    // Validate the match
    validateMatch(match);

    // Create route context
    const context: RouteContext = {
      params: match.params,
      query: new URLSearchParams(window.location.search),
      pathname
    };

    // Execute middleware chain
    try {
      await this.middlewareChain.execute(context);
    } catch (error) {
      throw createError({
        code: ErrorCodes.ROUTE_EXECUTION_FAILED,
        message: 'Route execution failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        solution: 'Check route configuration and middleware chain'
      });
    }

    return context;
  }

  /**
   * Create a route group
   */
  group(options: RouteConfig['group'], routes: RouteConfig[]): RouteConfig[] {
    return routes.map(route => ({
      ...route,
      group: options,
      middleware: [...(options?.middleware || []), ...(route.middleware || [])],
      layout: options?.layout || route.layout
    }));
  }
} 