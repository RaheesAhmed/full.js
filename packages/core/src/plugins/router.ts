import type { Plugin, PluginConfig, PluginHooks, RouteContext } from "./types";
import { createError, ErrorCodes } from "../errors";

export function createRouterPlugin(): Plugin {
  const config: PluginConfig = {
    name: "@full/plugin-router",
    version: "0.1.0",
    enabled: true,
  };

  const hooks: PluginHooks = {
    onInit: async () => {
      // Initialize router
    },
    onBeforeRoute: async (ctx: RouteContext) => {
      // Handle route transitions
    },
    onAfterRoute: async (ctx: RouteContext) => {
      // Update route state
    },
  };

  return {
    config,
    hooks,
    api: {} as any, // Will be injected by plugin manager
    context: {} as any, // Will be injected by plugin manager
  };
}

// Router implementation
class Router {
  private routes: Map<string, React.ComponentType> = new Map();
  private middleware: Array<
    (ctx: RouteContext, next: () => Promise<void>) => Promise<void>
  > = [];
  private currentRoute: RouteContext | null = null;
  private history: RouteContext[] = [];

  // Register a route
  register(path: string, component: React.ComponentType): void {
    if (this.routes.has(path)) {
      throw createError({
        code: ErrorCodes.ROUTE_ALREADY_EXISTS,
        message: `Route ${path} is already registered`,
        solution: "Use a different path or unregister the existing route first",
      });
    }
    this.routes.set(path, component);
  }

  // Add middleware
  use(
    fn: (ctx: RouteContext, next: () => Promise<void>) => Promise<void>
  ): void {
    this.middleware.push(fn);
  }

  // Navigate to route
  async navigate(
    path: string,
    options: { replace?: boolean } = {}
  ): Promise<void> {
    const route = this.routes.get(path);
    if (!route) {
      throw createError({
        code: ErrorCodes.ROUTE_NOT_FOUND,
        message: `Route ${path} not found`,
        solution: "Register the route before trying to navigate to it",
      });
    }

    const ctx: RouteContext = {
      path,
      params: this.extractParams(path),
      query: new URLSearchParams(window.location.search),
    };

    // Execute middleware chain
    await this.executeMiddleware(ctx);

    // Update history
    if (options.replace && this.currentRoute) {
      this.history[this.history.length - 1] = ctx;
    } else {
      this.history.push(ctx);
    }

    this.currentRoute = ctx;

    // Update URL
    if (options.replace) {
      window.history.replaceState(null, "", path);
    } else {
      window.history.pushState(null, "", path);
    }
  }

  // Get current route
  getCurrentRoute(): RouteContext | null {
    return this.currentRoute;
  }

  // Get route history
  getHistory(): RouteContext[] {
    return [...this.history];
  }

  // Private methods
  private async executeMiddleware(ctx: RouteContext): Promise<void> {
    let index = 0;
    const dispatch = async (): Promise<void> => {
      if (index >= this.middleware.length) return;
      return this.middleware[index++](ctx, dispatch);
    };
    await dispatch();
  }

  private extractParams(path: string): Record<string, string> {
    // Implementation will be added
    return {};
  }
}

// Export router instance
export const router = new Router();
