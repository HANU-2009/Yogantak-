import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service';
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from '../../shared/utils/response';

export class UsersController {
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await usersService.findAll(req.query as any);
      sendPaginated(res, result.data, result.pagination);
    } catch (error) { next(error); }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await usersService.findById(req.params.id as string);
      sendSuccess(res, user);
    } catch (error) { next(error); }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await usersService.create(req.body);
      sendCreated(res, user, 'User created successfully');
    } catch (error) { next(error); }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await usersService.update(req.params.id as string, req.body);
      sendSuccess(res, user, 'User updated successfully');
    } catch (error) { next(error); }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await usersService.softDelete(req.params.id as string);
      sendNoContent(res);
    } catch (error) { next(error); }
  }
}

export const usersController = new UsersController();
