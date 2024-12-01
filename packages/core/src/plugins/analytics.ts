import type { Plugin, PluginConfig, PluginHooks, RouteContext } from "./types";
import { createError, ErrorCodes } from "../errors";

export function createAnalyticsPlugin(): Plugin {
  const config: PluginConfig = {
    name: "@full/plugin-analytics",
    version: "0.1.0",
    enabled: true,
  };

  const hooks: PluginHooks = {
    onInit: async () => {
      // Initialize analytics manager
      await analyticsManager.initialize();
    },
    onBeforeRoute: async (ctx: RouteContext) => {
      // Track page view
      await analyticsManager.trackPageView(ctx);
    },
    onError: async (error, ctx) => {
      // Track error
      await analyticsManager.trackError(error, ctx);
    },
  };

  return {
    config,
    hooks,
    api: {} as any, // Will be injected by plugin manager
    context: {} as any, // Will be injected by plugin manager
  };
}

// Analytics manager implementation
class AnalyticsManager {
  private providers: Map<string, AnalyticsProvider> = new Map();
  private queue: AnalyticsEvent[] = [];
  private isInitialized = false;
  private batchSize = 10;
  private flushInterval = 5000;

  // Initialize
  async initialize(): Promise<void> {
    // Register default providers
    this.registerDefaultProviders();

    // Start queue processing
    this.startQueueProcessing();

    this.isInitialized = true;
  }

  // Track page view
  async trackPageView(ctx: RouteContext): Promise<void> {
    const event: PageViewEvent = {
      type: "pageview",
      path: ctx.path,
      timestamp: Date.now(),
      params: ctx.params,
      query: Object.fromEntries(ctx.query.entries()),
    };

    await this.track(event);
  }

  // Track error
  async trackError(error: Error, ctx?: ErrorContext): Promise<void> {
    const event: ErrorEvent = {
      type: "error",
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      timestamp: Date.now(),
      context: ctx,
    };

    await this.track(event);
  }

  // Track custom event
  async trackEvent(name: string, data: Record<string, unknown>): Promise<void> {
    const event: CustomEvent = {
      type: "custom",
      name,
      data,
      timestamp: Date.now(),
    };

    await this.track(event);
  }

  // Register analytics provider
  registerProvider(name: string, provider: AnalyticsProvider): void {
    if (this.providers.has(name)) {
      throw createError({
        code: ErrorCodes.PROVIDER_ALREADY_EXISTS,
        message: `Analytics provider ${name} already exists`,
        solution:
          "Use a different name or unregister the existing provider first",
      });
    }
    this.providers.set(name, provider);
  }

  // Private methods
  private async track(event: AnalyticsEvent): Promise<void> {
    if (!this.isInitialized) {
      throw createError({
        code: ErrorCodes.ANALYTICS_NOT_INITIALIZED,
        message: "Analytics manager is not initialized",
        solution: "Wait for initialization to complete before tracking events",
      });
    }

    // Add to queue
    this.queue.push(event);

    // Flush if queue is full
    if (this.queue.length >= this.batchSize) {
      await this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    const promises = Array.from(this.providers.values()).map((provider) =>
      provider.send(events)
    );

    try {
      await Promise.all(promises);
    } catch (error) {
      // Put events back in queue
      this.queue.unshift(...events);
      throw createError({
        code: ErrorCodes.ANALYTICS_SEND_FAILED,
        message: "Failed to send analytics events",
        details: error instanceof Error ? error.message : "Unknown error",
        solution: "Events will be retried on next flush",
      });
    }
  }

  private startQueueProcessing(): void {
    setInterval(() => {
      this.flush().catch(() => {
        // Errors are handled in flush()
      });
    }, this.flushInterval);
  }

  private registerDefaultProviders(): void {
    // Register built-in providers
    this.registerProvider("console", new ConsoleProvider());
    this.registerProvider("memory", new MemoryProvider());
  }
}

// Analytics interfaces
interface AnalyticsEvent {
  type: string;
  timestamp: number;
}

interface PageViewEvent extends AnalyticsEvent {
  type: "pageview";
  path: string;
  params: Record<string, string>;
  query: Record<string, string>;
}

interface ErrorEvent extends AnalyticsEvent {
  type: "error";
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  context?: ErrorContext;
}

interface CustomEvent extends AnalyticsEvent {
  type: "custom";
  name: string;
  data: Record<string, unknown>;
}

interface AnalyticsProvider {
  send(events: AnalyticsEvent[]): Promise<void>;
}

// Built-in providers
class ConsoleProvider implements AnalyticsProvider {
  async send(events: AnalyticsEvent[]): Promise<void> {
    events.forEach((event) => {
      console.log("[Analytics]", event);
    });
  }
}

class MemoryProvider implements AnalyticsProvider {
  private events: AnalyticsEvent[] = [];

  async send(events: AnalyticsEvent[]): Promise<void> {
    this.events.push(...events);
  }

  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }
}

// Export analytics manager instance
export const analyticsManager = new AnalyticsManager();
