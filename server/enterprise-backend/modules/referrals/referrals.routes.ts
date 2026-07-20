import { Router } from 'express';
import { referralsController } from './referrals.controller';
import { authenticate, requirePermission, Permissions } from '../../shared/middleware/rbac.middleware';
import { validateBody } from '../../shared/middleware/validate.middleware';
import { SendReferralDto, CompleteReferralDto } from './referrals.dto';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /referrals/my-referrals:
 *   get:
 *     tags: [Referrals]
 *     summary: Get referred users list
 *     responses:
 *       200:
 *         description: Referrals list retrieved
 */
router.get('/my-referrals', referralsController.getMyReferrals.bind(referralsController));

/**
 * @swagger
 * /referrals/invite:
 *   post:
 *     tags: [Referrals]
 *     summary: Log a referral invite
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [referredEmail]
 *             properties:
 *               referredEmail: { type: string, format: email }
 *     responses:
 *       201:
 *         description: Referral invite logged
 */
router.post('/invite', validateBody(SendReferralDto), referralsController.sendReferral.bind(referralsController));

/**
 * @swagger
 * /referrals/complete:
 *   post:
 *     tags: [Referrals]
 *     summary: Complete referral and trigger payout (admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [referralId]
 *             properties:
 *               referralId: { type: string }
 *     responses:
 *       200:
 *         description: Referral completed and points distributed
 */
router.post('/complete', requirePermission(Permissions.USERS_UPDATE), validateBody(CompleteReferralDto), referralsController.completeReferral.bind(referralsController));

/**
 * @swagger
 * /referrals/redeem:
 *   post:
 *     tags: [Referrals]
 *     summary: Complete referral and trigger payout (alias)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [referralId]
 *             properties:
 *               referralId: { type: string }
 *     responses:
 *       200:
 *         description: Referral completed and points distributed
 */
router.post('/redeem', requirePermission(Permissions.USERS_UPDATE), validateBody(CompleteReferralDto), referralsController.completeReferral.bind(referralsController));

export default router;
