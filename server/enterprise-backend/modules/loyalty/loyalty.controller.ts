import { Request, Response, NextFunction } from 'express';
import { loyaltyService } from './loyalty.service';
import { sendSuccess, sendCreated } from '../../shared/utils/response';

export class LoyaltyController {
  async getMyPointsBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await loyaltyService.getPointsBalance(req.user!.id);
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  async getMyPointsHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await loyaltyService.getPointsHistory(req.user!.id);
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  async getUserPointsBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await loyaltyService.getPointsBalance(req.params.userId as string);
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  async earnPoints(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await loyaltyService.earnPoints(req.body);
      sendCreated(res, data, 'Reward points credited');
    } catch (error) { next(error); }
  }

  async redeemPoints(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await loyaltyService.redeemPoints(req.user!.id, req.body);
      sendCreated(res, data, 'Reward points redeemed');
    } catch (error) { next(error); }
  }
}

export const loyaltyController = new LoyaltyController();
