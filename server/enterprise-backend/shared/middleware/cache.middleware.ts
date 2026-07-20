import { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../../config/redis';
import { logger } from '../../config/logger';

/**
 * Middleware to cache GET requests in Redis.
 * @param duration Duration in seconds to keep the cache.
 */
export const cacheMiddleware = (duration: number = 300) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.originalUrl || req.url}`;
    const client = getRedisClient();

    try {
      const cachedResponse = await client.get(key);
      if (cachedResponse) {
        logger.debug(`Cache hit for ${key}`);
        return res.status(200).json(JSON.parse(cachedResponse));
      }

      logger.debug(`Cache miss for ${key}`);

      // Overwrite res.json to capture the response body
      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          client.setex(key, duration, JSON.stringify(body)).catch((err: Error) => {
            logger.error(`Failed to set cache for ${key}:`, err);
          });
        }
        return originalJson(body);
      };

      next();
    } catch (error) {
      logger.error(`Cache middleware error for ${key}:`, error);
      next();
    }
  };
};
