export * from './types';
export * from './manager';
export * from './cache';
export * from './state';
export * from './realtime';

import { dataManager } from './manager';

// Create and export the data API
export const data = {
  fetch: dataManager.fetch.bind(dataManager),
  mutate: dataManager.mutate.bind(dataManager),
  register: dataManager.registerFetcher.bind(dataManager),
  initialize: (config: { realtime?: boolean } = {}) => {
    if (config.realtime) {
      dataManager.initializeRealtime({
        enabled: true,
        batchUpdates: true,
        debounce: 100
      });
    }
  },
  getContext: dataManager.getContext.bind(dataManager)
}; 