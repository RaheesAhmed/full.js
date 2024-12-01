import React, { ComponentType, Suspense, Component } from 'react';
import type { HOC, ErrorBoundaryProps, SuspenseBoundaryProps } from './types';
import { createError, ErrorCodes } from '../errors';

// withErrorBoundary HOC
export function withErrorBoundary<P extends object>(
  fallback?: ErrorBoundaryProps['fallback']
): HOC<P, P & ErrorBoundaryProps> {
  return (WrappedComponent) => {
    class ErrorBoundary extends Component<P & ErrorBoundaryProps> {
      state = { error: null as Error | null };

      static getDerivedStateFromError(error: Error) {
        return { error };
      }

      componentDidCatch(error: Error) {
        const { onError } = this.props;
        if (onError) {
          onError(error);
        }
      }

      render() {
        const { error } = this.state;
        const { fallback: propFallback, ...rest } = this.props;

        if (error) {
          const fallbackElement = propFallback || fallback;
          return typeof fallbackElement === 'function'
            ? fallbackElement(error)
            : fallbackElement || null;
        }

        return <WrappedComponent {...(rest as P)} />;
      }
    }

    ErrorBoundary.displayName = `withErrorBoundary(${
      WrappedComponent.displayName || WrappedComponent.name || 'Component'
    })`;

    return ErrorBoundary;
  };
}

// withSuspense HOC
export function withSuspense<P extends object>(
  fallback?: SuspenseBoundaryProps['fallback']
): HOC<P, P & SuspenseBoundaryProps> {
  return (WrappedComponent) => {
    function SuspenseBoundary(props: P & SuspenseBoundaryProps) {
      const { fallback: propFallback, maxDuration, ...rest } = props;

      return (
        <Suspense fallback={propFallback || fallback || null}>
          <WrappedComponent {...(rest as P)} />
        </Suspense>
      );
    }

    SuspenseBoundary.displayName = `withSuspense(${
      WrappedComponent.displayName || WrappedComponent.name || 'Component'
    })`;

    return SuspenseBoundary;
  };
}

// withMemo HOC
export function withMemo<P extends object>(
  areEqual?: (prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean
): HOC<P> {
  return (WrappedComponent) => {
    const MemoComponent = React.memo(WrappedComponent, areEqual);

    MemoComponent.displayName = `withMemo(${
      WrappedComponent.displayName || WrappedComponent.name || 'Component'
    })`;

    return MemoComponent;
  };
}

// withSSR HOC
export function withSSR<P extends object>(
  getInitialProps?: (ctx: any) => Promise<Partial<P>>
): HOC<P> {
  return (WrappedComponent) => {
    function SSRComponent(props: P) {
      return <WrappedComponent {...props} />;
    }

    SSRComponent.displayName = `withSSR(${
      WrappedComponent.displayName || WrappedComponent.name || 'Component'
    })`;

    SSRComponent.getInitialProps = getInitialProps;

    return SSRComponent;
  };
}

// withStyles HOC
export function withStyles<P extends object>(
  styles: string | ((props: P) => string)
): HOC<P> {
  return (WrappedComponent) => {
    function StyledComponent(props: P) {
      const className = typeof styles === 'function' ? styles(props) : styles;

      return <WrappedComponent {...props} className={className} />;
    }

    StyledComponent.displayName = `withStyles(${
      WrappedComponent.displayName || WrappedComponent.name || 'Component'
    })`;

    return StyledComponent;
  };
}

// Compose HOCs
export function compose<P>(...hocs: HOC[]): HOC<P> {
  return (WrappedComponent) => {
    return hocs.reduceRight(
      (acc, hoc) => hoc(acc),
      WrappedComponent as ComponentType<any>
    );
  };
} 