import { Router } from 'express';
import { WebhooksController } from './webhooks.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { requirePermission } from '../../shared/middleware/rbac.middleware';

const router = Router();
const webhooksController = new WebhooksController();

// Typically, setting up webhooks is an admin/system level function.
router.use(authenticate);

// Testing endpoint for dispatching webhooks
router.post('/test', requirePermission('SYSTEM_WEBHOOKS'), webhooksController.testWebhook);

export default router;
