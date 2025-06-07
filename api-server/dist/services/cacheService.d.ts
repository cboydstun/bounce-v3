export interface CacheOptions {
  ttl?: number;
  prefix?: string;
}
declare class CacheService {
  private redis;
  private isConnected;
  private defaultTTL;
  constructor();
  private connect;
  get<T>(key: string, options?: CacheOptions): Promise<T | null>;
  set(key: string, value: any, options?: CacheOptions): Promise<boolean>;
  del(key: string, options?: CacheOptions): Promise<boolean>;
  exists(key: string, options?: CacheOptions): Promise<boolean>;
  flush(pattern?: string): Promise<boolean>;
  increment(key: string, options?: CacheOptions): Promise<number | null>;
  setWithExpiry(
    key: string,
    value: any,
    seconds: number,
    options?: CacheOptions,
  ): Promise<boolean>;
  getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    options?: CacheOptions,
  ): Promise<T | null>;
  private getPrefixedKey;
  isHealthy(): boolean;
  disconnect(): Promise<void>;
  setSession(sessionId: string, data: any, ttl?: number): Promise<boolean>;
  getSession<T>(sessionId: string): Promise<T | null>;
  deleteSession(sessionId: string): Promise<boolean>;
  checkRateLimit(
    identifier: string,
    limit: number,
    windowSeconds: number,
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }>;
}
export declare const cacheService: CacheService;
export default cacheService;
//# sourceMappingURL=cacheService.d.ts.map
