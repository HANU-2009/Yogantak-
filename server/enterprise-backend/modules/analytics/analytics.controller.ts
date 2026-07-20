import { Request, Response, NextFunction } from 'express';
import { analyticsService } from './analytics.service';
import { sendSuccess } from '../../shared/utils/response';

export class AnalyticsController {
  async getRecommendations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await analyticsService.getRecommendations(req.query as any);
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  async predictDemand(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await analyticsService.predictDemand(req.query as any);
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  async getReorderSuggestions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await analyticsService.getReorderSuggestions();
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  async getDeadStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await analyticsService.getDeadStock();
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  async getVelocityClassification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await analyticsService.getVelocityClassification(req.query as any);
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  async getAbcXyzAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await analyticsService.getAbcXyzAnalysis(req.query as any);
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  async getTurnoverAndStr(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await analyticsService.getTurnoverAndStr();
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  async getAnalyticsDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await analyticsService.getAnalyticsDashboard();
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }
}

export const analyticsController = new AnalyticsController();
