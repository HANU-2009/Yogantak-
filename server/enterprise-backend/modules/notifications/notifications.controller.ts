import { Request, Response, NextFunction } from 'express';
import { notificationsService } from './notifications.service';
import { sendSuccess, sendCreated } from '../../shared/utils/response';

export class NotificationsController {
  async getMyNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await notificationsService.getMyNotifications(req.user!.id);
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  async sendNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await notificationsService.sendNotification(req.body);
      sendCreated(res, data, 'Notification dispatched successfully');
    } catch (error) { next(error); }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await notificationsService.markAsRead(req.params.id as string, req.user!.id);
      sendSuccess(res, data, 'Notification marked as read');
    } catch (error) { next(error); }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await notificationsService.markAllAsRead(req.user!.id);
      sendSuccess(res, null, 'All notifications marked as read');
    } catch (error) { next(error); }
  }
}

export const notificationsController = new NotificationsController();
