// Export types
export * from "./types";

// Export authentication
export { createAuth } from "./auth";
export { createJWTAuth, verifyToken } from "./auth/jwt";
export { createSessionAuth } from "./auth/session";
export { createOAuthAuth } from "./auth/oauth";

// Export CSRF protection
export { createCSRFProtection, generateCSRFToken } from "./csrf";

// Export rate limiting
export {
  createRateLimiter,
  RateLimiter,
  RedisStore as RateLimitRedisStore,
} from "./rate-limit";

// Export XSS protection
export {
  createXSSProtection,
  sanitizeHTML,
  sanitizeURL,
  sanitizeScript,
  sanitizeStyle,
} from "./xss";

// Export error utilities
export { createError } from "./errors";

// Create unified security middleware
import type { Request, Response, NextFunction } from "express";
import type { SecurityConfig } from "./types";
import { createAuth } from "./auth";
import { createCSRFProtection } from "./csrf";
import { createRateLimiter } from "./rate-limit";
import { createXSSProtection } from "./xss";

export function createSecurity(config: SecurityConfig) {
  // Initialize security components
  const auth = config.auth ? createAuth(config.auth) : null;
  const csrf = config.csrf ? createCSRFProtection(config.csrf) : null;
  const rateLimit = config.rateLimit
    ? createRateLimiter(config.rateLimit)
    : null;
  const xss = config.headers ? createXSSProtection(config.headers) : null;

  // Create unified middleware
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Initialize authentication
      if (auth) {
        await auth.initialize();
      }

      // Apply security middleware in sequence
      const middlewares = [
        auth?.authenticate,
        csrf?.protect,
        rateLimit?.limit,
        xss?.protect,
      ].filter(Boolean);

      // Execute middleware chain
      const executeMiddleware = async (index: number) => {
        if (index >= middlewares.length) {
          return next();
        }

        const middleware = middlewares[index];
        if (middleware) {
          await middleware(req, res, (error?: any) => {
            if (error) {
              return next(error);
            }
            return executeMiddleware(index + 1);
          });
        }
      };

      await executeMiddleware(0);
    } catch (error) {
      next(error);
    }
  };
}

// Export default configuration
export const defaultConfig: SecurityConfig = {
  auth: {
    type: "jwt",
    jwt: {
      secret: process.env.JWT_SECRET || "your-secret-key",
      expiresIn: "15m",
      refreshToken: {
        secret: process.env.REFRESH_TOKEN_SECRET || "your-refresh-secret-key",
        expiresIn: "7d",
      },
    },
  },
  csrf: {
    enabled: true,
    secret: process.env.CSRF_SECRET,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    },
  },
  rateLimit: {
    enabled: true,
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
  },
  headers: {
    contentSecurityPolicy: true,
    xssProtection: true,
    noSniff: true,
    frameGuard: true,
  },
};
