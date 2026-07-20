import { Queue, Worker, Job } from 'bullmq';
import { getRedisClient } from '../../config/redis';
import crypto from 'crypto';

export interface WebhookPayload {
  url: string;
  event: string;
  data: any;
  secret?: string;
}

// Create a queue for webhooks
export let webhookQueue: any;
export let webhookWorker: any;

const ENABLE_BULLMQ = process.env.NODE_ENV !== 'development' || process.env.ENABLE_WEBHOOKS === 'true';

if (ENABLE_BULLMQ) {
  webhookQueue = new Queue<WebhookPayload>('webhook-queue', { connection: getRedisClient() as any });

  webhookWorker = new Worker<WebhookPayload>('webhook-queue', async (job: Job<WebhookPayload>) => {
    const { url, event, data, secret } = job.data;

    const payloadString = JSON.stringify({ event, data });
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'InventoryManagement-Webhook/1.0',
    };

    if (secret) {
      const signature = crypto.createHmac('sha256', secret).update(payloadString).digest('hex');
      headers['X-Webhook-Signature'] = signature;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: payloadString,
        signal: AbortSignal.timeout(10000) 
      });

      if (!response.ok) {
        throw new Error(`Webhook responded with status: ${response.status}`);
      }
    } catch (error) {
      throw error;
    }
  }, { connection: getRedisClient() as any });
} else {
  webhookQueue = {
    add: async (name: string, payload: any) => {
      console.log(`[Mock BullMQ] Webhook ${name} payload:`, payload);
    }
  };
}

export class WebhooksService {
  /**
   * Dispatches a webhook by adding it to the BullMQ queue.
   */
  public async dispatchWebhook(payload: WebhookPayload) {
    await webhookQueue.add('dispatch' as any, payload, {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }
}
