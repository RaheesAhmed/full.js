export * from './types';
export * from './router';
export * from './middleware';
export { parseRoute } from './parser';
export { matchRoute } from './matcher';

import { Router } from './router';

// Create and export the router instance
export const router = new Router(); 