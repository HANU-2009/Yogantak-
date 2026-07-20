import { Router } from 'express';
import { usersController } from './users.controller';
import { authenticate, requirePermission, Permissions } from '../../shared/middleware/rbac.middleware';
import { validateBody, validateQuery } from '../../shared/middleware/validate.middleware';
import { CreateUserDto, UpdateUserDto, UserQueryDto } from './users.dto';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission(Permissions.USERS_READ), validateQuery(UserQueryDto), usersController.findAll.bind(usersController));
router.get('/:id', requirePermission(Permissions.USERS_READ), usersController.findById.bind(usersController));
router.post('/', requirePermission(Permissions.USERS_CREATE), validateBody(CreateUserDto), usersController.create.bind(usersController));
router.put('/:id', requirePermission(Permissions.USERS_UPDATE), validateBody(UpdateUserDto), usersController.update.bind(usersController));
router.delete('/:id', requirePermission(Permissions.USERS_DELETE), usersController.delete.bind(usersController));

export default router;
