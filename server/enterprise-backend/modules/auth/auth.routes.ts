import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { validateBody } from '../../shared/middleware/validate.middleware';
import { authRateLimit } from '../../shared/middleware/rate-limit.middleware';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ChangePasswordDto,
} from './auth.dto';

const router = Router();

// Public routes
router.post('/register', authRateLimit, validateBody(RegisterDto), authController.register.bind(authController));
router.post('/login', authRateLimit, validateBody(LoginDto), authController.login.bind(authController));
router.post('/refresh', validateBody(RefreshTokenDto), authController.refreshToken.bind(authController));

// Protected routes
router.post('/logout', authenticate, authController.logout.bind(authController));
router.get('/profile', authenticate, authController.getProfile.bind(authController));
router.put('/change-password', authenticate, validateBody(ChangePasswordDto), authController.changePassword.bind(authController));

export default router;
