import React, { forwardRef, memo, useEffect, useRef } from 'react';
import type { ComponentConfig, ComponentOptions, ComponentEvents, StyleConfig } from './types';
import { createError, ErrorCodes } from '../errors';
import { useStyles } from '../hooks/useStyles';

export function createComponent<P extends object = {}>(
  config: ComponentConfig<P>,
  options: ComponentOptions = {},
  events?: ComponentEvents<P>,
  styles?: StyleConfig
) {
  const { name, render, optimize } = config;
  const { displayName = name, memo: shouldMemo = false } = options;

  // Create the base component
  const BaseComponent = forwardRef<unknown, P>((props, ref) => {
    const componentRef = useRef<unknown>(null);
    const previousProps = useRef<P>();
    const className = useStyles(styles, props);

    // Handle lifecycle events
    useEffect(() => {
      // Mount
      const cleanup = events?.onMount?.();
      
      // Unmount
      return () => {
        cleanup?.();
        events?.onUnmount?.();
      };
    }, []);

    // Handle updates
    useEffect(() => {
      if (previousProps.current && events?.onUpdate) {
        events.onUpdate(previousProps.current, props);
      }
      previousProps.current = props;
    }, [props]);

    try {
      const rendered = render({
        ...props,
        ref: ref || componentRef,
        className
      });

      if (!rendered && !options.ssr) {
        throw createError({
          code: ErrorCodes.COMPONENT_RENDER_FAILED,
          message: `Component ${name} rendered null`,
          solution: 'Ensure the render function returns a valid React element'
        });
      }

      return rendered;
    } catch (error) {
      if (events?.onError) {
        events.onError(error instanceof Error ? error : new Error('Unknown error'));
      }
      throw error;
    }
  });

  // Set display name
  BaseComponent.displayName = displayName;

  // Apply optimizations
  const Component = shouldMemo ? memo(BaseComponent) : BaseComponent;

  // Add metadata
  (Component as any).__full = {
    name,
    config,
    options,
    events,
    styles
  };

  return Component;
}

// Helper to check if a component is a FULL.js component
export function isFullComponent(component: unknown): boolean {
  return (
    typeof component === 'function' &&
    (component as any).__full !== undefined
  );
}

// Helper to get component metadata
export function getComponentMeta(component: unknown): ComponentConfig | null {
  if (!isFullComponent(component)) {
    return null;
  }
  return (component as any).__full.config;
} 