import type { NextFunction, Request, Response } from "express";

// User types
export interface User {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
  metadata?: Record<string, unknown>;
}

// Authentication types
export interface AuthConfig {
  type: "jwt" | "session" | "oauth";
  providers?: AuthProvider[];
  session?: SessionConfig;
  jwt?: JWTConfig;
  oauth?: OAuthConfig;
}

export interface AuthProvider {
  name: string;
  type: "oauth" | "credentials" | "magic-link";
  config: OAuthProviderConfig | CredentialsConfig | MagicLinkConfig;
}

export interface OAuthProviderConfig {
  clientId: string;
  clientSecret: string;
  authorizeUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scope: string[];
  profileFields: {
    id: string;
    email: string;
    name?: string;
    avatar?: string;
  };
}

export interface CredentialsConfig {
  authorize: (credentials: Record<string, string>) => Promise<User | null>;
  fields: Array<{
    name: string;
    type: "text" | "password" | "email";
    required?: boolean;
    validate?: (value: string) => boolean | string;
  }>;
}

export interface MagicLinkConfig {
  generateToken: () => string;
  sendToken: (email: string, token: string) => Promise<void>;
  validateToken: (token: string) => Promise<boolean>;
}

// Session types
export interface SessionConfig {
  name: string;
  secret: string;
  store?: SessionStore;
  cookie?: CookieOptions;
  maxAge?: number;
  rolling?: boolean;
  renew?: boolean;
}

export interface SessionStore {
  get: (id: string) => Promise<any>;
  set: (id: string, value: any, maxAge?: number) => Promise<void>;
  destroy: (id: string) => Promise<void>;
  touch?: (id: string, maxAge?: number) => Promise<void>;
}

// JWT types
export interface JWTConfig {
  secret: string;
  algorithm?: string;
  expiresIn?: string | number;
  refreshToken?: {
    secret: string;
    expiresIn: string | number;
  };
  cookie?: CookieOptions;
}

// OAuth types
export interface OAuthConfig {
  providers: OAuthProvider[];
  callbackUrl: string;
  successRedirect: string;
  failureRedirect: string;
}

export interface OAuthProvider {
  name: string;
  config: OAuthProviderConfig;
}

// Cookie options
export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: boolean | "lax" | "strict" | "none";
  domain?: string;
  path?: string;
  maxAge?: number;
  signed?: boolean;
}

// CSRF types
export interface CSRFConfig {
  enabled: boolean;
  secret?: string;
  cookie?: CookieOptions;
  ignoreMethods?: string[];
  ignorePaths?: string[];
}

// Rate limiting types
export interface RateLimitConfig {
  enabled: boolean;
  store?: RateLimitStore;
  windowMs?: number;
  max?: number;
  message?: string;
  statusCode?: number;
  skipFailedRequests?: boolean;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (req: Request) => string;
  handler?: (req: Request, res: Response) => void;
  skip?: (req: Request) => boolean;
}

export interface RateLimitStore {
  increment: (key: string) => Promise<RateLimitInfo>;
  decrement: (key: string) => Promise<void>;
  resetKey: (key: string) => Promise<void>;
  resetAll: () => Promise<void>;
}

export interface RateLimitInfo {
  totalHits: number;
  resetTime: Date;
}

// Security headers
export interface SecurityHeadersConfig {
  contentSecurityPolicy?: boolean | Record<string, string[]>;
  xssProtection?: boolean | string;
  hsts?:
    | boolean
    | {
        maxAge: number;
        includeSubDomains?: boolean;
        preload?: boolean;
      };
  noSniff?: boolean;
  frameGuard?:
    | boolean
    | {
        action: "DENY" | "SAMEORIGIN" | "ALLOW-FROM";
        domain?: string;
      };
}

// Middleware types
export type SecurityMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void> | void;

export interface SecurityContext {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: Record<string, string>) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  getToken: () => string | null;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
}

// Error types
export interface SecurityError extends Error {
  code: string;
  status: number;
  details?: unknown;
}

// Configuration type
export interface SecurityConfig {
  auth?: AuthConfig;
  session?: SessionConfig;
  csrf?: CSRFConfig;
  rateLimit?: RateLimitConfig;
  headers?: SecurityHeadersConfig;
}
