import { prisma } from '../../config/database';
import { NotFoundError, BadRequestError } from '../../shared/errors/AppError';
import type { CreateCouponDtoType, UpdateCouponDtoType, ApplyCouponDtoType } from './coupons.dto';

export class CouponsService {
  async getCoupons() {
    return prisma.coupon.findMany();
  }

  async getCouponById(id: string) {
    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundError('Coupon not found');
    return coupon;
  }

  async getCouponByCode(code: string) {
    const coupon = await prisma.coupon.findUnique({ where: { code } });
    if (!coupon) throw new NotFoundError('Coupon code not found');
    return coupon;
  }

  async createCoupon(dto: CreateCouponDtoType) {
    return prisma.coupon.create({
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
    });
  }

  async updateCoupon(id: string, dto: UpdateCouponDtoType) {
    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundError('Coupon not found');
    return prisma.coupon.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async deleteCoupon(id: string) {
    return prisma.coupon.delete({ where: { id } });
  }

  async applyCoupon(dto: ApplyCouponDtoType, userId?: string) {
    const coupon = await prisma.coupon.findUnique({ where: { code: dto.code } });
    if (!coupon) throw new NotFoundError('Invalid coupon code');
    if (!coupon.isActive) throw new BadRequestError('Coupon is inactive');

    const now = new Date();
    if (coupon.startDate && now < coupon.startDate) {
      throw new BadRequestError('Coupon campaign has not started yet');
    }
    if (coupon.endDate && now > coupon.endDate) {
      throw new BadRequestError('Coupon has expired');
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      throw new BadRequestError('Coupon usage limit reached');
    }

    if (coupon.minPurchase && dto.purchaseAmount < Number(coupon.minPurchase)) {
      throw new BadRequestError(`Minimum purchase of ${coupon.minPurchase} required to use this coupon`);
    }

    if (userId && coupon.perUserLimit) {
      const userUsageCount = await prisma.couponUsage.count({
        where: { couponId: coupon.id, userId },
      });
      if (userUsageCount >= coupon.perUserLimit) {
        throw new BadRequestError('You have reached the usage limit for this coupon');
      }
    }

    let discountAmount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = (dto.purchaseAmount * Number(coupon.discountValue)) / 100;
      if (coupon.maxDiscount && discountAmount > Number(coupon.maxDiscount)) {
        discountAmount = Number(coupon.maxDiscount);
      }
    } else if (coupon.discountType === 'FIXED_AMOUNT') {
      discountAmount = Number(coupon.discountValue);
    } else if (coupon.discountType === 'FREE_SHIPPING') {
      discountAmount = 0; // Handled at shipping calculation level
    }

    return {
      couponId: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountAmount,
    };
  }

  async recordUsage(couponId: string, orderId: string, discountAmt: number, userId?: string) {
    return prisma.$transaction(async (tx) => {
      const coupon = await tx.coupon.findUnique({ where: { id: couponId } });
      if (!coupon) throw new NotFoundError('Coupon not found');

      await tx.coupon.update({
        where: { id: couponId },
        data: { usageCount: { increment: 1 } },
      });

      return tx.couponUsage.create({
        data: {
          couponId,
          userId,
          orderId,
          discountAmt,
        },
      });
    });
  }
}

export const couponsService = new CouponsService();
