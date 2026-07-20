import { Router } from 'express';
import { HealthController } from './health.controller';

const router = Router();
const healthController = new HealthController();

router.get('/', healthController.getHealth);
router.get('/db', healthController.getDbHealth);
router.get('/redis', healthController.getRedisHealth);

export default router;
