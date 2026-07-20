import { app } from './app';
import { env } from './config/environment';
import { logger } from './config/logger';
import { prisma } from './config/database';
import { connectRedis } from './config/redis';
import { setupSwagger } from './config/swagger';
import { scheduleJobs } from './jobs/scheduler';
import './jobs/workers'; // Initialize workers

const PORT = env.PORT || 3000;

async function bootstrap() {
  try {
    // 1. Connect to Database
    await prisma.$connect();
    logger.info('Connected to PostgreSQL Database via Prisma');

    // 2. Connect to Redis
    await connectRedis();

    // 3. Setup Swagger/OpenAPI
    setupSwagger(app);

    // 4. Schedule Background Jobs
    if (env.NODE_ENV !== 'test') {
      await scheduleJobs();
    }

    // 5. Start Server
    const server = app.listen(PORT, () => {
      logger.info(`Server is running in ${env.NODE_ENV} mode on port ${PORT}`);
      logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
    });

    // Graceful Shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received: closing HTTP server`);
      server.close(async () => {
        logger.info('HTTP server closed');
        await prisma.$disconnect();
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Error starting server', { error });
    process.exit(1);
  }
}

bootstrap();
