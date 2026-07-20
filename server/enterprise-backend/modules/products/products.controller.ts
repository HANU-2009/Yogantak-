import { Request, Response, NextFunction } from 'express';
import { productsService } from './products.service';
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from '../../shared/utils/response';

export class ProductsController {
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await productsService.findAll(req.query as any);
      sendPaginated(res, result.data, result.pagination);
    } catch (error) { next(error); }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productsService.findById(req.params.id as string);
      sendSuccess(res, product);
    } catch (error) { next(error); }
  }

  async findBySku(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productsService.findBySku(req.params.sku as string);
      sendSuccess(res, product);
    } catch (error) { next(error); }
  }

  async findByBarcode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productsService.findByBarcode(req.params.barcode as string);
      sendSuccess(res, product);
    } catch (error) { next(error); }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productsService.create(req.body, req.user?.id);
      sendCreated(res, product, 'Product created successfully');
    } catch (error) { next(error); }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productsService.update(req.params.id as string, req.body, req.user?.id);
      sendSuccess(res, product, 'Product updated successfully');
    } catch (error) { next(error); }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await productsService.delete(req.params.id as string);
      sendNoContent(res);
    } catch (error) { next(error); }
  }

  async bulkAction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await productsService.bulkAction(req.body);
      sendSuccess(res, result, 'Bulk action completed');
    } catch (error) { next(error); }
  }

  async bulkPriceUpdate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await productsService.bulkPriceUpdate(req.body);
      sendSuccess(res, result, 'Prices updated');
    } catch (error) { next(error); }
  }

  async addVariant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const variant = await productsService.addVariant(req.params.id as string, req.body);
      sendCreated(res, variant, 'Variant added');
    } catch (error) { next(error); }
  }

  async updateVariant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const variant = await productsService.updateVariant(req.params.id as string, req.params.variantId as string, req.body);
      sendSuccess(res, variant, 'Variant updated');
    } catch (error) { next(error); }
  }

  async deleteVariant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await productsService.deleteVariant(req.params.variantId as string);
      sendNoContent(res);
    } catch (error) { next(error); }
  }

  async generateBarcode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const png = await productsService.generateBarcode(req.params.id as string);
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="barcode-${req.params.id}.png"`);
      res.send(png);
    } catch (error) { next(error); }
  }

  async generateQRCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const qrDataUrl = await productsService.generateQRCode(req.params.id as string);
      sendSuccess(res, { qrCode: qrDataUrl });
    } catch (error) { next(error); }
  }

  async uploadImages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const files = req.files as Express.Multer.File[];
      const images = await productsService.uploadImages(req.params.id as string, files);
      sendCreated(res, images, 'Images uploaded');
    } catch (error) { next(error); }
  }

  async deleteImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await productsService.deleteImage(req.params.imageId as string);
      sendNoContent(res);
    } catch (error) { next(error); }
  }

  async getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await productsService.getDashboardStats();
      sendSuccess(res, stats);
    } catch (error) { next(error); }
  }
}

export const productsController = new ProductsController();
