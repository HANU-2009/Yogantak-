import { prisma } from '../../config/database';
import { NotFoundError } from '../../shared/errors/AppError';
import type { SendNotificationDtoType } from './notifications.dto';

export class NotificationsService {
  async getMyNotifications(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { sentAt: 'desc' },
    });
  }

  async sendNotification(dto: SendNotificationDtoType) {
    // 1. Create db log record
    const notification = await prisma.notification.create({
      data: {
        userId: dto.userId || null,
        type: dto.type,
        title: dto.title,
        message: dto.message,
      },
    });

    // 2. Dispatch to actual transport integrations (SMS/Email mock-ups)
    console.log(`[Notification Dispatcher] Type: ${dto.type} | To User: ${dto.userId || 'ALL'} | Title: ${dto.title}`);

    return notification;
  }

  async markAsRead(id: string, _userId: string) {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new NotFoundError('Notification not found');
    
    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}

export const notificationsService = new NotificationsService();
