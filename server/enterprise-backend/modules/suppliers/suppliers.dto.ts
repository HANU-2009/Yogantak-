import { z } from 'zod';

export const CreateSupplierDto = z.object({
  name: z.string().min(2).max(255).trim(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  alternatePhone: z.string().max(20).optional(),
  contactPerson: z.string().max(100).optional(),
  website: z.string().url().optional().or(z.literal('')),
  gstNumber: z.string().max(50).optional(),
  panNumber: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  pincode: z.string().max(20).optional(),
  bankName: z.string().max(100).optional(),
  bankAccount: z.string().max(100).optional(),
  bankIfsc: z.string().max(50).optional(),
  creditLimit: z.number().min(0).optional(),
  creditDays: z.number().int().min(0).optional(),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
});

export const UpdateSupplierDto = CreateSupplierDto.partial();

export const SupplierQueryDto = z.object({
  page: z.string().optional().transform(Number),
  limit: z.string().optional().transform(Number),
  search: z.string().optional(),
  isActive: z.string().optional().transform((v) => v === 'true' ? true : v === 'false' ? false : undefined),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type CreateSupplierDtoType = z.infer<typeof CreateSupplierDto>;
export type UpdateSupplierDtoType = z.infer<typeof UpdateSupplierDto>;
export type SupplierQueryDtoType = z.infer<typeof SupplierQueryDto>;
