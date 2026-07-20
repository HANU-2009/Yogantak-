import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import hpp from 'hpp';
import xss from 'xss-clean';
import morgan from 'morgan';
import { env } from './config/environment';
import { logger } from './config/logger';
import { errorMiddleware, notFoundMiddleware } from './shared/middleware/error.middleware';
import { globalRateLimit } from './shared/middleware/rate-limit.middleware';
import { auditMiddleware } from './shared/middleware/audit.middleware';

import v1Routes from './routes/v1';
import healthRoutes from './modules/health/health.routes';

const app: Express = express();

// Security Middlewares
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGINS, credentials: true }));
app.use(globalRateLimit);

// Parse JSON & URL-encoded bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Data Sanitization
app.use(xss()); // Prevent XSS attacks
app.use(hpp()); // Prevent HTTP Parameter Pollution

// Compression
app.use(compression());

// Request Logging
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));

// Audit Log Middleware
app.use(auditMiddleware);

// API Routes
app.use('/api/v1', v1Routes);

// Health Check
app.use('/health', healthRoutes);

// 404 Handler
app.use(notFoundMiddleware);

// Global Error Handler
app.use(errorMiddleware);

export { app };
