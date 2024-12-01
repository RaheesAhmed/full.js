import { chromium, firefox, webkit, type Browser, type Page } from "playwright";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

// E2E test suite creator
export function createE2ESuite(
  name: string,
  tests: (utils: E2ETestUtils) => void,
  options: E2ETestOptions = {}
) {
  const {
    browsers = ["chromium"],
    baseUrl = "http://localhost:3000",
    setup = async () => {},
    teardown = async () => {},
  } = options;

  describe(`E2E: ${name}`, () => {
    browsers.forEach((browserType) => {
      describe(browserType, () => {
        let browser: Browser;
        let utils: E2ETestUtils;

        beforeEach(async () => {
          browser = await getBrowser(browserType);
          utils = await createE2ETestUtils(browser, baseUrl);
          await setup();
        });

        afterEach(async () => {
          await teardown();
          await utils.cleanup();
          await browser.close();
        });

        tests(utils);
      });
    });
  });
}

// E2E test utilities
interface E2ETestUtils {
  page: Page;
  visit: (path: string) => Promise<void>;
  click: (selector: string) => Promise<void>;
  type: (selector: string, text: string) => Promise<void>;
  select: (selector: string, value: string) => Promise<void>;
  waitForSelector: (selector: string) => Promise<void>;
  waitForNavigation: () => Promise<void>;
  waitForResponse: (url: string) => Promise<void>;
  screenshot: (name: string) => Promise<void>;
  cleanup: () => Promise<void>;
  assertions: {
    seeText: (text: string) => Promise<void>;
    seeElement: (selector: string) => Promise<void>;
    notSeeElement: (selector: string) => Promise<void>;
    seeCount: (selector: string, count: number) => Promise<void>;
    seeUrl: (url: string) => Promise<void>;
    seeTitle: (title: string) => Promise<void>;
  };
}

async function createE2ETestUtils(
  browser: Browser,
  baseUrl: string
): Promise<E2ETestUtils> {
  const page = await browser.newPage();
  const screenshotDir = "./test-results/screenshots";

  return {
    page,
    visit: async (path: string) => {
      await page.goto(`${baseUrl}${path}`);
    },
    click: async (selector: string) => {
      await page.click(selector);
    },
    type: async (selector: string, text: string) => {
      await page.fill(selector, text);
    },
    select: async (selector: string, value: string) => {
      await page.selectOption(selector, value);
    },
    waitForSelector: async (selector: string) => {
      await page.waitForSelector(selector);
    },
    waitForNavigation: async () => {
      await page.waitForNavigation();
    },
    waitForResponse: async (url: string) => {
      await page.waitForResponse(url);
    },
    screenshot: async (name: string) => {
      await page.screenshot({
        path: `${screenshotDir}/${name}.png`,
        fullPage: true,
      });
    },
    cleanup: async () => {
      await page.close();
    },
    assertions: {
      seeText: async (text: string) => {
        const content = await page.textContent("body");
        expect(content).toContain(text);
      },
      seeElement: async (selector: string) => {
        const element = await page.$(selector);
        expect(element).toBeTruthy();
      },
      notSeeElement: async (selector: string) => {
        const element = await page.$(selector);
        expect(element).toBeFalsy();
      },
      seeCount: async (selector: string, count: number) => {
        const elements = await page.$$(selector);
        expect(elements.length).toBe(count);
      },
      seeUrl: async (url: string) => {
        expect(page.url()).toContain(url);
      },
      seeTitle: async (title: string) => {
        expect(await page.title()).toBe(title);
      },
    },
  };
}

// Browser utilities
async function getBrowser(type: string): Promise<Browser> {
  switch (type) {
    case "firefox":
      return firefox.launch();
    case "webkit":
      return webkit.launch();
    default:
      return chromium.launch();
  }
}

// Types for E2E testing
interface E2ETestOptions {
  browsers?: Array<"chromium" | "firefox" | "webkit">;
  baseUrl?: string;
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
}

// Flow test creator
export function createFlowTest(
  name: string,
  steps: Array<{
    name: string;
    action: (utils: E2ETestUtils) => Promise<void>;
    assertion: (utils: E2ETestUtils) => Promise<void>;
  }>,
  options: E2ETestOptions = {}
) {
  createE2ESuite(
    name,
    (utils) => {
      it("completes successfully", async () => {
        for (const step of steps) {
          await step.action(utils);
          await step.assertion(utils);
        }
      });
    },
    options
  );
}

// Performance test creator
export function createPerformanceTest(
  name: string,
  scenarios: Array<{
    name: string;
    action: (utils: E2ETestUtils) => Promise<void>;
    metrics: Array<{
      name: string;
      threshold: number;
      measure: (utils: E2ETestUtils) => Promise<number>;
    }>;
  }>,
  options: E2ETestOptions = {}
) {
  createE2ESuite(
    name,
    (utils) => {
      scenarios.forEach(({ name, action, metrics }) => {
        describe(name, () => {
          metrics.forEach(({ name: metricName, threshold, measure }) => {
            it(`${metricName} is within threshold`, async () => {
              await action(utils);
              const value = await measure(utils);
              expect(value).toBeLessThanOrEqual(threshold);
            });
          });
        });
      });
    },
    options
  );
}

// Export test utilities
export { vi, describe, it, expect, beforeEach, afterEach };
