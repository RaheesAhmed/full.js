import type { Request, Response, NextFunction } from "express";
import type { RateLimitConfig, RateLimitStore, RateLimitInfo } from "../types";
import { createError } from "../errors";

// Memory store implementation
class MemoryStore implements RateLimitStore {
  private store: Map<string, { hits: number; resetTime: Date }>;

  constructor() {
    this.store = new Map();
  }

  async increment(key: string): Promise<RateLimitInfo> {
    const now = new Date();
    const record = this.store.get(key);

    if (!record || record.resetTime < now) {
      // Create new record
      const resetTime = new Date(now.getTime() + 60000); // 1 minute from now
      this.store.set(key, { hits: 1, resetTime });
      return { totalHits: 1, resetTime };
    }

    // Increment existing record
    record.hits += 1;
    return { totalHits: record.hits, resetTime: record.resetTime };
  }

  async decrement(key: string): Promise<void> {
    const record = this.store.get(key);
    if (record && record.hits > 0) {
      record.hits -= 1;
    }
  }

  async resetKey(key: string): Promise<void> {
    this.store.delete(key);
  }

  async resetAll(): Promise<void> {
    this.store.clear();
  }
}

export class RateLimiter {
  private config: RateLimitConfig;
  private store: RateLimitStore;

  constructor(config: RateLimitConfig) {
    this.config = {
      enabled: true,
      windowMs: 60000, // 1 minute
      max: 100, // 100 requests per minute
      message: "Too many requests, please try again later.",
      statusCode: 429,
      ...config,
    };

    this.store = config.store || new MemoryStore();
  }

  // Rate limiting middleware
  limit = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!this.config.enabled) {
      return next();
    }

    try {
      // Check if request should be skipped
      if (this.shouldSkip(req)) {
        return next();
      }

      // Generate key
      const key = this.generateKey(req);

      // Increment hits
      const { totalHits, resetTime } = await this.store.increment(key);

      // Set headers
      this.setHeaders(res, totalHits, resetTime);

      // Check if limit exceeded
      if (totalHits > (this.config.max || 100)) {
        if (this.config.skipFailedRequests) {
          await this.store.decrement(key);
        }

        if (this.config.handler) {
          return this.config.handler(req, res);
        }

        throw createError({
          code: "RATE_LIMIT_EXCEEDED",
          message: this.config.message || "Too many requests",
          status: this.config.statusCode || 429,
        });
      }

      // Continue
      const originalEnd = res.end;
      res.end = (...args: any[]): void => {
        if (this.config.skipSuccessfulRequests && res.statusCode < 400) {
          void this.store.decrement(key);
        }
        originalEnd.apply(res, args);
      };

      next();
    } catch (error) {
      next(error);
    }
  };

  // Reset rate limit for a key
  async reset(key: string): Promise<void> {
    await this.store.resetKey(key);
  }

  // Reset all rate limits
  async resetAll(): Promise<void> {
    await this.store.resetAll();
  }

  // Generate rate limit key
  private generateKey(req: Request): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(req);
    }

    return req.ip || "unknown";
  }

  // Check if request should be skipped
  private shouldSkip(req: Request): boolean {
    if (this.config.skip) {
      return this.config.skip(req);
    }

    return false;
  }

  // Set rate limit headers
  private setHeaders(res: Response, hits: number, resetTime: Date): void {
    res.setHeader("X-RateLimit-Limit", this.config.max || 100);
    res.setHeader(
      "X-RateLimit-Remaining",
      Math.max(0, (this.config.max || 100) - hits)
    );
    res.setHeader("X-RateLimit-Reset", Math.ceil(resetTime.getTime() / 1000));
  }
}

// Create rate limiter
export function createRateLimiter(config: RateLimitConfig): RateLimiter {
  return new RateLimiter(config);
}

// Redis store implementation (optional)
export class RedisStore implements RateLimitStore {
  private client: any; // Redis client
  private prefix: string;
  private windowMs: number;

  constructor(client: any, prefix = "rl:", windowMs = 60000) {
    this.client = client;
    this.prefix = prefix;
    this.windowMs = windowMs;
  }

  async increment(key: string): Promise<RateLimitInfo> {
    const now = Date.now();
    const resetTime = new Date(Math.ceil(now / this.windowMs) * this.windowMs);
    const fullKey = this.prefix + key;

    const multi = this.client.multi();
    multi.incr(fullKey);
    multi.pexpire(fullKey, Math.max(0, resetTime.getTime() - now));

    const results = await multi.exec();
    const totalHits = results[0][1];

    return { totalHits, resetTime };
  }

  async decrement(key: string): Promise<void> {
    const fullKey = this.prefix + key;
    await this.client.decr(fullKey);
  }

  async resetKey(key: string): Promise<void> {
    const fullKey = this.prefix + key;
    await this.client.del(fullKey);
  }

  async resetAll(): Promise<void> {
    const keys = await this.client.keys(this.prefix + "*");
    if (keys.length) {
      await this.client.del(keys);
    }
  }
}
