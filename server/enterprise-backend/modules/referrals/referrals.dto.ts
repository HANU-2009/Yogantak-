import { z } from 'zod';

export const SendReferralDto = z.object({
  referredEmail: z.string().email(),
});

export const CompleteReferralDto = z.object({
  referredUserId: z.string().uuid(),
  referralId: z.string().uuid(),
  rewardPoints: z.number().int().positive().default(100),
});

export type SendReferralDtoType = z.infer<typeof SendReferralDto>;
export type CompleteReferralDtoType = z.infer<typeof CompleteReferralDto>;
