import { BuildOptimizer } from "./build";
import { RuntimeOptimizer } from "./runtime";
import type {
  BuildConfig,
  RuntimeConfig,
  PerformanceConfig,
  OptimizationResult,
  PerformanceMetrics,
} from "./types";

// Export types
export type {
  BuildConfig,
  RuntimeConfig,
  PerformanceConfig,
  OptimizationResult,
  PerformanceMetrics,
};

// Default configuration
export const defaultConfig: PerformanceConfig = {
  build: {
    codeSplitting: {
      enabled: true,
      chunks: "async",
      minSize: 20000,
      maxSize: 50000,
    },
    treeShaking: {
      enabled: true,
      sideEffects: true,
    },
    bundleAnalysis: {
      enabled: true,
      reportFilename: "bundle-analysis.html",
      openAnalyzer: false,
      generateStatsFile: true,
    },
    assetOptimization: {
      enabled: true,
      images: {
        compress: true,
        quality: 85,
        formats: ["webp", "avif"],
      },
      fonts: {
        preload: true,
        formats: ["woff2", "woff"],
        display: "swap",
      },
      css: {
        minify: true,
        purge: true,
        modules: true,
      },
    },
  },
  runtime: {
    caching: {
      enabled: true,
      strategy: "memory",
      ttl: 3600000,
      maxSize: 100,
      invalidation: {
        automatic: true,
        interval: 300000,
      },
    },
    lazyLoading: {
      enabled: true,
      threshold: 0.1,
      preload: true,
      placeholder: true,
    },
    prefetching: {
      enabled: true,
      strategy: "viewport",
      threshold: 0.2,
      timeout: 2000,
      maxConcurrent: 3,
    },
    resourceHints: {
      enabled: true,
      preconnect: [],
      prefetch: [],
      preload: [],
      prerender: [],
    },
  },
};

// Performance optimization class
export class Performance {
  private buildOptimizer: BuildOptimizer;
  private runtimeOptimizer: RuntimeOptimizer;

  constructor(config: Partial<PerformanceConfig> = {}) {
    const mergedConfig = this.mergeConfig(config);
    this.buildOptimizer = new BuildOptimizer(mergedConfig.build);
    this.runtimeOptimizer = new RuntimeOptimizer(mergedConfig.runtime);
  }

  // Merge user config with default config
  private mergeConfig(config: Partial<PerformanceConfig>): PerformanceConfig {
    return {
      build: {
        ...defaultConfig.build,
        ...config.build,
        codeSplitting: {
          ...defaultConfig.build.codeSplitting,
          ...config.build?.codeSplitting,
        },
        treeShaking: {
          ...defaultConfig.build.treeShaking,
          ...config.build?.treeShaking,
        },
        bundleAnalysis: {
          ...defaultConfig.build.bundleAnalysis,
          ...config.build?.bundleAnalysis,
        },
        assetOptimization: {
          ...defaultConfig.build.assetOptimization,
          ...config.build?.assetOptimization,
          images: {
            ...defaultConfig.build.assetOptimization.images,
            ...config.build?.assetOptimization?.images,
          },
          fonts: {
            ...defaultConfig.build.assetOptimization.fonts,
            ...config.build?.assetOptimization?.fonts,
          },
          css: {
            ...defaultConfig.build.assetOptimization.css,
            ...config.build?.assetOptimization?.css,
          },
        },
      },
      runtime: {
        ...defaultConfig.runtime,
        ...config.runtime,
        caching: {
          ...defaultConfig.runtime.caching,
          ...config.runtime?.caching,
          invalidation: {
            ...defaultConfig.runtime.caching.invalidation,
            ...config.runtime?.caching?.invalidation,
          },
        },
        lazyLoading: {
          ...defaultConfig.runtime.lazyLoading,
          ...config.runtime?.lazyLoading,
        },
        prefetching: {
          ...defaultConfig.runtime.prefetching,
          ...config.runtime?.prefetching,
        },
        resourceHints: {
          ...defaultConfig.runtime.resourceHints,
          ...config.runtime?.resourceHints,
        },
      },
    };
  }

  // Build optimization methods
  async optimize(): Promise<OptimizationResult> {
    return this.buildOptimizer.optimize();
  }

  // Runtime optimization methods
  async cacheData<T>(key: string, data: T, ttl?: number): Promise<void> {
    return this.runtimeOptimizer.cacheData(key, data, ttl);
  }

  async getCachedData<T>(key: string): Promise<T | null> {
    return this.runtimeOptimizer.getCachedData(key);
  }

  createLazyComponent(
    importFn: () => Promise<any>,
    options?: {
      threshold?: number;
      preload?: boolean;
      placeholder?: React.ComponentType;
    }
  ) {
    return this.runtimeOptimizer.createLazyComponent(importFn, options);
  }

  setupPrefetching(): void {
    this.runtimeOptimizer.setupPrefetching();
  }

  applyResourceHints(): void {
    this.runtimeOptimizer.applyResourceHints();
  }

  getCompressionMiddleware() {
    return this.runtimeOptimizer.getCompressionMiddleware();
  }
}

// Create performance instance with default config
export const performance = new Performance();

// Factory function for creating performance instances
export function createPerformance(config: Partial<PerformanceConfig> = {}) {
  return new Performance(config);
}
