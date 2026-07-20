import { Router } from 'express';
import { salesController } from './sales.controller';
import { authenticate, requirePermission, Permissions } from '../../shared/middleware/rbac.middleware';
import { validateBody, validateQuery } from '../../shared/middleware/validate.middleware';
import { 
  CreateSalesOrderDto, 
  UpdateSalesOrderDto, 
  FulfillSalesOrderDto,
  SalesOrderQueryDto 
} from './sales.dto';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission(Permissions.SALES_READ), validateQuery(SalesOrderQueryDto), salesController.findAll.bind(salesController));
router.get('/:id', requirePermission(Permissions.SALES_READ), salesController.findById.bind(salesController));

router.post('/', requirePermission(Permissions.SALES_CREATE), validateBody(CreateSalesOrderDto), salesController.create.bind(salesController));
router.put('/:id', requirePermission(Permissions.SALES_UPDATE), validateBody(UpdateSalesOrderDto), salesController.update.bind(salesController));
router.post('/:id/fulfill', requirePermission(Permissions.SALES_UPDATE), validateBody(FulfillSalesOrderDto), salesController.fulfill.bind(salesController));

export default router;
