import type { PerformanceMetrics } from "../types";

// Calculate bundle size in bytes
export function calculateBundleSize(filePath: string): number {
  try {
    const stats = require("fs").statSync(filePath);
    return stats.size;
  } catch (error) {
    console.error(`Failed to calculate bundle size for ${filePath}:`, error);
    return 0;
  }
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

// Check if browser supports specific features
export function checkBrowserSupport(): {
  intersectionObserver: boolean;
  webp: boolean;
  avif: boolean;
  modules: boolean;
} {
  return {
    intersectionObserver: typeof IntersectionObserver !== "undefined",
    webp: hasWebPSupport(),
    avif: hasAvifSupport(),
    modules: hasModuleSupport(),
  };
}

// Check WebP support
function hasWebPSupport(): boolean {
  const canvas = document.createElement("canvas");
  if (canvas.getContext && canvas.getContext("2d")) {
    return canvas.toDataURL("image/webp").indexOf("data:image/webp") === 0;
  }
  return false;
}

// Check AVIF support
function hasAvifSupport(): boolean {
  const img = new Image();
  return img.decode !== undefined && img.decode() instanceof Promise;
}

// Check ES modules support
function hasModuleSupport(): boolean {
  try {
    new Function('import("")');
    return true;
  } catch {
    return false;
  }
}

// Measure performance metrics
export async function measurePerformanceMetrics(): Promise<PerformanceMetrics> {
  const metrics: PerformanceMetrics = {
    buildTime: 0,
    bundleSize: {
      total: 0,
      js: 0,
      css: 0,
      assets: 0,
    },
    treeShakenModules: [],
    timeToFirstByte: 0,
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
    timeToInteractive: 0,
    firstInputDelay: 0,
    cumulativeLayoutShift: 0,
  };

  // Measure build metrics
  metrics.buildTime = performance.now();

  // Measure runtime metrics using Performance API
  const navigationEntry = performance.getEntriesByType(
    "navigation"
  )[0] as PerformanceNavigationTiming;
  if (navigationEntry) {
    metrics.timeToFirstByte =
      navigationEntry.responseStart - navigationEntry.requestStart;
  }

  // First Contentful Paint
  const paintEntries = performance.getEntriesByType("paint");
  const fcpEntry = paintEntries.find(
    (entry) => entry.name === "first-contentful-paint"
  );
  if (fcpEntry) {
    metrics.firstContentfulPaint = fcpEntry.startTime;
  }

  // Largest Contentful Paint
  const lcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    metrics.largestContentfulPaint = lastEntry.startTime;
  });
  lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });

  // First Input Delay
  const fidObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    metrics.firstInputDelay = entries[0].duration;
  });
  fidObserver.observe({ entryTypes: ["first-input"] });

  // Cumulative Layout Shift
  const clsObserver = new PerformanceObserver((list) => {
    let cumulativeScore = 0;
    for (const entry of list.getEntries()) {
      if (!entry.hadRecentInput) {
        cumulativeScore += (entry as any).value;
      }
    }
    metrics.cumulativeLayoutShift = cumulativeScore;
  });
  clsObserver.observe({ entryTypes: ["layout-shift"] });

  return metrics;
}

// Generate performance report
export function generatePerformanceReport(metrics: PerformanceMetrics): string {
  return `
Performance Report
=================

Build Metrics
------------
Build Time: ${metrics.buildTime.toFixed(2)}ms
Bundle Size:
  - Total: ${formatFileSize(metrics.bundleSize.total)}
  - JavaScript: ${formatFileSize(metrics.bundleSize.js)}
  - CSS: ${formatFileSize(metrics.bundleSize.css)}
  - Assets: ${formatFileSize(metrics.bundleSize.assets)}
Tree-shaken Modules: ${metrics.treeShakenModules.length}

Runtime Metrics
--------------
Time to First Byte: ${metrics.timeToFirstByte.toFixed(2)}ms
First Contentful Paint: ${metrics.firstContentfulPaint.toFixed(2)}ms
Largest Contentful Paint: ${metrics.largestContentfulPaint.toFixed(2)}ms
Time to Interactive: ${metrics.timeToInteractive.toFixed(2)}ms
First Input Delay: ${metrics.firstInputDelay.toFixed(2)}ms
Cumulative Layout Shift: ${metrics.cumulativeLayoutShift.toFixed(3)}

Browser Support
--------------
${JSON.stringify(checkBrowserSupport(), null, 2)}
  `.trim();
}

// Optimize image loading
export function optimizeImageLoading(
  imgElement: HTMLImageElement,
  options: {
    lazy?: boolean;
    threshold?: number;
    placeholder?: string;
    srcset?: string;
    sizes?: string;
  } = {}
): void {
  const { lazy = true, threshold = 0.1, placeholder, srcset, sizes } = options;

  if (lazy) {
    imgElement.loading = "lazy";

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (srcset) img.srcset = srcset;
            if (sizes) img.sizes = sizes;
            observer.unobserve(img);
          }
        });
      },
      { threshold }
    );

    observer.observe(imgElement);
  }

  if (placeholder) {
    imgElement.style.backgroundImage = `url(${placeholder})`;
    imgElement.style.backgroundSize = "cover";
  }

  // Add error handling
  imgElement.onerror = () => {
    console.warn(`Failed to load image: ${imgElement.src}`);
    if (placeholder) {
      imgElement.src = placeholder;
    }
  };
}

// Optimize font loading
export function optimizeFontLoading(
  fontUrls: string[],
  options: {
    display?: "auto" | "block" | "swap" | "fallback" | "optional";
    preload?: boolean;
  } = {}
): void {
  const { display = "swap", preload = true } = options;

  fontUrls.forEach((url) => {
    const link = document.createElement("link");
    link.href = url;
    link.rel = preload ? "preload" : "stylesheet";
    link.as = "font";
    link.type = "font/woff2";
    link.crossOrigin = "anonymous";

    if (preload) {
      link.onload = () => {
        link.rel = "stylesheet";
      };
    }

    const style = document.createElement("style");
    style.textContent = `
      @font-face {
        font-family: '${url.split("/").pop()?.split(".")[0]}';
        src: url(${url}) format('woff2');
        font-display: ${display};
      }
    `;

    document.head.appendChild(link);
    document.head.appendChild(style);
  });
}
