import { z } from 'zod';
import { StockOperationType } from '@prisma/client';

export const StockOperationDto = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  warehouseId: z.string().uuid(),
  operationType: z.nativeEnum(StockOperationType),
  quantity: z.number().int().positive(),
  reason: z.string().max(255).optional(),
  referenceType: z.string().max(100).optional(),
  referenceId: z.string().max(100).optional(),
  batchNumber: z.string().max(100).optional(),
  serialNumber: z.string().max(100).optional(),
  unitCost: z.number().positive().optional(),
  notes: z.string().optional(),
});

export const BulkStockUpdateDto = z.object({
  operations: z.array(StockOperationDto).min(1).max(500),
});

export const InventoryQueryDto = z.object({
  page: z.string().optional().transform(Number),
  limit: z.string().optional().transform(Number),
  productId: z.string().uuid().optional(),
  variantId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
  lowStock: z.string().optional().transform((v) => v === 'true' ? true : v === 'false' ? false : undefined),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const ReserveStockDto = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  warehouseId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export type StockOperationDtoType = z.infer<typeof StockOperationDto>;
export type BulkStockUpdateDtoType = z.infer<typeof BulkStockUpdateDto>;
export type InventoryQueryDtoType = z.infer<typeof InventoryQueryDto>;
export type ReserveStockDtoType = z.infer<typeof ReserveStockDto>;
