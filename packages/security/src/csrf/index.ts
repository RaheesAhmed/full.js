import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import type { CSRFConfig } from "../types";
import { createError } from "../errors";

const CSRF_HEADER = "x-csrf-token";
const CSRF_COOKIE = "_csrf";

export class CSRFProtection {
  private config: CSRFConfig;
  private tokens: Map<string, { value: string; expires: number }>;

  constructor(config: CSRFConfig) {
    this.config = config;
    this.tokens = new Map();

    // Clean up expired tokens periodically
    setInterval(() => this.cleanupExpiredTokens(), 60 * 1000); // Every minute
  }

  // Middleware to protect against CSRF
  protect = (req: Request, res: Response, next: NextFunction): void => {
    if (!this.config.enabled) {
      return next();
    }

    // Skip CSRF check for specified methods
    if (
      this.config.ignoreMethods?.includes(req.method.toUpperCase()) ||
      this.isPathIgnored(req.path)
    ) {
      return next();
    }

    try {
      // Verify CSRF token
      const token = this.getTokenFromRequest(req);
      const storedToken = this.tokens.get(req.sessionID);

      if (!token || !storedToken || token !== storedToken.value) {
        throw createError({
          code: "INVALID_CSRF_TOKEN",
          message: "Invalid CSRF token",
          status: 403,
        });
      }

      // Token is valid, proceed
      next();
    } catch (error) {
      next(error);
    }
  };

  // Generate new CSRF token
  generateToken = (req: Request, res: Response): string => {
    const token = crypto.randomBytes(32).toString("hex");
    const expires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Store token
    this.tokens.set(req.sessionID, { value: token, expires });

    // Set CSRF cookie
    if (this.config.cookie) {
      res.cookie(CSRF_COOKIE, token, {
        ...this.config.cookie,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      });
    }

    return token;
  };

  // Get token from request
  private getTokenFromRequest(req: Request): string | null {
    // Check header
    const headerToken = req.headers[CSRF_HEADER];
    if (headerToken) {
      return Array.isArray(headerToken) ? headerToken[0] : headerToken;
    }

    // Check body
    if (req.body?._csrf) {
      return req.body._csrf;
    }

    // Check query
    if (req.query?._csrf) {
      return String(req.query._csrf);
    }

    // Check cookie
    if (this.config.cookie && req.cookies?.[CSRF_COOKIE]) {
      return req.cookies[CSRF_COOKIE];
    }

    return null;
  }

  // Check if path is in ignored paths
  private isPathIgnored(path: string): boolean {
    return Boolean(
      this.config.ignorePaths?.some((ignorePath) => {
        if (ignorePath instanceof RegExp) {
          return ignorePath.test(path);
        }
        return path.startsWith(ignorePath);
      })
    );
  }

  // Clean up expired tokens
  private cleanupExpiredTokens(): void {
    const now = Date.now();
    for (const [sessionId, token] of this.tokens.entries()) {
      if (token.expires <= now) {
        this.tokens.delete(sessionId);
      }
    }
  }
}

// Create CSRF protection
export function createCSRFProtection(config: CSRFConfig): CSRFProtection {
  return new CSRFProtection(config);
}

// CSRF token generator middleware
export function generateCSRFToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const csrf = new CSRFProtection({
    enabled: true,
    secret: process.env.CSRF_SECRET || crypto.randomBytes(32).toString("hex"),
  });

  const token = csrf.generateToken(req, res);
  res.locals.csrfToken = token;
  next();
}
