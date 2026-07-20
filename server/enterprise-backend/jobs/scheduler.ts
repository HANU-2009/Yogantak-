import { getQueue } from '../config/queue';
import { logger } from '../config/logger';

export async function scheduleJobs() {
  try {
    const lowStockQueue = getQueue('low-stock-alerts');
    const expiryQueue = getQueue('expiry-alerts');
    const reportsQueue = getQueue('daily-reports');

    // Run low stock alerts every hour
    await lowStockQueue.add('check-low-stock', {}, {
      repeat: { pattern: '0 * * * *' },
      jobId: 'hourly-low-stock-check'
    });

    // Run expiry alerts daily at 1 AM
    await expiryQueue.add('check-expiry', {}, {
      repeat: { pattern: '0 1 * * *' },
      jobId: 'daily-expiry-check'
    });

    // Run daily reports daily at 11:50 PM
    await reportsQueue.add('generate-daily-report', {}, {
      repeat: { pattern: '50 23 * * *' },
      jobId: 'daily-report-generation'
    });

    logger.info('Background jobs scheduled successfully.');
  } catch (error) {
    logger.error('Failed to schedule background jobs', { error });
  }
}
