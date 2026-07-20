import { z } from 'zod';

export const GetRecommendationDto = z.object({
  userId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  limit: z.preprocess((val) => (val ? parseInt(val as string, 10) : 5), z.number().int().positive().optional()),
});

export type GetRecommendationDtoType = z.infer<typeof GetRecommendationDto>;

export const GetForecastDto = z.object({
  productId: z.string().uuid(),
  daysToForecast: z.preprocess((val) => (val ? parseInt(val as string, 10) : 30), z.number().int().positive().optional()),
});

export type GetForecastDtoType = z.infer<typeof GetForecastDto>;

export const GetVelocityDto = z.object({
  days: z.preprocess((val) => (val ? parseInt(val as string, 10) : 30), z.number().int().positive().optional()),
});

export type GetVelocityDtoType = z.infer<typeof GetVelocityDto>;

export const GetAbcXyzDto = z.object({
  days: z.preprocess((val) => (val ? parseInt(val as string, 10) : 90), z.number().int().positive().optional()),
});

export type GetAbcXyzDtoType = z.infer<typeof GetAbcXyzDto>;
