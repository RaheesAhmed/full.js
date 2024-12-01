import type {
  Plugin,
  PluginConfig,
  PluginHooks,
  SecurityContext,
  RouteContext,
} from "./types";
import { createError, ErrorCodes } from "../errors";

export function createSecurityPlugin(): Plugin {
  const config: PluginConfig = {
    name: "@full/plugin-security",
    version: "0.1.0",
    enabled: true,
  };

  const hooks: PluginHooks = {
    onInit: async () => {
      // Initialize security manager
      await securityManager.initialize();
    },
    onBeforeRoute: async (ctx: RouteContext) => {
      // Check route permissions
      await securityManager.checkRouteAccess(ctx);
    },
  };

  return {
    config,
    hooks,
    api: {} as any, // Will be injected by plugin manager
    context: {} as any, // Will be injected by plugin manager
  };
}

// Security manager implementation
class SecurityManager {
  private user: unknown = null;
  private token: string | null = null;
  private permissions: Set<string> = new Set();
  private routePermissions: Map<string, string[]> = new Map();
  private authStrategies: Map<string, AuthStrategy> = new Map();

  // Initialize
  async initialize(): Promise<void> {
    // Restore session
    await this.restoreSession();

    // Setup auth strategies
    this.setupAuthStrategies();
  }

  // Authentication
  async login(
    credentials: unknown,
    strategy: string = "default"
  ): Promise<void> {
    const authStrategy = this.authStrategies.get(strategy);
    if (!authStrategy) {
      throw createError({
        code: ErrorCodes.AUTH_STRATEGY_NOT_FOUND,
        message: `Auth strategy ${strategy} not found`,
        solution: "Register the auth strategy before attempting to use it",
      });
    }

    try {
      const result = await authStrategy.authenticate(credentials);

      this.user = result.user;
      this.token = result.token;
      this.permissions = new Set(result.permissions);

      // Persist session
      await this.persistSession();
    } catch (error) {
      throw createError({
        code: ErrorCodes.AUTH_FAILED,
        message: "Authentication failed",
        details: error instanceof Error ? error.message : "Unknown error",
        solution: "Check your credentials and try again",
      });
    }
  }

  async logout(): Promise<void> {
    this.user = null;
    this.token = null;
    this.permissions.clear();

    // Clear session
    await this.clearSession();
  }

  // Authorization
  registerRoutePermissions(path: string, permissions: string[]): void {
    this.routePermissions.set(path, permissions);
  }

  async checkRouteAccess(ctx: RouteContext): Promise<void> {
    const requiredPermissions = this.routePermissions.get(ctx.path);
    if (!requiredPermissions) return;

    if (!this.user) {
      throw createError({
        code: ErrorCodes.AUTH_REQUIRED,
        message: "Authentication required",
        solution: "Log in to access this route",
      });
    }

    const hasPermission = requiredPermissions.every((permission) =>
      this.permissions.has(permission)
    );

    if (!hasPermission) {
      throw createError({
        code: ErrorCodes.UNAUTHORIZED,
        message: "Unauthorized access",
        solution:
          "You do not have the required permissions to access this route",
      });
    }
  }

  // Get security context
  getContext(): SecurityContext {
    return {
      user: this.user,
      isAuthenticated: !!this.user,
      permissions: Array.from(this.permissions),
      token: this.token || undefined,
    };
  }

  // Private methods
  private async restoreSession(): Promise<void> {
    try {
      const session = localStorage.getItem("full:session");
      if (!session) return;

      const { user, token, permissions } = JSON.parse(session);
      this.user = user;
      this.token = token;
      this.permissions = new Set(permissions);
    } catch {
      // Session restoration failed, clear it
      await this.clearSession();
    }
  }

  private async persistSession(): Promise<void> {
    const session = {
      user: this.user,
      token: this.token,
      permissions: Array.from(this.permissions),
    };
    localStorage.setItem("full:session", JSON.stringify(session));
  }

  private async clearSession(): Promise<void> {
    localStorage.removeItem("full:session");
  }

  private setupAuthStrategies(): void {
    // Register default strategies
    this.authStrategies.set("jwt", new JWTStrategy());
    this.authStrategies.set("session", new SessionStrategy());
  }
}

// Auth strategy interface
interface AuthStrategy {
  authenticate(credentials: unknown): Promise<{
    user: unknown;
    token: string;
    permissions: string[];
  }>;
}

// JWT strategy implementation
class JWTStrategy implements AuthStrategy {
  async authenticate(credentials: unknown): Promise<{
    user: unknown;
    token: string;
    permissions: string[];
  }> {
    // Implementation will be added
    throw new Error("Not implemented");
  }
}

// Session strategy implementation
class SessionStrategy implements AuthStrategy {
  async authenticate(credentials: unknown): Promise<{
    user: unknown;
    token: string;
    permissions: string[];
  }> {
    // Implementation will be added
    throw new Error("Not implemented");
  }
}

// Export security manager instance
export const securityManager = new SecurityManager();
