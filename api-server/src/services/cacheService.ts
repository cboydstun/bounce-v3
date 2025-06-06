import { Redis } from "ioredis";
import { logger } from "../utils/logger.js";

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

class CacheService {
  private redis: Redis | null = null;
  private isConnected = false;
  private defaultTTL = 3600; // 1 hour default

  constructor() {
    this.connect();
  }

  private async connect(): Promise<void> {
    try {
      // Only connect to Redis in production or if explicitly configured
      if (process.env.NODE_ENV === "test" || !process.env.REDIS_URL) {
        logger.info(
          "Redis caching disabled (test environment or no REDIS_URL)",
        );
        return;
      }

      this.redis = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      this.redis.on("connect", () => {
        this.isConnected = true;
        logger.info("Redis cache connected successfully");
      });

      this.redis.on("error", (error: any) => {
        this.isConnected = false;
        logger.error("Redis connection error:", error);
      });

      this.redis.on("close", () => {
        this.isConnected = false;
        logger.warn("Redis connection closed");
      });

      await this.redis.connect();
    } catch (error) {
      logger.error("Failed to connect to Redis:", error);
      this.redis = null;
    }
  }

  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    if (!this.redis || !this.isConnected) {
      return null;
    }

    try {
      const prefixedKey = this.getPrefixedKey(key, options.prefix);
      const value = await this.redis.get(prefixedKey);

      if (value === null) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      logger.error("Cache get error:", { key, error });
      return null;
    }
  }

  async set(
    key: string,
    value: any,
    options: CacheOptions = {},
  ): Promise<boolean> {
    if (!this.redis || !this.isConnected) {
      return false;
    }

    try {
      const prefixedKey = this.getPrefixedKey(key, options.prefix);
      const ttl = options.ttl || this.defaultTTL;
      const serializedValue = JSON.stringify(value);

      await this.redis.setex(prefixedKey, ttl, serializedValue);
      return true;
    } catch (error) {
      logger.error("Cache set error:", { key, error });
      return false;
    }
  }

  async del(key: string, options: CacheOptions = {}): Promise<boolean> {
    if (!this.redis || !this.isConnected) {
      return false;
    }

    try {
      const prefixedKey = this.getPrefixedKey(key, options.prefix);
      await this.redis.del(prefixedKey);
      return true;
    } catch (error) {
      logger.error("Cache delete error:", { key, error });
      return false;
    }
  }

  async exists(key: string, options: CacheOptions = {}): Promise<boolean> {
    if (!this.redis || !this.isConnected) {
      return false;
    }

    try {
      const prefixedKey = this.getPrefixedKey(key, options.prefix);
      const result = await this.redis.exists(prefixedKey);
      return result === 1;
    } catch (error) {
      logger.error("Cache exists error:", { key, error });
      return false;
    }
  }

  async flush(pattern?: string): Promise<boolean> {
    if (!this.redis || !this.isConnected) {
      return false;
    }

    try {
      if (pattern) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } else {
        await this.redis.flushdb();
      }
      return true;
    } catch (error) {
      logger.error("Cache flush error:", { pattern, error });
      return false;
    }
  }

  async increment(
    key: string,
    options: CacheOptions = {},
  ): Promise<number | null> {
    if (!this.redis || !this.isConnected) {
      return null;
    }

    try {
      const prefixedKey = this.getPrefixedKey(key, options.prefix);
      const result = await this.redis.incr(prefixedKey);

      // Set expiry if specified
      if (options.ttl) {
        await this.redis.expire(prefixedKey, options.ttl);
      }

      return result;
    } catch (error) {
      logger.error("Cache increment error:", { key, error });
      return null;
    }
  }

  async setWithExpiry(
    key: string,
    value: any,
    seconds: number,
    options: CacheOptions = {},
  ): Promise<boolean> {
    return this.set(key, value, { ...options, ttl: seconds });
  }

  async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    options: CacheOptions = {},
  ): Promise<T | null> {
    // Try to get from cache first
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    try {
      // Fetch fresh data
      const freshData = await fetchFunction();

      // Cache the result
      await this.set(key, freshData, options);

      return freshData;
    } catch (error) {
      logger.error("Cache getOrSet error:", { key, error });
      return null;
    }
  }

  private getPrefixedKey(key: string, prefix?: string): string {
    const defaultPrefix = process.env.CACHE_PREFIX || "bounce-api";
    const finalPrefix = prefix || defaultPrefix;
    return `${finalPrefix}:${key}`;
  }

  isHealthy(): boolean {
    return this.isConnected;
  }

  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.disconnect();
      this.redis = null;
      this.isConnected = false;
      logger.info("Redis cache disconnected");
    }
  }

  // Session management methods
  async setSession(
    sessionId: string,
    data: any,
    ttl: number = 86400,
  ): Promise<boolean> {
    return this.set(`session:${sessionId}`, data, { ttl, prefix: "auth" });
  }

  async getSession<T>(sessionId: string): Promise<T | null> {
    return this.get<T>(`session:${sessionId}`, { prefix: "auth" });
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    return this.del(`session:${sessionId}`, { prefix: "auth" });
  }

  // Rate limiting methods
  async checkRateLimit(
    identifier: string,
    limit: number,
    windowSeconds: number,
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = `rate_limit:${identifier}`;
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    try {
      if (!this.redis || !this.isConnected) {
        // Fallback: allow request if Redis is unavailable
        return {
          allowed: true,
          remaining: limit - 1,
          resetTime: now + windowSeconds * 1000,
        };
      }

      // Use Redis sorted set for sliding window rate limiting
      const pipeline = this.redis.pipeline();

      // Remove old entries
      pipeline.zremrangebyscore(key, 0, windowStart);

      // Count current requests
      pipeline.zcard(key);

      // Add current request
      pipeline.zadd(key, now, `${now}-${Math.random()}`);

      // Set expiry
      pipeline.expire(key, windowSeconds);

      const results = await pipeline.exec();

      if (!results) {
        return {
          allowed: true,
          remaining: limit - 1,
          resetTime: now + windowSeconds * 1000,
        };
      }

      const currentCount = (results?.[1]?.[1] as number) || 0;
      const allowed = currentCount < limit;
      const remaining = Math.max(0, limit - currentCount - 1);
      const resetTime = now + windowSeconds * 1000;

      return { allowed, remaining, resetTime };
    } catch (error) {
      logger.error("Rate limit check error:", { identifier, error });
      // Fallback: allow request if there's an error
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime: now + windowSeconds * 1000,
      };
    }
  }
}

export const cacheService = new CacheService();
export default cacheService;
