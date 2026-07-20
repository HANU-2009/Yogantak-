import { z } from 'zod';

export const CreateCategoryDto = z.object({
  name: z.string().min(2).max(100).trim(),
  description: z.string().max(500).optional(),
  parentId: z.string().uuid().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const UpdateCategoryDto = CreateCategoryDto.partial();

export const CategoryQueryDto = z.object({
  isActive: z.string().optional().transform((v) => v === 'true' ? true : v === 'false' ? false : undefined),
  parentId: z.string().uuid().optional(),
  includeChildren: z.string().optional().transform(v => v === 'true'),
});

export type CreateCategoryDtoType = z.infer<typeof CreateCategoryDto>;
export type UpdateCategoryDtoType = z.infer<typeof UpdateCategoryDto>;
export type CategoryQueryDtoType = z.infer<typeof CategoryQueryDto>;
