import { Request, Response, NextFunction } from 'express';
import { couponsService } from './coupons.service';
import { sendSuccess, sendCreated } from '../../shared/utils/response';

export class CouponsController {
  async getCoupons(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await couponsService.getCoupons();
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  async getCouponById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await couponsService.getCouponById(req.params.id as string);
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  async createCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await couponsService.createCoupon(req.body);
      sendCreated(res, data, 'Coupon created');
    } catch (error) { next(error); }
  }

  async updateCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await couponsService.updateCoupon(req.params.id as string, req.body);
      sendSuccess(res, data, 'Coupon updated');
    } catch (error) { next(error); }
  }

  async deleteCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await couponsService.deleteCoupon(req.params.id as string);
      sendSuccess(res, null, 'Coupon deleted');
    } catch (error) { next(error); }
  }

  async applyCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await couponsService.applyCoupon(req.body, req.user?.id);
      sendSuccess(res, data, 'Coupon applied successfully');
    } catch (error) { next(error); }
  }
}

export const couponsController = new CouponsController();
