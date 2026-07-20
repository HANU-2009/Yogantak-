import { Request, Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service';
import { sendSuccess } from '../../shared/utils/response';

export class DashboardController {
  async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await dashboardService.getOverview();
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  async getRecentActivities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await dashboardService.getRecentActivities();
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }
}

export const dashboardController = new DashboardController();
