import { z } from 'zod';

export const CreateCouponDto = z.object({
  code: z.string().min(1).max(50).toUpperCase(),
  description: z.string().optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING']).default('PERCENTAGE'),
  discountValue: z.number().positive(),
  minPurchase: z.number().nonnegative().optional(),
  maxDiscount: z.number().nonnegative().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  usageLimit: z.number().int().positive().optional(),
  perUserLimit: z.number().int().positive().default(1),
  isActive: z.boolean().default(true),
});

export const UpdateCouponDto = CreateCouponDto.partial();

export const ApplyCouponDto = z.object({
  code: z.string().min(1).max(50).toUpperCase(),
  purchaseAmount: z.number().positive(),
});

export type CreateCouponDtoType = z.infer<typeof CreateCouponDto>;
export type UpdateCouponDtoType = z.infer<typeof UpdateCouponDto>;
export type ApplyCouponDtoType = z.infer<typeof ApplyCouponDto>;
