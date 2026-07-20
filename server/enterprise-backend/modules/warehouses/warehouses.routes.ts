import { Router } from 'express';
import { warehousesController } from './warehouses.controller';
import { authenticate, requirePermission, Permissions } from '../../shared/middleware/rbac.middleware';
import { validateBody, validateQuery } from '../../shared/middleware/validate.middleware';
import { 
  CreateWarehouseDto, 
  UpdateWarehouseDto, 
  WarehouseQueryDto,
  CreateZoneDto,
  CreateRackDto,
  CreateShelfDto,
  CreateBinDto
} from './warehouses.dto';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission(Permissions.WAREHOUSES_READ), validateQuery(WarehouseQueryDto), warehousesController.findAll.bind(warehousesController));
router.get('/:id', requirePermission(Permissions.WAREHOUSES_READ), warehousesController.findById.bind(warehousesController));
router.post('/', requirePermission(Permissions.WAREHOUSES_CREATE), validateBody(CreateWarehouseDto), warehousesController.create.bind(warehousesController));
router.put('/:id', requirePermission(Permissions.WAREHOUSES_UPDATE), validateBody(UpdateWarehouseDto), warehousesController.update.bind(warehousesController));
router.delete('/:id', requirePermission(Permissions.WAREHOUSES_DELETE), warehousesController.delete.bind(warehousesController));

router.post('/:id/zones', requirePermission(Permissions.WAREHOUSES_UPDATE), validateBody(CreateZoneDto), warehousesController.addZone.bind(warehousesController));
router.post('/zones/:zoneId/racks', requirePermission(Permissions.WAREHOUSES_UPDATE), validateBody(CreateRackDto), warehousesController.addRack.bind(warehousesController));
router.post('/racks/:rackId/shelves', requirePermission(Permissions.WAREHOUSES_UPDATE), validateBody(CreateShelfDto), warehousesController.addShelf.bind(warehousesController));
router.post('/shelves/:shelfId/bins', requirePermission(Permissions.WAREHOUSES_UPDATE), validateBody(CreateBinDto), warehousesController.addBin.bind(warehousesController));

export default router;
