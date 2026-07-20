import { Request, Response } from 'express';
import { WebhooksService } from './webhooks.service';

export class WebhooksController {
  private webhooksService = new WebhooksService();

  // In a real application, you'd store subscriptions in the DB.
  // For this infrastructure setup, we provide an endpoint to immediately test dispatching a webhook.
  public testWebhook = async (req: Request, res: Response) => {
    try {
      const { url, event, data, secret } = req.body;

      if (!url || !event) {
        return res.status(400).json({ status: 'error', message: 'URL and event are required' });
      }

      await this.webhooksService.dispatchWebhook({ url, event, data, secret });
      
      res.status(202).json({ status: 'success', message: 'Webhook queued for dispatch' });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Failed to queue webhook', error: (error as Error).message });
    }
  };
}
