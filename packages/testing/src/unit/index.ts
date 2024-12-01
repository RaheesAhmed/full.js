import type { ReactElement } from 'react';
import { render, cleanup } from '../utils';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Unit test suite creator
export function createUnitSuite(name: string, tests: (utils: UnitTestUtils) => void) {
  describe(`Unit: ${name}`, () => {
    const utils = createUnitTestUtils();

    beforeEach(() => {
      utils.setup();
    });

    afterEach(() => {
      utils.cleanup();
    });

    tests(utils);
  });
}

// Unit test utilities
interface UnitTestUtils {
  render: typeof render;
  setup: () => void;
  cleanup: () => void;
  createTestProps: <T extends object>(overrides?: Partial<T>) => T;
  mockFunction: typeof vi.fn;
  assertions: typeof expect;
}

function createUnitTestUtils(): UnitTestUtils {
  return {
    render,
    setup: () => {
      // Setup runs before each test
    },
    cleanup: () => {
      cleanup();
      vi.clearAllMocks();
    },
    createTestProps: <T extends object>(overrides: Partial<T> = {}) => {
      return {
        id: 'test-id',
        name: 'test-name',
        ...overrides
      } as T;
    },
    mockFunction: vi.fn,
    assertions: expect
  };
}

// Component test creator
export function createComponentTest<P extends object>(
  Component: React.ComponentType<P>,
  options: ComponentTestOptions<P> = {}
) {
  const {
    name = Component.displayName || Component.name,
    defaultProps = {} as P,
    tests = {}
  } = options;

  describe(`Component: ${name}`, () => {
    // Basic render test
    it('renders without crashing', () => {
      const { container } = render(<Component {...defaultProps} />);
      expect(container).toBeTruthy();
    });

    // Props tests
    if (tests.props) {
      describe('Props', () => {
        Object.entries(tests.props).forEach(([propName, testCases]) => {
          describe(propName, () => {
            testCases.forEach(({ value, expected }) => {
              it(`handles ${value}`, () => {
                const props = {
                  ...defaultProps,
                  [propName]: value
                };
                const { container } = render(<Component {...props} />);
                expected(container);
              });
            });
          });
        });
      });
    }

    // Event tests
    if (tests.events) {
      describe('Events', () => {
        Object.entries(tests.events).forEach(([eventName, testCases]) => {
          describe(eventName, () => {
            testCases.forEach(({ setup, trigger, expected }) => {
              it(setup.description, async () => {
                const props = {
                  ...defaultProps,
                  ...setup.props
                };
                const { container } = render(<Component {...props} />);
                await trigger(container);
                expected(container);
              });
            });
          });
        });
      });
    }

    // State tests
    if (tests.state) {
      describe('State', () => {
        Object.entries(tests.state).forEach(([stateName, testCases]) => {
          describe(stateName, () => {
            testCases.forEach(({ initial, action, expected }) => {
              it(`transitions from ${initial} when ${action.description}`, async () => {
                const props = {
                  ...defaultProps,
                  initialState: initial
                };
                const { container } = render(<Component {...props} />);
                await action.execute(container);
                expected(container);
              });
            });
          });
        });
      });
    }

    // Custom tests
    if (tests.custom) {
      tests.custom.forEach(({ name, test }) => {
        it(name, () => test(render, Component, defaultProps));
      });
    }
  });
}

// Types for component testing
interface ComponentTestOptions<P> {
  name?: string;
  defaultProps?: P;
  tests?: {
    props?: Record<
      string,
      Array<{
        value: unknown;
        expected: (container: HTMLElement) => void;
      }>
    >;
    events?: Record<
      string,
      Array<{
        setup: {
          description: string;
          props: Partial<P>;
        };
        trigger: (container: HTMLElement) => Promise<void>;
        expected: (container: HTMLElement) => void;
      }>
    >;
    state?: Record<
      string,
      Array<{
        initial: unknown;
        action: {
          description: string;
          execute: (container: HTMLElement) => Promise<void>;
        };
        expected: (container: HTMLElement) => void;
      }>
    >;
    custom?: Array<{
      name: string;
      test: (
        render: typeof render,
        Component: React.ComponentType<P>,
        defaultProps: P
      ) => void;
    }>;
  };
}

// Export test utilities
export { vi, describe, it, expect, beforeEach, afterEach }; 