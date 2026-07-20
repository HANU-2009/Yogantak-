import { Request, Response, NextFunction } from 'express';
import { suppliersService } from './suppliers.service';
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from '../../shared/utils/response';

export class SuppliersController {
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await suppliersService.findAll(req.query as any);
      sendPaginated(res, result.data, result.pagination);
    } catch (error) { next(error); }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const supplier = await suppliersService.findById(req.params.id as string);
      sendSuccess(res, supplier);
    } catch (error) { next(error); }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const supplier = await suppliersService.create(req.body);
      sendCreated(res, supplier, 'Supplier created');
    } catch (error) { next(error); }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const supplier = await suppliersService.update(req.params.id as string, req.body);
      sendSuccess(res, supplier, 'Supplier updated');
    } catch (error) { next(error); }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await suppliersService.delete(req.params.id as string);
      sendNoContent(res);
    } catch (error) { next(error); }
  }
}

export const suppliersController = new SuppliersController();
