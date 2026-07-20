import { z } from 'zod';

export const CreateWarehouseDto = z.object({
  name: z.string().min(2).max(100).trim(),
  description: z.string().max(500).optional(),
  type: z.string().max(50).optional(),
  managerName: z.string().max(100).optional(),
  managerEmail: z.string().email().optional().or(z.literal('')),
  managerPhone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  pincode: z.string().max(20).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  totalCapacity: z.number().min(0).optional(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});

export const UpdateWarehouseDto = CreateWarehouseDto.partial();

export const WarehouseQueryDto = z.object({
  isActive: z.string().optional().transform((v) => v === 'true' ? true : v === 'false' ? false : undefined),
  isDefault: z.string().optional().transform((v) => v === 'true' ? true : v === 'false' ? false : undefined),
});

export const CreateZoneDto = z.object({
  name: z.string().min(2).max(100).trim(),
  code: z.string().min(2).max(50).trim().optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
});

export const CreateRackDto = CreateZoneDto;
export const CreateShelfDto = CreateZoneDto;
export const CreateBinDto = CreateZoneDto;

export type CreateWarehouseDtoType = z.infer<typeof CreateWarehouseDto>;
export type UpdateWarehouseDtoType = z.infer<typeof UpdateWarehouseDto>;
export type WarehouseQueryDtoType = z.infer<typeof WarehouseQueryDto>;
export type CreateZoneDtoType = z.infer<typeof CreateZoneDto>;
export type CreateRackDtoType = z.infer<typeof CreateRackDto>;
export type CreateShelfDtoType = z.infer<typeof CreateShelfDto>;
export type CreateBinDtoType = z.infer<typeof CreateBinDto>;
