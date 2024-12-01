export * from './page';
export * from './component';
export * from './data';
export * from './secure';
export * from './optimize';
export * from './types';
export * from './errors';
export * from './utils';

import { createFullInstance } from './instance';

export const full = createFullInstance(); 