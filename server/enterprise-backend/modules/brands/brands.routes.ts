import { Router } from 'express';
import { brandsController } from './brands.controller';
import { authenticate, requirePermission, Permissions } from '../../shared/middleware/rbac.middleware';
import { validateBody, validateQuery } from '../../shared/middleware/validate.middleware';
import { CreateBrandDto, UpdateBrandDto, BrandQueryDto } from './brands.dto';

const router = Router();

router.get('/', validateQuery(BrandQueryDto), brandsController.findAll.bind(brandsController));
router.get('/:id', brandsController.findById.bind(brandsController));

router.use(authenticate);

router.post('/', requirePermission(Permissions.PRODUCTS_CREATE), validateBody(CreateBrandDto), brandsController.create.bind(brandsController));
router.put('/:id', requirePermission(Permissions.PRODUCTS_UPDATE), validateBody(UpdateBrandDto), brandsController.update.bind(brandsController));
router.delete('/:id', requirePermission(Permissions.PRODUCTS_DELETE), brandsController.delete.bind(brandsController));

export default router;
