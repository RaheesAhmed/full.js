import type { Request, Response, NextFunction } from "express";
import { SecurityHeadersConfig } from "../types";
import { createError } from "../errors";
import { JSDOM } from "jsdom";
import DOMPurify from "dompurify";

// Create DOMPurify instance
const window = new JSDOM("").window;
const purify = DOMPurify(window);

// Default CSP directives
const defaultCSP = {
  "default-src": ["'self'"],
  "script-src": ["'self'", "'strict-dynamic'"],
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": ["'self'", "data:", "https:"],
  "font-src": ["'self'"],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'none'"],
  "upgrade-insecure-requests": [],
};

export class XSSProtection {
  private config: SecurityHeadersConfig;

  constructor(config: SecurityHeadersConfig) {
    this.config = {
      contentSecurityPolicy: true,
      xssProtection: true,
      noSniff: true,
      frameGuard: true,
      ...config,
    };
  }

  // XSS protection middleware
  protect = (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Set security headers
      this.setSecurityHeaders(res);

      // Sanitize input
      this.sanitizeRequest(req);

      next();
    } catch (error) {
      next(error);
    }
  };

  // Sanitize HTML content
  sanitize(content: string): string {
    return purify.sanitize(content, {
      ALLOWED_TAGS: [
        "a",
        "b",
        "br",
        "div",
        "em",
        "i",
        "li",
        "ol",
        "p",
        "span",
        "strong",
        "ul",
      ],
      ALLOWED_ATTR: ["href", "class", "id", "style"],
      ALLOW_DATA_ATTR: false,
      SAFE_FOR_TEMPLATES: true,
    });
  }

  // Set security headers
  private setSecurityHeaders(res: Response): void {
    // Content Security Policy
    if (this.config.contentSecurityPolicy) {
      const csp =
        typeof this.config.contentSecurityPolicy === "object"
          ? this.config.contentSecurityPolicy
          : defaultCSP;

      const cspHeader = Object.entries(csp)
        .map(([key, values]) => {
          if (values.length === 0) return key;
          return `${key} ${values.join(" ")}`;
        })
        .join("; ");

      res.setHeader("Content-Security-Policy", cspHeader);
    }

    // X-XSS-Protection
    if (this.config.xssProtection) {
      const xssValue =
        typeof this.config.xssProtection === "string"
          ? this.config.xssProtection
          : "1; mode=block";
      res.setHeader("X-XSS-Protection", xssValue);
    }

    // X-Content-Type-Options
    if (this.config.noSniff) {
      res.setHeader("X-Content-Type-Options", "nosniff");
    }

    // X-Frame-Options
    if (this.config.frameGuard) {
      const frameGuardValue =
        typeof this.config.frameGuard === "object"
          ? this.config.frameGuard.action +
            (this.config.frameGuard.domain
              ? ` ${this.config.frameGuard.domain}`
              : "")
          : "SAMEORIGIN";
      res.setHeader("X-Frame-Options", frameGuardValue);
    }
  }

  // Sanitize request input
  private sanitizeRequest(req: Request): void {
    if (req.body) {
      this.sanitizeObject(req.body);
    }

    if (req.query) {
      this.sanitizeObject(req.query);
    }

    if (req.params) {
      this.sanitizeObject(req.params);
    }
  }

  // Recursively sanitize object
  private sanitizeObject(obj: any): void {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];

        if (typeof value === "string") {
          obj[key] = this.sanitize(value);
        } else if (typeof value === "object" && value !== null) {
          this.sanitizeObject(value);
        }
      }
    }
  }
}

// Create XSS protection
export function createXSSProtection(
  config: SecurityHeadersConfig
): XSSProtection {
  return new XSSProtection(config);
}

// HTML sanitizer utility
export function sanitizeHTML(content: string): string {
  return purify.sanitize(content, {
    ALLOWED_TAGS: [
      "a",
      "b",
      "br",
      "div",
      "em",
      "i",
      "li",
      "ol",
      "p",
      "span",
      "strong",
      "ul",
    ],
    ALLOWED_ATTR: ["href", "class", "id", "style"],
    ALLOW_DATA_ATTR: false,
    SAFE_FOR_TEMPLATES: true,
  });
}

// URL sanitizer utility
export function sanitizeURL(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.toString();
  } catch {
    throw createError({
      code: "INVALID_URL",
      message: "Invalid URL provided",
      status: 400,
    });
  }
}

// Script sanitizer utility
export function sanitizeScript(script: string): string {
  return purify.sanitize(script, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

// Style sanitizer utility
export function sanitizeStyle(style: string): string {
  return purify.sanitize(style, {
    ALLOWED_TAGS: ["style"],
    ALLOWED_ATTR: [],
  });
}
