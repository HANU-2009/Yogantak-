import { z } from 'zod';
import { UserStatus } from '@prisma/client';

export const CreateUserDto = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().toLowerCase().trim(),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number').optional(),
  password: z.string().min(8).optional(),
  status: z.nativeEnum(UserStatus).default('ACTIVE'),
  roleIds: z.array(z.string().uuid()).min(1),
});

export const UpdateUserDto = CreateUserDto.partial().omit({ password: true });

export const UserQueryDto = z.object({
  page: z.string().optional().transform(Number),
  limit: z.string().optional().transform(Number),
  search: z.string().optional(),
  status: z.nativeEnum(UserStatus).optional(),
  roleId: z.string().uuid().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type CreateUserDtoType = z.infer<typeof CreateUserDto>;
export type UpdateUserDtoType = z.infer<typeof UpdateUserDto>;
export type UserQueryDtoType = z.infer<typeof UserQueryDto>;
