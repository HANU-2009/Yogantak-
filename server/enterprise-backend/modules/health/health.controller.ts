import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { getRedisClient } from '../../config/redis';
import { env } from '../../config/environment';

export class HealthController {
  public getHealth = (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', environment: env.NODE_ENV, timestamp: new Date() });
  };

  public getDbHealth = async (req: Request, res: Response) => {
    try {
      // Execute a simple query
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).json({ status: 'ok', message: 'Database connection successful' });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Database connection failed', error: (error as Error).message });
    }
  };

  public getRedisHealth = async (req: Request, res: Response) => {
    try {
      const client = getRedisClient();
      const ping = await client.ping();
      if (ping === 'PONG') {
        res.status(200).json({ status: 'ok', message: 'Redis connection successful' });
      } else {
        throw new Error('Redis did not respond with PONG');
      }
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Redis connection failed', error: (error as Error).message });
    }
  };
}
