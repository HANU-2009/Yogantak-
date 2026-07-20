import { Request, Response, NextFunction } from 'express';
import { categoriesService } from './categories.service';
import { sendSuccess, sendCreated, sendNoContent } from '../../shared/utils/response';

export class CategoriesController {
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await categoriesService.findAll(req.query as any);
      sendSuccess(res, categories);
    } catch (error) { next(error); }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await categoriesService.findById(req.params.id as string);
      sendSuccess(res, category);
    } catch (error) { next(error); }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await categoriesService.create(req.body);
      sendCreated(res, category, 'Category created');
    } catch (error) { next(error); }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await categoriesService.update(req.params.id as string, req.body);
      sendSuccess(res, category, 'Category updated');
    } catch (error) { next(error); }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await categoriesService.delete(req.params.id as string);
      sendNoContent(res);
    } catch (error) { next(error); }
  }
}

export const categoriesController = new CategoriesController();
