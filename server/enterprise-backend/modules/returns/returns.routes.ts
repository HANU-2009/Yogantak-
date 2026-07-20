import { Router } from 'express';
import { returnsController } from './returns.controller';
import { authenticate, requirePermission, Permissions } from '../../shared/middleware/rbac.middleware';
import { validateBody, validateQuery } from '../../shared/middleware/validate.middleware';
import { 
  CreateReturnDto, 
  UpdateReturnDto, 
  ReceiveReturnDto,
  ReturnQueryDto 
} from './returns.dto';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission(Permissions.INVENTORY_READ), validateQuery(ReturnQueryDto), returnsController.findAll.bind(returnsController));
router.get('/:id', requirePermission(Permissions.INVENTORY_READ), returnsController.findById.bind(returnsController));

router.post('/', requirePermission(Permissions.INVENTORY_UPDATE), validateBody(CreateReturnDto), returnsController.create.bind(returnsController));
router.put('/:id', requirePermission(Permissions.INVENTORY_UPDATE), validateBody(UpdateReturnDto), returnsController.update.bind(returnsController));
router.post('/:id/receive', requirePermission(Permissions.INVENTORY_UPDATE), validateBody(ReceiveReturnDto), returnsController.receive.bind(returnsController));

export default router;
