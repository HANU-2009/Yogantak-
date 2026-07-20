import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { logger } from '../../config/logger';
import { AuditAction } from '@prisma/client';

interface AuditOptions {
  action: AuditAction;
  module: string;
  description?: string;
  getEntityId?: (req: Request) => string | undefined;
  getEntityType?: () => string;
}

export function auditLog(options: AuditOptions) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    // Store original request info before any changes
    const entityId = options.getEntityId?.(req);
    const entityType = options.getEntityType?.();

    // Process request first, then log after
    next();

    // Non-blocking async audit log after response is sent
    setImmediate(async () => {
      try {
        await prisma.auditLog.create({
          data: {
            userId: req.user?.id,
            userEmail: req.user?.email,
            userRole: req.user?.roles?.[0],
            action: options.action,
            module: options.module,
            entityType,
            entityId,
            description: options.description,
            ipAddress: getClientIp(req),
            userAgent: req.get('user-agent'),
            browser: parseBrowser(req.get('user-agent')),
            os: parseOs(req.get('user-agent')),
            device: parseDevice(req.get('user-agent')),
          },
        });
      } catch (error) {
        logger.error('Audit log failed:', error);
      }
    });
  };
}

export function getClientIp(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    (req.headers['x-real-ip'] as string) ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

export function auditMiddleware(req: Request, res: Response, next: NextFunction): void {
  logger.info(`🌐 ${req.method} ${req.url} - IP: ${getClientIp(req)}`);
  next();
}

function parseBrowser(userAgent?: string): string {
  if (!userAgent) return 'unknown';
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('MSIE') || userAgent.includes('Trident')) return 'Internet Explorer';
  return 'Other';
}

function parseOs(userAgent?: string): string {
  if (!userAgent) return 'unknown';
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS') || userAgent.includes('iPhone')) return 'iOS';
  return 'Other';
}

function parseDevice(userAgent?: string): string {
  if (!userAgent) return 'unknown';
  if (userAgent.includes('Mobile')) return 'Mobile';
  if (userAgent.includes('Tablet')) return 'Tablet';
  return 'Desktop';
}
