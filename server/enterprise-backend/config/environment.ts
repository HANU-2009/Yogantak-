import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000').transform(Number),
  APP_NAME: z.string().default('Inventory Management System'),
  APP_URL: z.string().default('http://localhost:5000'),
  API_PREFIX: z.string().default('/api/v1'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),

  DATABASE_URL: z.string(),

  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379').transform(Number),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().default('0').transform(Number),
  REDIS_URL: z.string().optional(),

  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  JWT_COOKIE_SECURE: z.string().default('false').transform((v) => v === 'true'),

  BCRYPT_SALT_ROUNDS: z.string().default('12').transform(Number),

  UPLOAD_PATH: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.string().default('10485760').transform(Number),

  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number),
  AUTH_RATE_LIMIT_MAX: z.string().default('10').transform(Number),

  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.string().default('587').transform(Number),
  SMTP_SECURE: z.string().default('false').transform((v) => v === 'true'),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().default('noreply@inventory.com'),
  EMAIL_FROM_NAME: z.string().default('Inventory System'),

  CACHE_TTL_SHORT: z.string().default('300').transform(Number),
  CACHE_TTL_MEDIUM: z.string().default('1800').transform(Number),
  CACHE_TTL_LONG: z.string().default('86400').transform(Number),
  CACHE_TTL_DASHBOARD: z.string().default('60').transform(Number),

  DEFAULT_PAGE_SIZE: z.string().default('20').transform(Number),
  MAX_PAGE_SIZE: z.string().default('100').transform(Number),

  LOG_LEVEL: z.string().default('debug'),
  LOG_DIR: z.string().default('./logs'),

  LOW_STOCK_ALERT_CRON: z.string().default('0 * * * *'),
  EXPIRY_ALERT_CRON: z.string().default('0 8 * * *'),
  DAILY_REPORT_CRON: z.string().default('0 0 * * *'),
  RESERVATION_RELEASE_CRON: z.string().default('*/15 * * * *'),

  EXPIRY_ALERT_DAYS_BEFORE: z.string().default('30').transform(Number),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;

console.log('Environment parsed:', parsed.success);

