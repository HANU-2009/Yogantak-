import { Router } from 'express';
import { purchasesController } from './purchases.controller';
import { authenticate, requirePermission, Permissions } from '../../shared/middleware/rbac.middleware';
import { validateBody, validateQuery } from '../../shared/middleware/validate.middleware';
import { 
  CreatePurchaseOrderDto, 
  UpdatePurchaseOrderDto, 
  ReceivePurchaseOrderDto,
  PurchaseOrderQueryDto 
} from './purchases.dto';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission(Permissions.PURCHASES_READ), validateQuery(PurchaseOrderQueryDto), purchasesController.findAll.bind(purchasesController));
router.get('/:id', requirePermission(Permissions.PURCHASES_READ), purchasesController.findById.bind(purchasesController));

router.post('/', requirePermission(Permissions.PURCHASES_CREATE), validateBody(CreatePurchaseOrderDto), purchasesController.create.bind(purchasesController));
router.put('/:id', requirePermission(Permissions.PURCHASES_UPDATE), validateBody(UpdatePurchaseOrderDto), purchasesController.update.bind(purchasesController));
router.post('/:id/receive', requirePermission(Permissions.PURCHASES_UPDATE), validateBody(ReceivePurchaseOrderDto), purchasesController.receiveItems.bind(purchasesController));

export default router;
