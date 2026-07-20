import { Queue, Worker, Job } from 'bullmq';
import { getRedisClient } from './redis';
import { logger } from './logger';

const connection = () => getRedisClient();

// ============================================================
// Queue Definitions
// ============================================================

export const Queues = {
  LOW_STOCK_ALERT: 'low-stock-alerts',
  EXPIRY_ALERT: 'expiry-alerts',
  DAILY_REPORT: 'daily-reports',
  RESERVATION_RELEASE: 'reservation-release',
  EMAIL: 'email',
} as const;

export type QueueName = (typeof Queues)[keyof typeof Queues];

const queues: Map<string, Queue> = new Map();

export function getQueue(name: QueueName): any {
  if (process.env.NODE_ENV === 'development' && process.env.ENABLE_BULLMQ !== 'true') {
    return {
      add: async (jobName: string, payload: any) => {
        logger.info(`[Mock Queue] ${name} added job: ${jobName}`);
      },
      close: async () => {}
    };
  }

  if (!queues.has(name)) {
    const q = new Queue(name, {
      connection: connection() as any,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 500,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    });
    queues.set(name, q);
  }
  return queues.get(name)!;
}

export function createWorker(queueName: QueueName, processor: (job: Job) => Promise<any>): any {
  if (process.env.NODE_ENV === 'development' && process.env.ENABLE_BULLMQ !== 'true') {
    return {
      close: async () => {}
    };
  }

  return new Worker(queueName, processor, {
    connection: connection() as any,
  });
}

export async function closeAllQueues(): Promise<void> {
  for (const [name, queue] of queues) {
    await queue.close();
    logger.info(`🔌 Queue closed: ${name}`);
  }
}
