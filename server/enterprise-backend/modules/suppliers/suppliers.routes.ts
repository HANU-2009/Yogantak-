import { Router } from 'express';
import { suppliersController } from './suppliers.controller';
import { authenticate, requirePermission, Permissions } from '../../shared/middleware/rbac.middleware';
import { validateBody, validateQuery } from '../../shared/middleware/validate.middleware';
import { CreateSupplierDto, UpdateSupplierDto, SupplierQueryDto } from './suppliers.dto';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission(Permissions.PRODUCTS_READ), validateQuery(SupplierQueryDto), suppliersController.findAll.bind(suppliersController));
router.get('/:id', requirePermission(Permissions.PRODUCTS_READ), suppliersController.findById.bind(suppliersController));
router.post('/', requirePermission(Permissions.PRODUCTS_CREATE), validateBody(CreateSupplierDto), suppliersController.create.bind(suppliersController));
router.put('/:id', requirePermission(Permissions.PRODUCTS_UPDATE), validateBody(UpdateSupplierDto), suppliersController.update.bind(suppliersController));
router.delete('/:id', requirePermission(Permissions.PRODUCTS_DELETE), suppliersController.delete.bind(suppliersController));

export default router;
