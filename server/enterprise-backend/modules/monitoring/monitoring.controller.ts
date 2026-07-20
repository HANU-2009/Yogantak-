import { Request, Response } from 'express';
import { getRedisClient } from '../../config/redis';
import { Queue } from 'bullmq';

// Assuming we have some default queues, we can inspect them.
// A common approach is to just keep track of queue instances or specify queue names.
// Here we'll inspect a hypothetical 'email-queue' or list general Redis metrics.
const QUEUE_NAMES = ['email-queue', 'webhook-queue'];

export class MonitoringController {
  public getRedisMetrics = async (req: Request, res: Response) => {
    try {
      const client = getRedisClient();
      const memoryInfo = await client.info('memory');
      const clientsInfo = await client.info('clients');
      const statsInfo = await client.info('stats');
      
      res.status(200).json({
        status: 'success',
        data: {
          memory: memoryInfo.split('\r\n').filter((line: string) => line.length > 0 && !line.startsWith('#')),
          clients: clientsInfo.split('\r\n').filter((line: string) => line.length > 0 && !line.startsWith('#')),
          stats: statsInfo.split('\r\n').filter((line: string) => line.length > 0 && !line.startsWith('#')),
        }
      });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Failed to fetch Redis metrics', error: (error as Error).message });
    }
  };

  public getQueueMetrics = async (req: Request, res: Response) => {
    try {
      const client = getRedisClient();
      const queueMetrics = await Promise.all(QUEUE_NAMES.map(async (name) => {
        const queue = new Queue(name, { connection: client as any });
        const counts = await queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed', 'paused');
        await queue.close();
        return { name, counts };
      }));

      res.status(200).json({
        status: 'success',
        data: queueMetrics
      });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Failed to fetch Queue metrics', error: (error as Error).message });
    }
  };
}
