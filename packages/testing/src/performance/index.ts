import { chromium, type Browser, type Page } from "playwright";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";

// Performance test suite creator
export function createPerformanceSuite(
  name: string,
  tests: (utils: PerformanceTestUtils) => void,
  options: PerformanceTestOptions = {}
) {
  const {
    baseUrl = "http://localhost:3000",
    thresholds = defaultThresholds,
    setup = async () => {},
    teardown = async () => {},
  } = options;

  describe(`Performance: ${name}`, () => {
    let browser: Browser;
    let utils: PerformanceTestUtils;

    beforeEach(async () => {
      browser = await chromium.launch();
      utils = await createPerformanceTestUtils(browser, baseUrl, thresholds);
      await setup();
    });

    afterEach(async () => {
      await teardown();
      await utils.cleanup();
      await browser.close();
    });

    tests(utils);
  });
}

// Performance test utilities
interface PerformanceTestUtils {
  page: Page;
  visit: (path: string) => Promise<void>;
  measurePageLoad: () => Promise<PageLoadMetrics>;
  measureFirstPaint: () => Promise<number>;
  measureFirstContentfulPaint: () => Promise<number>;
  measureLargestContentfulPaint: () => Promise<number>;
  measureTimeToInteractive: () => Promise<number>;
  measureTotalBlockingTime: () => Promise<number>;
  measureCumulativeLayoutShift: () => Promise<number>;
  measureMemoryUsage: () => Promise<MemoryMetrics>;
  measureNetworkRequests: () => Promise<NetworkMetrics>;
  runLighthouse: () => Promise<LighthouseMetrics>;
  cleanup: () => Promise<void>;
  assertions: {
    meetsThreshold: (metric: string, value: number) => void;
    performanceScore: (score: number) => void;
  };
}

// Performance metrics types
interface PageLoadMetrics {
  navigationStart: number;
  loadEventEnd: number;
  domContentLoaded: number;
  firstPaint: number;
  firstContentfulPaint: number;
}

interface MemoryMetrics {
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
}

interface NetworkMetrics {
  totalRequests: number;
  totalSize: number;
  totalTime: number;
  requests: Array<{
    url: string;
    type: string;
    size: number;
    time: number;
  }>;
}

interface LighthouseMetrics {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  pwa: number;
}

// Default performance thresholds
const defaultThresholds = {
  pageLoad: 2000, // 2 seconds
  firstPaint: 1000, // 1 second
  firstContentfulPaint: 1500, // 1.5 seconds
  largestContentfulPaint: 2500, // 2.5 seconds
  timeToInteractive: 3500, // 3.5 seconds
  totalBlockingTime: 300, // 300 milliseconds
  cumulativeLayoutShift: 0.1, // 0.1 score
  memoryUsage: 0.8, // 80% of available heap
  networkRequests: 50, // Maximum number of requests
  networkSize: 1000000, // 1MB total size
  performanceScore: 0.9, // 90% Lighthouse performance score
};

