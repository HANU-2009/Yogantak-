import { Router } from 'express';
import { categoriesController } from './categories.controller';
import { authenticate, requirePermission, Permissions } from '../../shared/middleware/rbac.middleware';
import { validateBody, validateQuery } from '../../shared/middleware/validate.middleware';
import { CreateCategoryDto, UpdateCategoryDto, CategoryQueryDto } from './categories.dto';
import { cacheMiddleware } from '../../shared/middleware/cache.middleware';

const router = Router();

// Cache categories for 5 minutes
router.get('/', cacheMiddleware(300), validateQuery(CategoryQueryDto), categoriesController.findAll.bind(categoriesController));
router.get('/:id', cacheMiddleware(300), categoriesController.findById.bind(categoriesController));

router.use(authenticate);

router.post('/', requirePermission(Permissions.PRODUCTS_CREATE), validateBody(CreateCategoryDto), categoriesController.create.bind(categoriesController));
router.put('/:id', requirePermission(Permissions.PRODUCTS_UPDATE), validateBody(UpdateCategoryDto), categoriesController.update.bind(categoriesController));
router.delete('/:id', requirePermission(Permissions.PRODUCTS_DELETE), categoriesController.delete.bind(categoriesController));

export default router;
