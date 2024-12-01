import type { Request, Response, NextFunction } from "express";
import type {
  AuthConfig,
  User,
  SecurityError,
  SecurityContext,
  AuthProvider,
} from "../types";
import { createError } from "../errors";
import { createJWTAuth } from "./jwt";
import { createSessionAuth } from "./session";
import { createOAuthAuth } from "./oauth";

export class AuthManager {
  private config: AuthConfig;
  private providers: Map<string, AuthProvider>;
  private context: SecurityContext | null = null;

  constructor(config: AuthConfig) {
    this.config = config;
    this.providers = new Map();

    // Initialize providers
    if (config.providers) {
      config.providers.forEach((provider) => {
        this.providers.set(provider.name, provider);
      });
    }
  }

  // Initialize authentication
  async initialize(): Promise<void> {
    switch (this.config.type) {
      case "jwt":
        if (!this.config.jwt) {
          throw createError({
            code: "AUTH_CONFIG_ERROR",
            message: "JWT configuration is required for JWT authentication",
            status: 500,
          });
        }
        this.context = await createJWTAuth(this.config.jwt);
        break;

      case "session":
        if (!this.config.session) {
          throw createError({
            code: "AUTH_CONFIG_ERROR",
            message:
              "Session configuration is required for session authentication",
            status: 500,
          });
        }
        this.context = await createSessionAuth(this.config.session);
        break;

      case "oauth":
        if (!this.config.oauth) {
          throw createError({
            code: "AUTH_CONFIG_ERROR",
            message: "OAuth configuration is required for OAuth authentication",
            status: 500,
          });
        }
        this.context = await createOAuthAuth(this.config.oauth);
        break;

      default:
        throw createError({
          code: "AUTH_CONFIG_ERROR",
          message: `Unsupported authentication type: ${this.config.type}`,
          status: 500,
        });
    }
  }

  // Get security context
  getContext(): SecurityContext {
    if (!this.context) {
      throw createError({
        code: "AUTH_NOT_INITIALIZED",
        message: "Authentication has not been initialized",
        status: 500,
      });
    }
    return this.context;
  }

  // Authentication middleware
  authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const context = this.getContext();

      // Check for existing authentication
      if (context.isAuthenticated) {
        return next();
      }

      // Try to authenticate
      const token = this.extractToken(req);
      if (token) {
        await this.validateToken(token);
        return next();
      }

      throw createError({
        code: "UNAUTHORIZED",
        message: "Authentication required",
        status: 401,
      });
    } catch (error) {
      next(error);
    }
  };

  // Role-based authorization middleware
  requireRole = (role: string) => {
    return async (
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const context = this.getContext();
        if (!context.hasRole(role)) {
          throw createError({
            code: "FORBIDDEN",
            message: `Required role: ${role}`,
            status: 403,
          });
        }
        next();
      } catch (error) {
        next(error);
      }
    };
  };

  // Permission-based authorization middleware
  requirePermission = (permission: string) => {
    return async (
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const context = this.getContext();
        if (!context.hasPermission(permission)) {
          throw createError({
            code: "FORBIDDEN",
            message: `Required permission: ${permission}`,
            status: 403,
          });
        }
        next();
      } catch (error) {
        next(error);
      }
    };
  };

  // Provider management
  addProvider(provider: AuthProvider): void {
    this.providers.set(provider.name, provider);
  }

  removeProvider(name: string): void {
    this.providers.delete(name);
  }

  getProvider(name: string): AuthProvider | undefined {
    return this.providers.get(name);
  }

  // Token management
  private extractToken(req: Request): string | null {
    // Try Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      return authHeader.substring(7);
    }

    // Try cookie
    if (this.config.jwt?.cookie) {
      const token = req.cookies[this.config.jwt.cookie.name];
      if (token) {
        return token;
      }
    }

    // Try query parameter
    const queryToken = req.query.token;
    if (typeof queryToken === "string") {
      return queryToken;
    }

    return null;
  }

  private async validateToken(token: string): Promise<void> {
    const context = this.getContext();
    try {
      await context.refresh();
    } catch (error) {
      throw createError({
        code: "INVALID_TOKEN",
        message: "Invalid or expired token",
        status: 401,
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}

// Create authentication manager
export function createAuth(config: AuthConfig): AuthManager {
  return new AuthManager(config);
}
