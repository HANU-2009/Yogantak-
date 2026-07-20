import { z } from 'zod';

export const CreateBrandDto = z.object({
  name: z.string().min(2).max(100).trim(),
  description: z.string().max(500).optional(),
  website: z.string().url().optional(),
  isActive: z.boolean().default(true),
});

export const UpdateBrandDto = CreateBrandDto.partial();

export const BrandQueryDto = z.object({
  isActive: z.string().optional().transform((v) => v === 'true' ? true : v === 'false' ? false : undefined),
});

export type CreateBrandDtoType = z.infer<typeof CreateBrandDto>;
export type UpdateBrandDtoType = z.infer<typeof UpdateBrandDto>;
export type BrandQueryDtoType = z.infer<typeof BrandQueryDto>;
