import { prisma } from '../../config/database';
import { BadRequestError } from '../../shared/errors/AppError';
import type { EarnPointsDtoType, RedeemPointsDtoType } from './loyalty.dto';

export class LoyaltyService {
  async getPointsBalance(userId: string) {
    const transactions = await prisma.rewardPoint.findMany({
      where: { userId },
    });

    const balance = transactions.reduce((acc, trans) => {
      if (trans.type === 'EARN') {
        return acc + trans.points;
      } else {
        return acc - trans.points;
      }
    }, 0);

    return { userId, balance };
  }

  async getPointsHistory(userId: string) {
    return prisma.rewardPoint.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async earnPoints(dto: EarnPointsDtoType) {
    return prisma.rewardPoint.create({
      data: {
        userId: dto.userId,
        points: dto.points,
        type: 'EARN',
        source: dto.source,
        referenceId: dto.referenceId,
        description: dto.description,
      },
    });
  }

  async redeemPoints(userId: string, dto: RedeemPointsDtoType) {
    const { balance } = await this.getPointsBalance(userId);
    if (balance < dto.points) {
      throw new BadRequestError(`Insufficient points. Current balance is ${balance} points.`);
    }

    return prisma.rewardPoint.create({
      data: {
        userId,
        points: dto.points,
        type: 'REDEEM',
        source: 'ORDER',
        referenceId: dto.referenceId,
        description: dto.description || 'Points redeemed on checkout',
      },
    });
  }
}

export const loyaltyService = new LoyaltyService();
