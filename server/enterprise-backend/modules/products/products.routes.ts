import { Router } from 'express';
import { productsController } from './products.controller';
import { authenticate, requirePermission, Permissions } from '../../shared/middleware/rbac.middleware';
import { validateBody, validateQuery } from '../../shared/middleware/validate.middleware';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
  CreateVariantDto,
  BulkProductActionDto,
  BulkPriceUpdateDto,
} from './products.dto';
import multer from 'multer';
import { env } from '../../config/environment';

const upload = multer({
  dest: env.UPLOAD_PATH,
  limits: { fileSize: env.MAX_FILE_SIZE },
});

const router = Router();

// Public / Read routes
router.get('/', validateQuery(ProductQueryDto), productsController.findAll.bind(productsController));
router.get('/:id', productsController.findById.bind(productsController));
router.get('/sku/:sku', productsController.findBySku.bind(productsController));
router.get('/barcode/:barcode', productsController.findByBarcode.bind(productsController));

// Protected routes
router.use(authenticate);

// Dashboard stats
router.get('/stats/dashboard', requirePermission(Permissions.PRODUCTS_READ), productsController.getDashboardStats.bind(productsController));

// CRUD
router.post('/', requirePermission(Permissions.PRODUCTS_CREATE), validateBody(CreateProductDto), productsController.create.bind(productsController));
router.put('/:id', requirePermission(Permissions.PRODUCTS_UPDATE), validateBody(UpdateProductDto), productsController.update.bind(productsController));
router.delete('/:id', requirePermission(Permissions.PRODUCTS_DELETE), productsController.delete.bind(productsController));

// Bulk Actions
router.post('/bulk-action', requirePermission(Permissions.PRODUCTS_UPDATE), validateBody(BulkProductActionDto), productsController.bulkAction.bind(productsController));
router.post('/bulk-price-update', requirePermission(Permissions.PRODUCTS_UPDATE), validateBody(BulkPriceUpdateDto), productsController.bulkPriceUpdate.bind(productsController));

// Variants
router.post('/:id/variants', requirePermission(Permissions.PRODUCTS_CREATE), validateBody(CreateVariantDto), productsController.addVariant.bind(productsController));
router.put('/:id/variants/:variantId', requirePermission(Permissions.PRODUCTS_UPDATE), validateBody(CreateVariantDto.partial()), productsController.updateVariant.bind(productsController));
router.delete('/:id/variants/:variantId', requirePermission(Permissions.PRODUCTS_DELETE), productsController.deleteVariant.bind(productsController));

// Generation
router.get('/:id/barcode', requirePermission(Permissions.PRODUCTS_READ), productsController.generateBarcode.bind(productsController));
router.get('/:id/qrcode', requirePermission(Permissions.PRODUCTS_READ), productsController.generateQRCode.bind(productsController));

// Media
router.post('/:id/images', requirePermission(Permissions.PRODUCTS_UPDATE), upload.array('images', 10), productsController.uploadImages.bind(productsController));
router.delete('/:id/images/:imageId', requirePermission(Permissions.PRODUCTS_DELETE), productsController.deleteImage.bind(productsController));

export default router;
