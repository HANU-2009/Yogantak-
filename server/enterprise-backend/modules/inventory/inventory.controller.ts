import { Request, Response, NextFunction } from 'express';
import { inventoryService } from './inventory.service';
import { sendSuccess, sendCreated, sendPaginated } from '../../shared/utils/response';

export class InventoryController {
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await inventoryService.findAll(req.query as any);
      sendPaginated(res, result.data, result.pagination);
    } catch (error) { next(error); }
  }

  async getProductStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stockInfo = await inventoryService.getProductStock(req.params.productId as string);
      sendSuccess(res, stockInfo);
    } catch (error) { next(error); }
  }

  async executeStockOperation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const log = await inventoryService.executeStockOperation(
        req.body, 
        req.user?.id, 
        req.ip
      );
      sendCreated(res, log, 'Stock operation executed successfully');
    } catch (error) { next(error); }
  }

  async bulkUpdate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const results = await inventoryService.bulkUpdate(
        req.body,
        req.user?.id,
        req.ip
      );
      sendSuccess(res, results, 'Bulk stock update processed');
    } catch (error) { next(error); }
  }

  async reserveStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const inventory = await inventoryService.reserveStock(req.body);
      sendSuccess(res, inventory, 'Stock reserved');
    } catch (error) { next(error); }
  }

  async releaseStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const inventory = await inventoryService.releaseStock(req.body);
      sendSuccess(res, inventory, 'Stock released');
    } catch (error) { next(error); }
  }
}

export const inventoryController = new InventoryController();
