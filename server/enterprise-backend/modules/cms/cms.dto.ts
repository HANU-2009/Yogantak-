import { z } from 'zod';

export const CreatePageDto = z.object({
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  content: z.string().min(1),
  isPublished: z.boolean().default(false),
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
});

export const UpdatePageDto = CreatePageDto.partial();

export const CreateBlogDto = z.object({
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  content: z.string().min(1),
  image: z.string().url().optional(),
  isPublished: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
});

export const UpdateBlogDto = CreateBlogDto.partial();

export const CreateBannerDto = z.object({
  title: z.string().min(1).max(255),
  imageUrl: z.string().url(),
  linkUrl: z.string().url().optional(),
  position: z.string().default('homepage_hero'),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const UpdateBannerDto = CreateBannerDto.partial();

export const CreateTestimonialDto = z.object({
  customerName: z.string().min(1).max(255),
  company: z.string().max(255).optional(),
  content: z.string().min(1),
  rating: z.number().int().min(1).max(5).default(5),
  avatarUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
});

export const UpdateTestimonialDto = CreateTestimonialDto.partial();

export const CreateFaqDto = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  category: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const UpdateFaqDto = CreateFaqDto.partial();

export type CreatePageDtoType = z.infer<typeof CreatePageDto>;
export type UpdatePageDtoType = z.infer<typeof UpdatePageDto>;
export type CreateBlogDtoType = z.infer<typeof CreateBlogDto>;
export type UpdateBlogDtoType = z.infer<typeof UpdateBlogDto>;
export type CreateBannerDtoType = z.infer<typeof CreateBannerDto>;
export type UpdateBannerDtoType = z.infer<typeof UpdateBannerDto>;
export type CreateTestimonialDtoType = z.infer<typeof CreateTestimonialDto>;
export type UpdateTestimonialDtoType = z.infer<typeof UpdateTestimonialDto>;
export type CreateFaqDtoType = z.infer<typeof CreateFaqDto>;
export type UpdateFaqDtoType = z.infer<typeof UpdateFaqDto>;
