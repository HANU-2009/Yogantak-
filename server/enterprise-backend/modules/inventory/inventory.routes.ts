import { Router } from 'express';
import { inventoryController } from './inventory.controller';
import { authenticate, requirePermission, Permissions } from '../../shared/middleware/rbac.middleware';
import { validateBody, validateQuery } from '../../shared/middleware/validate.middleware';
import { 
  StockOperationDto, 
  BulkStockUpdateDto, 
  InventoryQueryDto,
  ReserveStockDto
} from './inventory.dto';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission(Permissions.INVENTORY_READ), validateQuery(InventoryQueryDto), inventoryController.findAll.bind(inventoryController));
router.get('/product/:productId', requirePermission(Permissions.INVENTORY_READ), inventoryController.getProductStock.bind(inventoryController));

router.post('/operation', requirePermission(Permissions.INVENTORY_UPDATE), validateBody(StockOperationDto), inventoryController.executeStockOperation.bind(inventoryController));
router.post('/bulk-operation', requirePermission(Permissions.INVENTORY_UPDATE), validateBody(BulkStockUpdateDto), inventoryController.bulkUpdate.bind(inventoryController));

router.post('/reserve', requirePermission(Permissions.INVENTORY_UPDATE), validateBody(ReserveStockDto), inventoryController.reserveStock.bind(inventoryController));
router.post('/release', requirePermission(Permissions.INVENTORY_UPDATE), validateBody(ReserveStockDto), inventoryController.releaseStock.bind(inventoryController));

export default router;
