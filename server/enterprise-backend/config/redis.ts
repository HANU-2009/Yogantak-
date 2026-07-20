import Redis from 'ioredis';
import { env } from './environment';
import { logger } from './logger';

let redisClient: Redis;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = env.REDIS_URL
      ? new Redis(env.REDIS_URL, { maxRetriesPerRequest: null, lazyConnect: true })
      : new Redis({
          host: env.REDIS_HOST,
          port: env.REDIS_PORT,
          password: env.REDIS_PASSWORD || undefined,
          db: env.REDIS_DB,
          maxRetriesPerRequest: null,
          lazyConnect: true,
          retryStrategy(times) {
            if (times > 3) return null; // Stop retrying after 3 attempts
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
        });

    redisClient.on('connect', () => logger.info('✅ Redis connected'));
    redisClient.on('error', (err) => logger.error('❌ Redis error:', err));
    redisClient.on('close', () => logger.warn('⚠️  Redis connection closed'));
  }
  return redisClient;
}

export async function connectRedis(): Promise<void> {
  try {
    const client = getRedisClient();
    await client.connect();
  } catch (error) {
    logger.error('❌ Redis connection failed:', error);
    // Redis is optional — don't exit
  }
}

// ============================================================
// Cache Helpers
// ============================================================

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const client = getRedisClient();
    const data = await client.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttl: number = env.CACHE_TTL_MEDIUM): Promise<void> {
  try {
    const client = getRedisClient();
    await client.setex(key, ttl, JSON.stringify(value));
  } catch {
    // silently fail — cache is best-effort
  }
}

export async function cacheDel(...keys: string[]): Promise<void> {
  try {
    const client = getRedisClient();
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } catch {
    // silently fail
  }
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  try {
    const client = getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } catch {
    // silently fail
  }
}

export const CacheKeys = {
  DASHBOARD: 'dashboard:stats',
  PRODUCTS: (page: number, limit: number) => `products:list:${page}:${limit}`,
  PRODUCT: (id: string) => `products:${id}`,
  CATEGORIES: 'categories:all',
  BRANDS: 'brands:all',
  SUPPLIERS: 'suppliers:all',
  WAREHOUSES: 'warehouses:all',
  INVENTORY: (productId: string, warehouseId?: string) =>
    `inventory:${productId}:${warehouseId ?? 'all'}`,
  LOW_STOCK: 'alerts:low-stock',
  PERMISSIONS: (roleId: string) => `permissions:role:${roleId}`,
  USER: (id: string) => `users:${id}`,
};
