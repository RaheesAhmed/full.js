// Build optimization types
export interface BuildConfig {
  // Code splitting configuration
  codeSplitting: {
    enabled: boolean;
    chunks?: "async" | "initial" | "all";
    minSize?: number;
    maxSize?: number;
    automaticNameDelimiter?: string;
  };

  // Tree shaking configuration
  treeShaking: {
    enabled: boolean;
    sideEffects?: boolean | string[];
  };

  // Bundle analysis configuration
  bundleAnalysis: {
    enabled: boolean;
    reportFilename?: string;
    openAnalyzer?: boolean;
    generateStatsFile?: boolean;
  };

  // Asset optimization configuration
  assetOptimization: {
    enabled: boolean;
    // Image optimization
    images: {
      compress: boolean;
      quality?: number;
      formats?: ("webp" | "avif" | "png" | "jpeg")[];
    };
    // Font optimization
    fonts: {
      preload: boolean;
      formats?: ("woff2" | "woff" | "ttf")[];
      display?: "auto" | "block" | "swap" | "fallback" | "optional";
    };
    // CSS optimization
    css: {
      minify: boolean;
      purge: boolean;
      modules: boolean;
    };
  };
}

// Runtime optimization types
export interface RuntimeConfig {
  // Caching strategies
  caching: {
    enabled: boolean;
    strategy: "memory" | "filesystem" | "redis";
    ttl?: number;
    maxSize?: number;
    invalidation?: {
      automatic: boolean;
      interval?: number;
    };
  };

  // Lazy loading configuration
  lazyLoading: {
    enabled: boolean;
    threshold?: number;
    preload?: boolean;
    placeholder?: boolean;
  };

  // Prefetching configuration
  prefetching: {
    enabled: boolean;
    strategy: "hover" | "viewport" | "eager";
    threshold?: number;
    timeout?: number;
    maxConcurrent?: number;
  };

  // Resource hints configuration
  resourceHints: {
    enabled: boolean;
    preconnect?: string[];
    prefetch?: string[];
    preload?: Array<{
      url: string;
      as: "script" | "style" | "image" | "font" | "fetch";
      type?: string;
      crossorigin?: boolean;
    }>;
    prerender?: string[];
  };
}

// Combined performance configuration
export interface PerformanceConfig {
  build: BuildConfig;
  runtime: RuntimeConfig;
}

// Performance metrics types
export interface PerformanceMetrics {
  // Build metrics
  buildTime: number;
  bundleSize: {
    total: number;
    js: number;
    css: number;
    assets: number;
  };
  treeShakenModules: string[];

  // Runtime metrics
  timeToFirstByte: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  timeToInteractive: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
}

// Performance optimization result
export interface OptimizationResult {
  success: boolean;
  metrics: PerformanceMetrics;
  warnings?: string[];
  errors?: string[];
}
