// Re-export all testing utilities
export * from "./utils";
export * from "./unit";
export * from "./integration";
export * from "./e2e";
export * from "./performance";

// Export test runners
export {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
  vi,
} from "vitest";

// Export testing-library utilities
export {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
  act,
} from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";

// Export test types
export type {
  RenderResult,
  RenderOptions,
  Screen,
  FireEvent,
  UserEvent,
  Within,
} from "@testing-library/react";

// Export custom test types
export interface TestContext {
  render: typeof render;
  screen: typeof screen;
  fireEvent: typeof fireEvent;
  userEvent: typeof userEvent;
  waitFor: typeof waitFor;
  within: typeof within;
  act: typeof act;
  cleanup: () => void;
}

// Export test configuration
export const config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["@testing-library/jest-dom"],
  testMatch: ["**/*.test.ts", "**/*.test.tsx"],
  coverage: {
    provider: "v8",
    reporter: ["text", "html", "lcov"],
    exclude: [
      "node_modules/**",
      "dist/**",
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/*.d.ts",
    ],
  },
} as const;

// Export test utilities
export const utils = {
  // DOM utilities
  getByTestId: (id: string) => document.querySelector(`[data-testid="${id}"]`),
  getAllByTestId: (id: string) =>
    document.querySelectorAll(`[data-testid="${id}"]`),
  queryByTestId: (id: string) =>
    document.querySelector(`[data-testid="${id}"]`),
  queryAllByTestId: (id: string) =>
    document.querySelectorAll(`[data-testid="${id}"]`),

  // Event utilities
  click: (element: Element) => fireEvent.click(element),
  type: (element: Element, text: string) =>
    fireEvent.change(element, { target: { value: text } }),
  submit: (element: Element) => fireEvent.submit(element),

  // Wait utilities
  waitForElement: (callback: () => Element | null) => waitFor(callback),
  waitForElementToBeRemoved: (callback: () => Element | null) =>
    waitFor(() => !callback()),
  waitForDomChange: () => waitFor(() => undefined),

  // Mock utilities
  createMockComponent: (name: string) => {
    const component = () => null;
    component.displayName = name;
    return component;
  },
  createMockHook: <T>(name: string, returnValue: T) => {
    const hook = () => returnValue;
    hook.displayName = name;
    return hook;
  },
  createMockContext: <T>(name: string, defaultValue: T) => {
    const context = React.createContext(defaultValue);
    context.displayName = name;
    return context;
  },

  // Assertion utilities
  expectToBeInTheDocument: (element: Element | null) => {
    expect(element).toBeInTheDocument();
  },
  expectToHaveTextContent: (element: Element | null, text: string) => {
    expect(element).toHaveTextContent(text);
  },
  expectToHaveAttribute: (
    element: Element | null,
    attr: string,
    value: string
  ) => {
    expect(element).toHaveAttribute(attr, value);
  },
  expectToHaveClass: (element: Element | null, className: string) => {
    expect(element).toHaveClass(className);
  },
  expectToHaveStyle: (
    element: Element | null,
    style: Record<string, string>
  ) => {
    expect(element).toHaveStyle(style);
  },
  expectToBeVisible: (element: Element | null) => {
    expect(element).toBeVisible();
  },
  expectToBeDisabled: (element: Element | null) => {
    expect(element).toBeDisabled();
  },
  expectToHaveFocus: (element: Element | null) => {
    expect(element).toHaveFocus();
  },
  expectToBeChecked: (element: Element | null) => {
    expect(element).toBeChecked();
  },
  expectToBeEmpty: (element: Element | null) => {
    expect(element).toBeEmpty();
  },
  expectToBeRequired: (element: Element | null) => {
    expect(element).toBeRequired();
  },
  expectToBeValid: (element: Element | null) => {
    expect(element).toBeValid();
  },
  expectToBeInvalid: (element: Element | null) => {
    expect(element).toBeInvalid();
  },
  expectToHaveValue: (element: Element | null, value: string) => {
    expect(element).toHaveValue(value);
  },
  expectToHaveLength: (elements: NodeListOf<Element>, length: number) => {
    expect(elements).toHaveLength(length);
  },
  expectToBeCalled: (mock: jest.Mock) => {
    expect(mock).toBeCalled();
  },
  expectToBeCalledWith: (mock: jest.Mock, ...args: unknown[]) => {
    expect(mock).toBeCalledWith(...args);
  },
  expectToBeCalledTimes: (mock: jest.Mock, times: number) => {
    expect(mock).toBeCalledTimes(times);
  },
  expectToThrow: (callback: () => void) => {
    expect(callback).toThrow();
  },
  expectToThrowError: (callback: () => void, message: string) => {
    expect(callback).toThrowError(message);
  },
} as const;
