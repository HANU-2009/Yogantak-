import { prisma } from '../../config/database';
import { NotFoundError, BadRequestError } from '../../shared/errors/AppError';
import { loyaltyService } from '../loyalty/loyalty.service';
import type { SendReferralDtoType, CompleteReferralDtoType } from './referrals.dto';

export class ReferralsService {
  async getMyReferrals(referrerId: string) {
    return prisma.referral.findMany({
      where: { referrerId },
      include: {
        referredUser: {
          select: { id: true, name: true, email: true, status: true },
        },
      },
    });
  }

  async sendReferral(referrerId: string, dto: SendReferralDtoType) {
    const existing = await prisma.referral.findFirst({
      where: { referrerId, referredEmail: dto.referredEmail },
    });
    if (existing) {
      throw new BadRequestError('You have already referred this email address');
    }

    const referredUserExists = await prisma.user.findUnique({
      where: { email: dto.referredEmail },
    });
    if (referredUserExists) {
      throw new BadRequestError('User with this email is already registered on our platform');
    }

    return prisma.referral.create({
      data: {
        referrerId,
        referredEmail: dto.referredEmail,
        status: 'PENDING',
      },
    });
  }

  async completeReferral(dto: CompleteReferralDtoType) {
    return prisma.$transaction(async (tx) => {
      const referral = await tx.referral.findUnique({
        where: { id: dto.referralId },
      });
      if (!referral) throw new NotFoundError('Referral record not found');
      if (referral.status === 'COMPLETED') {
        throw new BadRequestError('Referral is already marked as completed');
      }

      // Update Referral status
      const updatedReferral = await tx.referral.update({
        where: { id: dto.referralId },
        data: {
          referredUserId: dto.referredUserId,
          status: 'COMPLETED',
          rewardPoints: dto.rewardPoints,
        },
      });

      // Credit reward points to Referrer
      await loyaltyService.earnPoints({
        userId: referral.referrerId,
        points: dto.rewardPoints,
        source: 'REFERRAL',
        referenceId: referral.id,
        description: `Referral reward for inviting ${referral.referredEmail}`,
      });

      // Credit reward points to Referred User (Welcome bonus)
      await loyaltyService.earnPoints({
        userId: dto.referredUserId,
        points: Math.round(dto.rewardPoints / 2), // e.g. 50 points welcome bonus if referral is 100 points
        source: 'REFERRAL',
        referenceId: referral.id,
        description: `Welcome referral bonus for signing up`,
      });

      return updatedReferral;
    });
  }
}

export const referralsService = new ReferralsService();
