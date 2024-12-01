import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { ComponentEvents, AnimationConfig } from './types';

// Lifecycle hook
export function useComponentLifecycle<T>(events: ComponentEvents<T>) {
  const { onMount, onUpdate, onUnmount, onError } = events;
  const prevProps = useRef<T>();

  useEffect(() => {
    try {
      const cleanup = onMount?.();
      return () => {
        cleanup?.();
        onUnmount?.();
      };
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Unknown error'));
    }
  }, []);

  useEffect(() => {
    if (prevProps.current !== undefined && onUpdate) {
      try {
        onUpdate(prevProps.current, {} as T);
      } catch (error) {
        onError?.(error instanceof Error ? error : new Error('Unknown error'));
      }
    }
  });
}

// Animation hook
export function useAnimation(config: AnimationConfig) {
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const animate = useCallback((type: 'enter' | 'exit') => {
    const animation = type === 'enter' ? config.enter : config.exit;
    if (!animation) return;

    setIsAnimating(true);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
    }, config.duration || 300);

    return animation;
  }, [config]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isAnimating,
    animate,
    enter: () => animate('enter'),
    exit: () => animate('exit')
  };
}

// Intersection observer hook
export function useIntersection(options?: IntersectionObserverInit) {
  const [isIntersecting, setIntersecting] = useState(false);
  const elementRef = useRef<Element | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (elementRef.current) {
      observerRef.current = new IntersectionObserver(([entry]) => {
        setIntersecting(entry.isIntersecting);
      }, options);

      observerRef.current.observe(elementRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [options]);

  return [elementRef, isIntersecting] as const;
}

// Resize observer hook
export function useResize<T extends Element>() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const elementRef = useRef<T | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    if (elementRef.current) {
      observerRef.current = new ResizeObserver(([entry]) => {
        const { width, height } = entry.contentRect;
        setSize({ width, height });
      });

      observerRef.current.observe(elementRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return [elementRef, size] as const;
}

// Previous value hook
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

// Debounce hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Throttle hook
export function useThrottle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());
  const timeout = useRef<NodeJS.Timeout>();

  return useMemo(
    () =>
      ((...args: Parameters<T>) => {
        const now = Date.now();

        if (now - lastRun.current >= delay) {
          fn(...args);
          lastRun.current = now;
        } else {
          if (timeout.current) {
            clearTimeout(timeout.current);
          }

          timeout.current = setTimeout(() => {
            fn(...args);
            lastRun.current = Date.now();
          }, delay);
        }
      }) as T,
    [fn, delay]
  );
} 