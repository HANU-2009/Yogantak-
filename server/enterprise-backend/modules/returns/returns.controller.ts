import { Request, Response, NextFunction } from 'express';
import { returnsService } from './returns.service';
import { sendSuccess, sendCreated, sendPaginated } from '../../shared/utils/response';

export class ReturnsController {
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await returnsService.findAll(req.query as any);
      sendPaginated(res, result.data as any, result.pagination);
    } catch (error) { next(error); }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const returnRecord = await returnsService.findById(req.params.id as string);
      sendSuccess(res, returnRecord);
    } catch (error) { next(error); }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const returnRecord = await returnsService.create(req.body, req.user?.id);
      sendCreated(res, returnRecord, 'Return created');
    } catch (error) { next(error); }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const returnRecord = await returnsService.update(req.params.id as string, req.body, req.user?.id);
      sendSuccess(res, returnRecord, 'Return updated');
    } catch (error) { next(error); }
  }

  async receive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const returnRecord = await returnsService.receive(req.params.id as string, req.body, req.user?.id, req.ip);
      sendSuccess(res, returnRecord, 'Return items received');
    } catch (error) { next(error); }
  }
}

export const returnsController = new ReturnsController();