async function createPerformanceTestUtils(
  browser: Browser,
  baseUrl: string,
  thresholds: typeof defaultThresholds
): Promise<PerformanceTestUtils> {
  const page = await browser.newPage();
  const resultsDir = "./test-results/performance";

  return {
    page,
    visit: async (path: string) => {
      await page.goto(`${baseUrl}${path}`);
    },
    measurePageLoad: async () => {
      const metrics = await page.evaluate(() => {
        const { timing } = window.performance;
        return {
          navigationStart: timing.navigationStart,
          loadEventEnd: timing.loadEventEnd,
          domContentLoaded: timing.domContentLoadedEventEnd,
          firstPaint: performance.getEntriesByType("paint")[0]?.startTime || 0,
          firstContentfulPaint:
            performance.getEntriesByType("paint")[1]?.startTime || 0,
        };
      });
      return metrics;
    },
    measureFirstPaint: async () => {
      const metrics = await page.evaluate(
        () => performance.getEntriesByType("paint")[0]?.startTime || 0
      );
      return metrics;
    },
    measureFirstContentfulPaint: async () => {
      const metrics = await page.evaluate(
        () => performance.getEntriesByType("paint")[1]?.startTime || 0
      );
      return metrics;
    },
    measureLargestContentfulPaint: async () => {
      const metrics = await page.evaluate(() => {
        const entries = performance.getEntriesByType(
          "largest-contentful-paint"
        );
        return entries[entries.length - 1]?.startTime || 0;
      });
      return metrics;
    },
    measureTimeToInteractive: async () => {
      const metrics = await page.evaluate(() => {
        const entries = performance.getEntriesByType("longtask");
        const lastTask = entries[entries.length - 1];
        return lastTask ? lastTask.startTime + lastTask.duration : 0;
      });
      return metrics;
    },
    measureTotalBlockingTime: async () => {
      const metrics = await page.evaluate(() => {
        const entries = performance.getEntriesByType("longtask");
        return entries.reduce((total, task) => total + task.duration, 0);
      });
      return metrics;
    },
    measureCumulativeLayoutShift: async () => {
      const metrics = await page.evaluate(() => {
        const entries = performance.getEntriesByType("layout-shift");
        return entries.reduce((total, entry) => total + entry.value, 0);
      });
      return metrics;
    },
    measureMemoryUsage: async () => {
      const metrics = await page.evaluate(() => {
        const memory = (performance as any).memory;
        return {
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          totalJSHeapSize: memory.totalJSHeapSize,
          usedJSHeapSize: memory.usedJSHeapSize,
        };
      });
      return metrics;
    },
    measureNetworkRequests: async () => {
      const client = await page.context().newCDPSession(page);
      await client.send("Network.enable");

      const requests: NetworkMetrics["requests"] = [];
      let totalSize = 0;
      let totalTime = 0;

      client.on("Network.responseReceived", (event) => {
        const { response } = event;
        const request = {
          url: response.url,
          type: response.mimeType,
          size: response.encodedDataLength,
          time: response.timing?.requestTime || 0,
        };
        requests.push(request);
        totalSize += request.size;
        totalTime += request.time;
      });

      return {
        totalRequests: requests.length,
        totalSize,
        totalTime,
        requests,
      };
    },
    runLighthouse: async () => {
      const chrome = await launch({ chromeFlags: ["--headless"] });
      const options = {
        logLevel: "info",
        output: "json",
        onlyCategories: [
          "performance",
          "accessibility",
          "best-practices",
          "seo",
          "pwa",
        ],
        port: chrome.port,
      };

      const results = await lighthouse(baseUrl, options);
      await chrome.kill();

      return {
        performance: results.lhr.categories.performance.score || 0,
        accessibility: results.lhr.categories.accessibility.score || 0,
        bestPractices: results.lhr.categories["best-practices"].score || 0,
        seo: results.lhr.categories.seo.score || 0,
        pwa: results.lhr.categories.pwa.score || 0,
      };
    },
    cleanup: async () => {
      await page.close();
    },
    assertions: {
      meetsThreshold: (metric: string, value: number) => {
        const threshold = thresholds[metric as keyof typeof thresholds];
        expect(value).toBeLessThanOrEqual(threshold);
      },
      performanceScore: (score: number) => {
        expect(score).toBeGreaterThanOrEqual(thresholds.performanceScore);
      },
    },
  };
}

// Types for performance testing
interface PerformanceTestOptions {
  baseUrl?: string;
  thresholds?: typeof defaultThresholds;
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
}

// Metric test creator
export function createMetricTest(
  name: string,
  metrics: Array<{
    name: string;
    measure: (utils: PerformanceTestUtils) => Promise<number>;
  }>,
  options: PerformanceTestOptions = {}
) {
  createPerformanceSuite(
    name,
    (utils) => {
      metrics.forEach(({ name: metricName, measure }) => {
        it(`${metricName} meets threshold`, async () => {
          const value = await measure(utils);
          utils.assertions.meetsThreshold(metricName, value);
        });
      });
    },
    options
  );
}

// Load test creator
export function createLoadTest(
  name: string,
  scenarios: Array<{
    name: string;
    users: number;
    duration: number;
    action: (utils: PerformanceTestUtils) => Promise<void>;
  }>,
  options: PerformanceTestOptions = {}
) {
  createPerformanceSuite(
    name,
    (utils) => {
      scenarios.forEach(({ name: scenarioName, users, duration, action }) => {
        it(`handles ${users} users for ${duration}ms`, async () => {
          const startTime = Date.now();
          const promises = Array.from({ length: users }).map(() =>
            action(utils)
          );
          await Promise.all(promises);
          const endTime = Date.now();
          const totalTime = endTime - startTime;
          expect(totalTime).toBeLessThanOrEqual(duration);
        });
      });
    },
    options
  );
}

// Export test utilities
export { vi, describe, it, expect, beforeEach, afterEach };
