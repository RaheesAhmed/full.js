import type { ReactElement } from 'react';
import { render as rtlRender } from '@testing-library/react';
import { vi } from 'vitest';
import { full } from '@full/core';

// Test renderer with FULL.js providers
export function render(ui: ReactElement, options = {}) {
  const Wrapper = ({ children }: { children: ReactElement }) => (
    <full.providers>
      {children}
    </full.providers>
  );

  return rtlRender(ui, { wrapper: Wrapper, ...options });
}

// Create test page
export function createTestPage(options = {}) {
  return full.page({
    name: 'TestPage',
    data: full.data({
      test: async () => ({ message: 'Test Data' })
    }),
    ...options
  });
}

// Create test component
export function createTestComponent(options = {}) {
  return full.component({
    name: 'TestComponent',
    render: () => <div>Test Component</div>,
    ...options
  });
}

// Mock data fetcher
export function mockDataFetcher<T>(key: string, data: T) {
  return vi.spyOn(full.data, 'fetch').mockImplementation(async (k) => {
    if (k === key) return data;
    throw new Error(`No mock data for key: ${k}`);
  });
}

// Mock router
export function mockRouter() {
  const navigate = vi.fn();
  const getCurrentRoute = vi.fn();
  const getHistory = vi.fn();

  vi.spyOn(full.router, 'navigate').mockImplementation(navigate);
  vi.spyOn(full.router, 'getCurrentRoute').mockImplementation(getCurrentRoute);
  vi.spyOn(full.router, 'getHistory').mockImplementation(getHistory);

  return { navigate, getCurrentRoute, getHistory };
}

// Mock security
export function mockSecurity(options = {}) {
  const defaultUser = { id: 1, name: 'Test User' };
  const defaultPermissions = ['test:read', 'test:write'];

  const user = options.user ?? defaultUser;
  const permissions = options.permissions ?? defaultPermissions;
  const isAuthenticated = options.isAuthenticated ?? true;

  vi.spyOn(full.security, 'getUser').mockReturnValue(user);
  vi.spyOn(full.security, 'getPermissions').mockReturnValue(permissions);
  vi.spyOn(full.security, 'isAuthenticated').mockReturnValue(isAuthenticated);

  return { user, permissions, isAuthenticated };
}

// Mock analytics
export function mockAnalytics() {
  const trackPageView = vi.fn();
  const trackEvent = vi.fn();
  const trackError = vi.fn();

  vi.spyOn(full.analytics, 'trackPageView').mockImplementation(trackPageView);
  vi.spyOn(full.analytics, 'trackEvent').mockImplementation(trackEvent);
  vi.spyOn(full.analytics, 'trackError').mockImplementation(trackError);

  return { trackPageView, trackEvent, trackError };
}

// Create test fixture
export function createFixture<T>(name: string, data: T): T {
  return {
    __fixture: name,
    ...data
  };
}

// Test assertions
export const assertions = {
  // Component assertions
  toBeRendered: (element: Element | null) => {
    expect(element).toBeInTheDocument();
  },
  toHaveStyle: (element: Element | null, styles: Record<string, string>) => {
    Object.entries(styles).forEach(([prop, value]) => {
      expect(element).toHaveStyle({ [prop]: value });
    });
  },
  toHaveClass: (element: Element | null, className: string) => {
    expect(element).toHaveClass(className);
  },

  // Router assertions
  toBeCurrentRoute: (path: string) => {
    expect(full.router.getCurrentRoute()?.path).toBe(path);
  },
  toHaveRouteParams: (params: Record<string, string>) => {
    expect(full.router.getCurrentRoute()?.params).toEqual(params);
  },

  // Data assertions
  toHaveData: async (key: string, expected: unknown) => {
    const data = await full.data.fetch(key);
    expect(data).toEqual(expected);
  },
  toBeCached: (key: string) => {
    expect(full.data.cache.has(key)).toBe(true);
  },

  // Security assertions
  toBeAuthenticated: () => {
    expect(full.security.isAuthenticated()).toBe(true);
  },
  toHavePermission: (permission: string) => {
    expect(full.security.getPermissions()).toContain(permission);
  },

  // Analytics assertions
  toHaveTrackedPageView: (path: string) => {
    expect(full.analytics.trackPageView).toHaveBeenCalledWith(path);
  },
  toHaveTrackedEvent: (name: string, data?: unknown) => {
    expect(full.analytics.trackEvent).toHaveBeenCalledWith(name, data);
  }
};

// Test cleanup
export function cleanup() {
  vi.clearAllMocks();
  full.data.cache.clear();
}

// Re-export testing-library utilities
export * from '@testing-library/react';
export { vi } from 'vitest'; 