import { Request, Response, NextFunction } from 'express';
import { purchasesService } from './purchases.service';
import { sendSuccess, sendCreated, sendPaginated } from '../../shared/utils/response';

export class PurchasesController {
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await purchasesService.findAll(req.query as any);
      sendPaginated(res, result.data, result.pagination);
    } catch (error) { next(error); }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const po = await purchasesService.findById(req.params.id as string);
      sendSuccess(res, po);
    } catch (error) { next(error); }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const po = await purchasesService.create(req.body, req.user?.id);
      sendCreated(res, po, 'Purchase Order created');
    } catch (error) { next(error); }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const po = await purchasesService.update(req.params.id as string, req.body, req.user?.id);
      sendSuccess(res, po, 'Purchase Order updated');
    } catch (error) { next(error); }
  }

  async receiveItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const po = await purchasesService.receiveItems(req.params.id as string, req.body, req.user?.id, req.ip);
      sendSuccess(res, po, 'Purchase Order items received');
    } catch (error) { next(error); }
  }
}

export const purchasesController = new PurchasesController();
