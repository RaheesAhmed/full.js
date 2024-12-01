export * from './types';
export * from './base';
export * from './hoc';
export * from './hooks';

import { createComponent } from './base';
import { compose, withErrorBoundary, withSuspense, withMemo, withSSR, withStyles } from './hoc';
import type { ComponentConfig, ComponentOptions, ComponentEvents, StyleConfig } from './types';

// Create and export the component API
export const component = {
  create: createComponent,
  compose,
  withErrorBoundary,
  withSuspense,
  withMemo,
  withSSR,
  withStyles,
  
  // Helper to create a component with common HOCs
  createEnhanced: <P extends object>(
    config: ComponentConfig<P>,
    options: ComponentOptions = {},
    events?: ComponentEvents<P>,
    styles?: StyleConfig
  ) => {
    const Component = createComponent(config, options, events, styles);

    return compose(
      options.errorBoundary && withErrorBoundary(),
      options.suspense && withSuspense(),
      options.memo && withMemo(),
      options.ssr && withSSR(),
      styles && withStyles(styles)
    )(Component);
  }
}; 