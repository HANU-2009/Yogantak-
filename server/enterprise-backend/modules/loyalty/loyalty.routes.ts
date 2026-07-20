import { Router } from 'express';
import { loyaltyController } from './loyalty.controller';
import { authenticate, requirePermission, Permissions } from '../../shared/middleware/rbac.middleware';
import { validateBody } from '../../shared/middleware/validate.middleware';
import { EarnPointsDto, RedeemPointsDto } from './loyalty.dto';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /loyalty/my-balance:
 *   get:
 *     tags: [Loyalty]
 *     summary: Get logged-in user's points balance
 *     responses:
 *       200:
 *         description: Points balance retrieved
 */
router.get('/my-balance', loyaltyController.getMyPointsBalance.bind(loyaltyController));

/**
 * @swagger
 * /loyalty/my-points:
 *   get:
 *     tags: [Loyalty]
 *     summary: Get logged-in user's points balance (alias)
 *     responses:
 *       200:
 *         description: Points balance retrieved
 */
router.get('/my-points', loyaltyController.getMyPointsBalance.bind(loyaltyController));

/**
 * @swagger
 * /loyalty/my-history:
 *   get:
 *     tags: [Loyalty]
 *     summary: Get logged-in user's point logs
 *     responses:
 *       200:
 *         description: Points history retrieved
 */
router.get('/my-history', loyaltyController.getMyPointsHistory.bind(loyaltyController));

/**
 * @swagger
 * /loyalty/redeem:
 *   post:
 *     tags: [Loyalty]
 *     summary: Redeem loyalty points for rewards
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [points]
 *             properties:
 *               points: { type: integer }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Reward points redeemed successfully
 *       400:
 *         description: Insufficient points
 */
router.post('/redeem', validateBody(RedeemPointsDto), loyaltyController.redeemPoints.bind(loyaltyController));

/**
 * @swagger
 * /loyalty/balance/{userId}:
 *   get:
 *     tags: [Loyalty]
 *     summary: Get points balance for a specific user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User's points balance retrieved
 *       404:
 *         description: User not found
 */
router.get('/balance/:userId', requirePermission(Permissions.USERS_READ), loyaltyController.getUserPointsBalance.bind(loyaltyController));

/**
 * @swagger
 * /loyalty/earn:
 *   post:
 *     tags: [Loyalty]
 *     summary: Credit loyalty points to a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, points]
 *             properties:
 *               userId: { type: string }
 *               points: { type: integer }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Reward points credited successfully
 */
router.post('/earn', requirePermission(Permissions.USERS_UPDATE), validateBody(EarnPointsDto), loyaltyController.earnPoints.bind(loyaltyController));

export default router;
