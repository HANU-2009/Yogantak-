import { Router } from 'express';
import { couponsController } from './coupons.controller';
import { authenticate } from '../../shared/middleware/rbac.middleware';
import { validateBody } from '../../shared/middleware/validate.middleware';
import { CreateCouponDto, UpdateCouponDto, ApplyCouponDto } from './coupons.dto';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /coupons:
 *   get:
 *     tags: [Coupons]
 *     summary: Retrieve coupons list
 *     responses:
 *       200:
 *         description: Coupons retrieved successfully
 *   post:
 *     tags: [Coupons]
 *     summary: Create a coupon
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, discountType, discountValue]
 *             properties:
 *               code: { type: string }
 *               discountType: { type: string, enum: [PERCENTAGE, FIXED_AMOUNT, FREE_SHIPPING] }
 *               discountValue: { type: number }
 *               minPurchase: { type: number }
 *               maxDiscount: { type: number }
 *               startDate: { type: string, format: date-time }
 *               endDate: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Coupon created successfully
 */
router.get('/', couponsController.getCoupons.bind(couponsController));
router.post('/', validateBody(CreateCouponDto), couponsController.createCoupon.bind(couponsController));

/**
 * @swagger
 * /coupons/apply:
 *   post:
 *     tags: [Coupons]
 *     summary: Apply a coupon to checkout/cart
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, cartTotal]
 *             properties:
 *               code: { type: string }
 *               cartTotal: { type: number }
 *     responses:
 *       200:
 *         description: Coupon applied successfully
 *       400:
 *         description: Invalid or expired coupon
 */
router.post('/apply', validateBody(ApplyCouponDto), couponsController.applyCoupon.bind(couponsController));

/**
 * @swagger
 * /coupons/{id}:
 *   get:
 *     tags: [Coupons]
 *     summary: Retrieve coupon details by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Coupon details retrieved
 *       404:
 *         description: Coupon not found
 *   put:
 *     tags: [Coupons]
 *     summary: Update a coupon
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description: { type: string }
 *               discountValue: { type: number }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: Coupon updated
 *       404:
 *         description: Coupon not found
 *   delete:
 *     tags: [Coupons]
 *     summary: Delete a coupon
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Coupon deleted
 *       404:
 *         description: Coupon not found
 */
router.get('/:id', couponsController.getCouponById.bind(couponsController));
router.put('/:id', validateBody(UpdateCouponDto), couponsController.updateCoupon.bind(couponsController));
router.delete('/:id', couponsController.deleteCoupon.bind(couponsController));

export default router;
