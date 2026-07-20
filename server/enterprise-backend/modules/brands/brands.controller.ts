import { Request, Response, NextFunction } from 'express';
import { brandsService } from './brands.service';
import { sendSuccess, sendCreated, sendNoContent } from '../../shared/utils/response';

export class BrandsController {
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const brands = await brandsService.findAll(req.query as any);
      sendSuccess(res, brands);
    } catch (error) { next(error); }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const brand = await brandsService.findById(req.params.id as string);
      sendSuccess(res, brand);
    } catch (error) { next(error); }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const brand = await brandsService.create(req.body);
      sendCreated(res, brand, 'Brand created');
    } catch (error) { next(error); }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const brand = await brandsService.update(req.params.id as string, req.body);
      sendSuccess(res, brand, 'Brand updated');
    } catch (error) { next(error); }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await brandsService.delete(req.params.id as string);
      sendNoContent(res);
    } catch (error) { next(error); }
  }
}

export const brandsController = new BrandsController();
