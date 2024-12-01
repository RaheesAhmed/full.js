import type { ReactElement } from "react";
import { render, cleanup } from "../utils";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { full } from "@full/core";

// Integration test suite creator
export function createIntegrationSuite(
  name: string,
  tests: (utils: IntegrationTestUtils) => void
) {
  describe(`Integration: ${name}`, () => {
    const utils = createIntegrationTestUtils();

    beforeEach(() => {
      utils.setup();
    });

    afterEach(() => {
      utils.cleanup();
    });

    tests(utils);
  });
}

// Integration test utilities
interface IntegrationTestUtils {
  render: typeof render;
  setup: () => void;
  cleanup: () => void;
  mockApi: (path: string, response: unknown) => void;
  mockWebSocket: () => WebSocket;
  mockStorage: () => Storage;
  waitForData: (key: string) => Promise<unknown>;
  waitForRoute: (path: string) => Promise<void>;
  waitForEvent: (name: string) => Promise<void>;
  assertions: typeof expect;
}

function createIntegrationTestUtils(): IntegrationTestUtils {
  const mockResponses = new Map<string, unknown>();
  const mockEvents = new Map<string, Array<() => void>>();

  return {
    render,
    setup: () => {
      // Setup API mocking
      global.fetch = vi.fn((path: string) =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponses.get(path)),
        })
      );

      // Setup WebSocket mocking
      global.WebSocket = vi.fn(() => ({
        addEventListener: (event: string, callback: () => void) => {
          const callbacks = mockEvents.get(event) || [];
          callbacks.push(callback);
          mockEvents.set(event, callbacks);
        },
        removeEventListener: (event: string, callback: () => void) => {
          const callbacks = mockEvents.get(event) || [];
          mockEvents.set(
            event,
            callbacks.filter((cb) => cb !== callback)
          );
        },
        send: vi.fn(),
        close: vi.fn(),
      }));

      // Setup storage mocking
      const mockStorage: Record<string, string> = {};
      global.localStorage = {
        getItem: (key: string) => mockStorage[key] || null,
        setItem: (key: string, value: string) => {
          mockStorage[key] = value;
        },
        removeItem: (key: string) => {
          delete mockStorage[key];
        },
        clear: () => {
          Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
        },
        key: (index: number) => Object.keys(mockStorage)[index] || null,
        length: Object.keys(mockStorage).length,
      };
    },
    cleanup: () => {
      cleanup();
      vi.clearAllMocks();
      mockResponses.clear();
      mockEvents.clear();
    },
    mockApi: (path: string, response: unknown) => {
      mockResponses.set(path, response);
    },
    mockWebSocket: () => {
      return new WebSocket("ws://test");
    },
    mockStorage: () => {
      return global.localStorage;
    },
    waitForData: async (key: string) => {
      return new Promise((resolve) => {
        const interval = setInterval(async () => {
          try {
            const data = await full.data.fetch(key);
            if (data) {
              clearInterval(interval);
              resolve(data);
            }
          } catch {}
        }, 50);
      });
    },
    waitForRoute: async (path: string) => {
      return new Promise((resolve) => {
        const interval = setInterval(() => {
          const currentRoute = full.router.getCurrentRoute();
          if (currentRoute?.path === path) {
            clearInterval(interval);
            resolve();
          }
        }, 50);
      });
    },
    waitForEvent: async (name: string) => {
      return new Promise((resolve) => {
        const callbacks = mockEvents.get(name) || [];
        callbacks.push(() => resolve());
        mockEvents.set(name, callbacks);
      });
    },
    assertions: expect,
  };
}

// Feature test creator
export function createFeatureTest(
  name: string,
  options: FeatureTestOptions = {}
) {
  const {
    setup = async () => {},
    teardown = async () => {},
    features = [],
  } = options;

  describe(`Feature: ${name}`, () => {
    beforeEach(async () => {
      await setup();
    });

    afterEach(async () => {
      await teardown();
    });

    features.forEach(({ name, scenarios }) => {
      describe(name, () => {
        scenarios.forEach(({ given, when, then }) => {
          it(`${given} when ${when}`, async () => {
            const utils = createIntegrationTestUtils();
            await given(utils);
            await when(utils);
            await then(utils);
          });
        });
      });
    });
  });
}

// Types for feature testing
interface FeatureTestOptions {
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
  features?: Array<{
    name: string;
    scenarios: Array<{
      given: (utils: IntegrationTestUtils) => Promise<void>;
      when: (utils: IntegrationTestUtils) => Promise<void>;
      then: (utils: IntegrationTestUtils) => Promise<void>;
    }>;
  }>;
}

// Export test utilities
export { vi, describe, it, expect, beforeEach, afterEach };
