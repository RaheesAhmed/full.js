import { RuntimeConfig } from "../types";
import compression from "compression";

export class RuntimeOptimizer {
  private config: RuntimeConfig;
  private cache: Map<string, { data: any; expires: number }>;

  constructor(config: RuntimeConfig) {
    this.config = config;
    this.cache = new Map();
  }

  // Caching implementation
  async cacheData<T>(key: string, data: T, ttl?: number): Promise<void> {
    if (!this.config.caching.enabled) return;

    const expires = Date.now() + (ttl || this.config.caching.ttl || 3600000);
    this.cache.set(key, { data, expires });

    // Implement cache invalidation
    if (this.config.caching.invalidation?.automatic) {
      setTimeout(() => {
        this.cache.delete(key);
      }, expires - Date.now());
    }
  }

  async getCachedData<T>(key: string): Promise<T | null> {
    if (!this.config.caching.enabled) return null;

    const cached = this.cache.get(key);
    if (!cached) return null;

    if (cached.expires <= Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  // Lazy loading implementation
  createLazyComponent(
    importFn: () => Promise<any>,
    options: {
      threshold?: number;
      preload?: boolean;
      placeholder?: React.ComponentType;
    } = {}
  ) {
    if (!this.config.lazyLoading.enabled) {
      return importFn();
    }

    const threshold =
      options.threshold || this.config.lazyLoading.threshold || 0;
    const preload = options.preload ?? this.config.lazyLoading.preload;
    const placeholder = options.placeholder;

    return {
      component: React.lazy(importFn),
      preload: preload ? () => importFn() : undefined,
      placeholder,
    };
  }

  // Prefetching implementation
  setupPrefetching(): void {
    if (!this.config.prefetching.enabled) return;

    const { strategy, threshold, timeout, maxConcurrent } =
      this.config.prefetching;

    switch (strategy) {
      case "hover":
        this.setupHoverPrefetching();
        break;
      case "viewport":
        this.setupViewportPrefetching(threshold);
        break;
      case "eager":
        this.setupEagerPrefetching(maxConcurrent);
        break;
    }
  }

  private setupHoverPrefetching(): void {
    document.addEventListener("mouseover", (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "A" && target.dataset.prefetch) {
        const href = target.getAttribute("href");
        if (href) {
          this.prefetchResource(href);
        }
      }
    });
  }

  private setupViewportPrefetching(threshold = 0): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            if (target.dataset.prefetch) {
              this.prefetchResource(target.dataset.prefetch);
            }
          }
        });
      },
      { threshold }
    );

    document.querySelectorAll("[data-prefetch]").forEach((el) => {
      observer.observe(el);
    });
  }

  private setupEagerPrefetching(maxConcurrent = 3): void {
    const prefetchQueue = Array.from(
      document.querySelectorAll("[data-prefetch]")
    ).map((el) => el.getAttribute("data-prefetch"));

    const processBatch = async () => {
      const batch = prefetchQueue.splice(0, maxConcurrent);
      await Promise.all(batch.map((url) => url && this.prefetchResource(url)));
      if (prefetchQueue.length > 0) {
        processBatch();
      }
    };

    processBatch();
  }

  private async prefetchResource(url: string): Promise<void> {
    try {
      if (url.endsWith(".js")) {
        const link = document.createElement("link");
        link.rel = "prefetch";
        link.href = url;
        document.head.appendChild(link);
      } else {
        await fetch(url, { method: "GET", mode: "cors" });
      }
    } catch (error) {
      console.warn(`Failed to prefetch ${url}:`, error);
    }
  }

  // Resource hints implementation
  applyResourceHints(): void {
    if (!this.config.resourceHints.enabled) return;

    const { preconnect, prefetch, preload, prerender } =
      this.config.resourceHints;

    // Add preconnect hints
    preconnect?.forEach((url) => {
      const link = document.createElement("link");
      link.rel = "preconnect";
      link.href = url;
      document.head.appendChild(link);
    });

    // Add prefetch hints
    prefetch?.forEach((url) => {
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.href = url;
      document.head.appendChild(link);
    });

    // Add preload hints
    preload?.forEach(({ url, as, type, crossorigin }) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.href = url;
      link.as = as;
      if (type) link.type = type;
      if (crossorigin) link.crossOrigin = "";
      document.head.appendChild(link);
    });

    // Add prerender hints
    prerender?.forEach((url) => {
      const link = document.createElement("link");
      link.rel = "prerender";
      link.href = url;
      document.head.appendChild(link);
    });
  }

  // Compression middleware
  getCompressionMiddleware() {
    return compression({
      level: 6,
      threshold: 1024,
      filter: (req, res) => {
        if (req.headers["x-no-compression"]) {
          return false;
        }
        return compression.filter(req, res);
      },
    });
  }
}
