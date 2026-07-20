import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authenticate, requirePermission, Permissions } from '../../shared/middleware/rbac.middleware';

const router = Router();

router.use(authenticate);

router.get('/overview', requirePermission(Permissions.DASHBOARD_VIEW), dashboardController.getOverview.bind(dashboardController));
router.get('/activities', requirePermission(Permissions.DASHBOARD_VIEW), dashboardController.getRecentActivities.bind(dashboardController));

export default router;
