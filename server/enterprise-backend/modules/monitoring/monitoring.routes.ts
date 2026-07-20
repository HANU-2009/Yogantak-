import { Router } from 'express';
import { MonitoringController } from './monitoring.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { requirePermission } from '../../shared/middleware/rbac.middleware';

const router = Router();
const monitoringController = new MonitoringController();

// Only system admins should access monitoring data. Assuming we have an ADMIN role or permissions.
// For now, we will protect it with authentication and require a system-level permission.
// The exact permission might depend on your DB setup, e.g. 'SYSTEM_MONITOR'
router.use(authenticate);

// Protected routes
router.get('/redis', requirePermission('SYSTEM_MONITOR'), monitoringController.getRedisMetrics);
router.get('/queues', requirePermission('SYSTEM_MONITOR'), monitoringController.getQueueMetrics);

export default router;
