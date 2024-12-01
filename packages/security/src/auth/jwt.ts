import jwt from "jsonwebtoken";
import type { JWTConfig, SecurityContext, User } from "../types";
import { createError } from "../errors";

interface JWTPayload {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
  metadata?: Record<string, unknown>;
  exp?: number;
  iat?: number;
}

export async function createJWTAuth(
  config: JWTConfig
): Promise<SecurityContext> {
  let currentUser: User | null = null;
  let currentToken: string | null = null;
  let refreshToken: string | null = null;

  return {
    user: currentUser,
    isAuthenticated: Boolean(currentUser),

    async login(credentials: Record<string, string>): Promise<User> {
      try {
        // Validate credentials and get user
        const user = await validateCredentials(credentials);
        if (!user) {
          throw createError({
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password",
            status: 401,
          });
        }

        // Create tokens
        currentToken = createAccessToken(user, config);
        if (config.refreshToken) {
          refreshToken = createRefreshToken(user, config);
        }

        // Set user
        currentUser = user;

        return user;
      } catch (error) {
        throw createError({
          code: "LOGIN_FAILED",
          message: "Failed to login",
          status: 401,
          details: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },

    async logout(): Promise<void> {
      currentUser = null;
      currentToken = null;
      refreshToken = null;
    },

    async refresh(): Promise<void> {
      if (!refreshToken || !config.refreshToken) {
        throw createError({
          code: "REFRESH_TOKEN_REQUIRED",
          message: "Refresh token is required",
          status: 401,
        });
      }

      try {
        // Verify refresh token
        const payload = jwt.verify(
          refreshToken,
          config.refreshToken.secret
        ) as JWTPayload;

        // Create new tokens
        currentToken = createAccessToken(
          {
            id: payload.sub,
            email: payload.email,
            roles: payload.roles,
            permissions: payload.permissions,
            metadata: payload.metadata,
          },
          config
        );

        refreshToken = createRefreshToken(
          {
            id: payload.sub,
            email: payload.email,
            roles: payload.roles,
            permissions: payload.permissions,
            metadata: payload.metadata,
          },
          config
        );
      } catch (error) {
        throw createError({
          code: "REFRESH_FAILED",
          message: "Failed to refresh token",
          status: 401,
          details: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },

    getToken(): string | null {
      return currentToken;
    },

    hasRole(role: string): boolean {
      return currentUser?.roles.includes(role) || false;
    },

    hasPermission(permission: string): boolean {
      return currentUser?.permissions.includes(permission) || false;
    },
  };
}

// Create access token
function createAccessToken(user: User, config: JWTConfig): string {
  const payload: JWTPayload = {
    sub: user.id,
    email: user.email,
    roles: user.roles,
    permissions: user.permissions,
    metadata: user.metadata,
  };

  return jwt.sign(payload, config.secret, {
    algorithm: config.algorithm || "HS256",
    expiresIn: config.expiresIn || "15m",
  });
}

// Create refresh token
function createRefreshToken(user: User, config: JWTConfig): string {
  if (!config.refreshToken) {
    throw createError({
      code: "REFRESH_TOKEN_CONFIG_MISSING",
      message: "Refresh token configuration is missing",
      status: 500,
    });
  }

  const payload: JWTPayload = {
    sub: user.id,
    email: user.email,
    roles: user.roles,
    permissions: user.permissions,
    metadata: user.metadata,
  };

  return jwt.sign(payload, config.refreshToken.secret, {
    algorithm: config.algorithm || "HS256",
    expiresIn: config.refreshToken.expiresIn || "7d",
  });
}

// Verify token
export function verifyToken(
  token: string,
  secret: string,
  options?: jwt.VerifyOptions
): JWTPayload {
  try {
    return jwt.verify(token, secret, options) as JWTPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw createError({
        code: "TOKEN_EXPIRED",
        message: "Token has expired",
        status: 401,
      });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw createError({
        code: "INVALID_TOKEN",
        message: "Invalid token",
        status: 401,
      });
    }
    throw error;
  }
}

// Mock function for credential validation
// In a real application, this would validate against a database
async function validateCredentials(
  credentials: Record<string, string>
): Promise<User | null> {
  const { email, password } = credentials;

  // Mock validation
  if (email === "test@example.com" && password === "password") {
    return {
      id: "1",
      email: "test@example.com",
      roles: ["user"],
      permissions: ["read:profile", "write:profile"],
      metadata: {
        name: "Test User",
      },
    };
  }

  return null;
}
