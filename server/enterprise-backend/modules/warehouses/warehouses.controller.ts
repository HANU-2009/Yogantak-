import { Request, Response, NextFunction } from 'express';
import { warehousesService } from './warehouses.service';
import { sendSuccess, sendCreated, sendNoContent } from '../../shared/utils/response';

export class WarehousesController {
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const warehouses = await warehousesService.findAll(req.query as any);
      sendSuccess(res, warehouses);
    } catch (error) { next(error); }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const warehouse = await warehousesService.findById(req.params.id as string);
      sendSuccess(res, warehouse);
    } catch (error) { next(error); }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const warehouse = await warehousesService.create(req.body);
      sendCreated(res, warehouse, 'Warehouse created');
    } catch (error) { next(error); }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const warehouse = await warehousesService.update(req.params.id as string, req.body);
      sendSuccess(res, warehouse, 'Warehouse updated');
    } catch (error) { next(error); }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await warehousesService.delete(req.params.id as string);
      sendNoContent(res);
    } catch (error) { next(error); }
  }

  async addZone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const zone = await warehousesService.addZone(req.params.id as string, req.body);
      sendCreated(res, zone, 'Zone added');
    } catch (error) { next(error); }
  }

  async addRack(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rack = await warehousesService.addRack(req.params.zoneId as string, req.body);
      sendCreated(res, rack, 'Rack added');
    } catch (error) { next(error); }
  }

  async addShelf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const shelf = await warehousesService.addShelf(req.params.rackId as string, req.body);
      sendCreated(res, shelf, 'Shelf added');
    } catch (error) { next(error); }
  }

  async addBin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bin = await warehousesService.addBin(req.params.shelfId as string, req.body);
      sendCreated(res, bin, 'Bin added');
    } catch (error) { next(error); }
  }
}

export const warehousesController = new WarehousesController();
