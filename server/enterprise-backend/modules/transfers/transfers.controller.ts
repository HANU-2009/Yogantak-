import { Request, Response, NextFunction } from 'express';
import { transfersService } from './transfers.service';
import { sendSuccess, sendCreated, sendPaginated } from '../../shared/utils/response';

export class TransfersController {
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await transfersService.findAll(req.query as any);
      sendPaginated(res, result.data, result.pagination);
    } catch (error) { next(error); }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const transfer = await transfersService.findById(req.params.id as string);
      sendSuccess(res, transfer);
    } catch (error) { next(error); }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const transfer = await transfersService.create(req.body, req.user?.id, req.ip);
      sendCreated(res, transfer, 'Transfer created');
    } catch (error) { next(error); }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const transfer = await transfersService.update(req.params.id as string, req.body, req.user?.id);
      sendSuccess(res, transfer, 'Transfer updated');
    } catch (error) { next(error); }
  }

  async dispatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const transfer = await transfersService.dispatch(req.params.id as string, req.user?.id);
      sendSuccess(res, transfer, 'Transfer dispatched');
    } catch (error) { next(error); }
  }

  async receive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const transfer = await transfersService.receive(req.params.id as string, req.body, req.user?.id, req.ip);
      sendSuccess(res, transfer, 'Transfer items received');
    } catch (error) { next(error); }
  }
}

export const transfersController = new TransfersController();
