import type {
  Plugin,
  PluginConfig,
  PluginHooks,
  PluginAPI,
  PluginContext,
} from "./types";
import { createError, ErrorCodes } from "../errors";

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private hooks: Map<keyof PluginHooks, Set<PluginHooks[keyof PluginHooks]>> =
    new Map();
  private context: PluginContext;

  constructor(context: PluginContext) {
    this.context = context;
  }

  // Register a new plugin
  async register(config: PluginConfig, hooks: PluginHooks = {}): Promise<void> {
    // Validate plugin
    this.validatePlugin(config);

    // Check dependencies
    await this.checkDependencies(config);

    // Create plugin API
    const api = this.createPluginAPI(config);

    // Create plugin instance
    const plugin: Plugin = {
      config,
      hooks,
      api,
      context: this.context,
    };

    // Store plugin
    this.plugins.set(config.name, plugin);

    // Register hooks
    Object.entries(hooks).forEach(([hookName, callback]) => {
      this.registerHook(hookName as keyof PluginHooks, callback);
    });

    // Initialize plugin
    if (hooks.onInit) {
      await hooks.onInit();
    }
  }

  // Unregister a plugin
  async unregister(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw createError({
        code: ErrorCodes.PLUGIN_NOT_FOUND,
        message: `Plugin ${name} not found`,
        solution:
          "Make sure the plugin is registered before trying to unregister it",
      });
    }

    // Call destroy hook
    if (plugin.hooks.onDestroy) {
      await plugin.hooks.onDestroy();
    }

    // Remove hooks
    Object.entries(plugin.hooks).forEach(([hookName, callback]) => {
      this.hooks.get(hookName as keyof PluginHooks)?.delete(callback);
    });

    // Remove plugin
    this.plugins.delete(name);
  }

  // Execute hooks
  async executeHook(
    name: keyof PluginHooks,
    ...args: unknown[]
  ): Promise<void> {
    const hooks = this.hooks.get(name);
    if (!hooks) return;

    for (const hook of hooks) {
      try {
        await hook(...args);
      } catch (error) {
        throw createError({
          code: ErrorCodes.PLUGIN_HOOK_ERROR,
          message: `Error executing hook ${name}`,
          details: error instanceof Error ? error.message : "Unknown error",
          solution: "Check the plugin implementation and error handling",
        });
      }
    }
  }

  // Get plugin instance
  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  // Get all plugins
  getPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  // Private methods
  private validatePlugin(config: PluginConfig): void {
    if (!config.name) {
      throw createError({
        code: ErrorCodes.INVALID_PLUGIN_CONFIG,
        message: "Plugin name is required",
        solution: "Provide a name in the plugin configuration",
      });
    }

    if (this.plugins.has(config.name)) {
      throw createError({
        code: ErrorCodes.PLUGIN_ALREADY_REGISTERED,
        message: `Plugin ${config.name} is already registered`,
        solution:
          "Use a different name or unregister the existing plugin first",
      });
    }
  }

  private async checkDependencies(config: PluginConfig): Promise<void> {
    if (!config.dependencies) return;

    const missing = config.dependencies.filter((dep) => !this.plugins.has(dep));
    if (missing.length > 0) {
      throw createError({
        code: ErrorCodes.PLUGIN_DEPENDENCIES_NOT_MET,
        message: `Missing dependencies for plugin ${config.name}: ${missing.join(", ")}`,
        solution:
          "Install and register required dependencies before registering this plugin",
      });
    }
  }

  private createPluginAPI(config: PluginConfig): PluginAPI {
    return {
      registerHook: (hook, callback) => this.registerHook(hook, callback),
      registerMiddleware: (middleware) => {
        // Implementation will be added
      },
      registerComponent: (name, component) => {
        // Implementation will be added
      },
      registerRoute: (path, component) => {
        // Implementation will be added
      },
      getState: (key) => {
        // Implementation will be added
        return undefined;
      },
      setState: (key, value) => {
        // Implementation will be added
      },
      subscribe: (key, callback) => {
        // Implementation will be added
        return () => {};
      },
      logger: {
        debug: (message, ...args) =>
          console.debug(`[${config.name}]`, message, ...args),
        info: (message, ...args) =>
          console.info(`[${config.name}]`, message, ...args),
        warn: (message, ...args) =>
          console.warn(`[${config.name}]`, message, ...args),
        error: (message, ...args) =>
          console.error(`[${config.name}]`, message, ...args),
      },
      config,
      context: this.context,
    };
  }

  private registerHook(
    name: keyof PluginHooks,
    callback: PluginHooks[keyof PluginHooks]
  ): void {
    if (!this.hooks.has(name)) {
      this.hooks.set(name, new Set());
    }
    this.hooks.get(name)?.add(callback);
  }
}
