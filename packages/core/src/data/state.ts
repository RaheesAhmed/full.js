import type { StateManager, StateConfig } from './types';
import { createError, ErrorCodes } from '../errors';

export class GlobalStateManager implements StateManager {
  private state: Map<string, unknown> = new Map();
  private subscribers: Map<string, Set<(value: unknown) => void>> = new Map();
  private persistenceKey = '@full/state';

  constructor() {
    this.hydrate();
  }

  get<T>(key: string): T | undefined {
    return this.state.get(key) as T | undefined;
  }

  set<T>(key: string, value: T, config?: StateConfig<T>): void {
    const oldValue = this.get<T>(key);
    this.state.set(key, value);

    // Notify subscribers
    const subscribers = this.subscribers.get(key);
    if (subscribers) {
      subscribers.forEach(callback => callback(value));
    }

    // Handle persistence
    if (config?.persist) {
      this.persist(key, value);
    }

    // Handle onChange callback
    if (config?.onChange && oldValue !== value) {
      config.onChange(value, oldValue as T);
    }
  }

  subscribe<T>(key: string, callback: (value: T) => void): () => void {
    let subscribers = this.subscribers.get(key);
    if (!subscribers) {
      subscribers = new Set();
      this.subscribers.set(key, subscribers);
    }

    subscribers.add(callback as (value: unknown) => void);

    // Return unsubscribe function
    return () => {
      subscribers?.delete(callback as (value: unknown) => void);
      if (subscribers?.size === 0) {
        this.subscribers.delete(key);
      }
    };
  }

  persist<T>(key: string, value: T): void {
    try {
      const storage = this.getStorage('local');
      const persistedData = this.loadPersistedData();
      persistedData[key] = value;
      storage.setItem(this.persistenceKey, JSON.stringify(persistedData));
    } catch (error) {
      throw createError({
        code: ErrorCodes.STATE_PERSISTENCE_FAILED,
        message: `Failed to persist state for key: ${key}`,
        details: error instanceof Error ? error.message : 'Unknown error',
        solution: 'Check storage quota and browser permissions'
      });
    }
  }

  hydrate(): void {
    try {
      const persistedData = this.loadPersistedData();
      Object.entries(persistedData).forEach(([key, value]) => {
        this.state.set(key, value);
      });
    } catch (error) {
      throw createError({
        code: ErrorCodes.STATE_HYDRATION_FAILED,
        message: 'Failed to hydrate state from storage',
        details: error instanceof Error ? error.message : 'Unknown error',
        solution: 'Check storage data integrity and browser permissions'
      });
    }
  }

  private loadPersistedData(): Record<string, unknown> {
    const storage = this.getStorage('local');
    const data = storage.getItem(this.persistenceKey);
    return data ? JSON.parse(data) : {};
  }

  private getStorage(scope: 'local' | 'session'): Storage {
    return scope === 'local' ? localStorage : sessionStorage;
  }
}

// Create and export singleton instance
export const stateManager = new GlobalStateManager(); 