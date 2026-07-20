import { z } from 'zod';

export const EarnPointsDto = z.object({
  userId: z.string().uuid(),
  points: z.number().int().positive(),
  source: z.string().default('MANUAL'),
  referenceId: z.string().optional(),
  description: z.string().optional(),
});

export const RedeemPointsDto = z.object({
  points: z.number().int().positive(),
  referenceId: z.string().optional(),
  description: z.string().optional(),
});

export type EarnPointsDtoType = z.infer<typeof EarnPointsDto>;
export type RedeemPointsDtoType = z.infer<typeof RedeemPointsDto>;
