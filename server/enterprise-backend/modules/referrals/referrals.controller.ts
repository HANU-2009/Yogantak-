import { Request, Response, NextFunction } from 'express';
import { referralsService } from './referrals.service';
import { sendSuccess, sendCreated } from '../../shared/utils/response';

export class ReferralsController {
  async getMyReferrals(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await referralsService.getMyReferrals(req.user!.id);
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  async sendReferral(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await referralsService.sendReferral(req.user!.id, req.body);
      sendCreated(res, data, 'Referral invite recorded successfully');
    } catch (error) { next(error); }
  }

  async completeReferral(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await referralsService.completeReferral(req.body);
      sendSuccess(res, data, 'Referral status marked as completed');
    } catch (error) { next(error); }
  }
}

export const referralsController = new ReferralsController();
