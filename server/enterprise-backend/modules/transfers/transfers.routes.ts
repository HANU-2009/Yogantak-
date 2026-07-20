import { Router } from 'express';
import { transfersController } from './transfers.controller';
import { authenticate, requirePermission, Permissions } from '../../shared/middleware/rbac.middleware';
import { validateBody, validateQuery } from '../../shared/middleware/validate.middleware';
import { 
  CreateTransferDto, 
  UpdateTransferDto, 
  ReceiveTransferDto,
  TransferQueryDto 
} from './transfers.dto';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission(Permissions.INVENTORY_READ), validateQuery(TransferQueryDto), transfersController.findAll.bind(transfersController));
router.get('/:id', requirePermission(Permissions.INVENTORY_READ), transfersController.findById.bind(transfersController));

router.post('/', requirePermission(Permissions.INVENTORY_UPDATE), validateBody(CreateTransferDto), transfersController.create.bind(transfersController));
router.put('/:id', requirePermission(Permissions.INVENTORY_UPDATE), validateBody(UpdateTransferDto), transfersController.update.bind(transfersController));
router.post('/:id/dispatch', requirePermission(Permissions.INVENTORY_UPDATE), transfersController.dispatch.bind(transfersController));
router.post('/:id/receive', requirePermission(Permissions.INVENTORY_UPDATE), validateBody(ReceiveTransferDto), transfersController.receive.bind(transfersController));

export default router;
