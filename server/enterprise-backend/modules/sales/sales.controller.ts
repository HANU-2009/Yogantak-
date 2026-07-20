import { Request, Response, NextFunction } from 'express';
import { salesService } from './sales.service';
import { sendSuccess, sendCreated, sendPaginated } from '../../shared/utils/response';

export class SalesController {
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await salesService.findAll(req.query as any);
      sendPaginated(res, result.data, result.pagination);
    } catch (error) { next(error); }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const so = await salesService.findById(req.params.id as string);
      sendSuccess(res, so);
    } catch (error) { next(error); }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const so = await salesService.create(req.body, req.user?.id);
      sendCreated(res, so, 'Sales Order created');
    } catch (error) { next(error); }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const so = await salesService.update(req.params.id as string, req.body, req.user?.id);
      sendSuccess(res, so, 'Sales Order updated');
    } catch (error) { next(error); }
  }

  async fulfill(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const so = await salesService.fulfill(req.params.id as string, req.body, req.user?.id, req.ip);
      sendSuccess(res, so, 'Sales Order fulfilled');
    } catch (error) { next(error); }
  }
}

export const salesController = new SalesController();
