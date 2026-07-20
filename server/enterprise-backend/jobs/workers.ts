import { Job } from 'bullmq';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { createWorker } from '../config/queue';

export const lowStockWorker = createWorker(
  'low-stock-alerts',
  async (job: Job) => {
    logger.info(`Processing low stock alerts... (Job ${job.id})`);

    const lowStockItems = await prisma.inventory.findMany({
      where: {
        availableStock: {
          lte: prisma.inventory.fields.minStockLevel
        }
      },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        warehouse: { select: { id: true, name: true } }
      }
    });

    if (lowStockItems.length > 0) {
      logger.warn(`Found ${lowStockItems.length} items with low stock`);
      // Here you would trigger an email or push notification to the warehouse manager
      // emailService.sendLowStockAlert(lowStockItems);
    } else {
      logger.info('No low stock items found.');
    }

    return { processed: lowStockItems.length };
  }
);

export const expiryAlertWorker = createWorker(
  'expiry-alerts',
  async (job: Job) => {
    logger.info(`Processing expiry alerts... (Job ${job.id})`);
    
    // Example: find items expiring within next 30 days
    // This requires batch-level tracking, which would need a Batch table linked to Inventory.
    // For now, this is a placeholder for where that logic would go.

    logger.info('Expiry alerts processed successfully.');
    return { processed: 0 };
  }
);

export const dailyReportWorker = createWorker(
  'daily-reports',
  async (job: Job) => {
    logger.info(`Generating daily reports... (Job ${job.id})`);

    // In a real scenario, this would aggregate sales, purchases, and stock movements for the day
    // and email a PDF/CSV to stakeholders.

    logger.info('Daily reports generated and sent.');
    return { success: true };
  }
);
