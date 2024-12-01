import type { Middleware, RouteContext, MiddlewareHandler } from './types';
import { createError, ErrorCodes } from '../errors';

export class MiddlewareChain {
  private middlewares: Middleware[] = [];

  add(middleware: Middleware): void {
    this.middlewares.push(middleware);
  }

  addBefore(middleware: Middleware): void {
    this.middlewares.unshift({
      ...middleware,
      phase: 'before'
    });
  }

  addAfter(middleware: Middleware): void {
    this.middlewares.push({
      ...middleware,
      phase: 'after'
    });
  }

  async execute(context: RouteContext): Promise<void> {
    const beforeMiddlewares = this.middlewares.filter(m => m.phase !== 'after');
    const afterMiddlewares = this.middlewares.filter(m => m.phase === 'after');

    // Execute before middlewares
    await this.executeChain(beforeMiddlewares, context);

    // Execute after middlewares
    await this.executeChain(afterMiddlewares, context);
  }

  private async executeChain(
    middlewares: Middleware[],
    context: RouteContext
  ): Promise<void> {
    let index = 0;

    const next = async (): Promise<void> => {
      if (index >= middlewares.length) {
        return;
      }

      const middleware = middlewares[index++];
      
      try {
        await middleware.handler(context, next);
      } catch (error) {
        throw createError({
          code: ErrorCodes.MIDDLEWARE_ERROR,
          message: `Middleware '${middleware.name}' failed`,
          details: error instanceof Error ? error.message : 'Unknown error',
          solution: 'Check middleware implementation and error handling'
        });
      }
    };

    await next();
  }
}

// Built-in middlewares
export const builtInMiddlewares = {
  logger: createLoggerMiddleware(),
  timing: createTimingMiddleware(),
  errorBoundary: createErrorBoundaryMiddleware()
};

function createLoggerMiddleware(): Middleware {
  return {
    name: 'logger',
    handler: async (context, next) => {
      console.log(`[Route] ${context.pathname}`);
      await next();
      console.log(`[Route] Complete: ${context.pathname}`);
    }
  };
}

function createTimingMiddleware(): Middleware {
  return {
    name: 'timing',
    handler: async (context, next) => {
      const start = performance.now();
      await next();
      const duration = performance.now() - start;
      console.log(`[Route] Duration: ${duration.toFixed(2)}ms`);
    }
  };
}

function createErrorBoundaryMiddleware(): Middleware {
  return {
    name: 'errorBoundary',
    handler: async (context, next) => {
      try {
        await next();
      } catch (error) {
        console.error('[Route] Error:', error);
        throw error; // Re-throw to be handled by error boundary
      }
    }
  };
} 