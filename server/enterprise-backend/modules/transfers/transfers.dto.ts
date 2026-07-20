import { z } from 'zod';
import { TransferStatus } from '@prisma/client';

export const TransferItemDto = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.number().int().positive(),
  notes: z.string().optional(),
});

export const CreateTransferDto = z.object({
  fromWarehouseId: z.string().uuid(),
  toWarehouseId: z.string().uuid(),
  transferDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  items: z.array(TransferItemDto).min(1),
});

export const UpdateTransferDto = z.object({
  notes: z.string().optional(),
});

export const ReceiveTransferDto = z.object({
  receivedDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    id: z.string().uuid(),
    receivedQuantity: z.number().int().min(0),
  })).min(1),
});

export const TransferQueryDto = z.object({
  page: z.string().optional().transform(Number),
  limit: z.string().optional().transform(Number),
  fromWarehouseId: z.string().uuid().optional(),
  toWarehouseId: z.string().uuid().optional(),
  status: z.nativeEnum(TransferStatus).optional(),
  transferNumber: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type TransferItemDtoType = z.infer<typeof TransferItemDto>;
export type CreateTransferDtoType = z.infer<typeof CreateTransferDto>;
export type UpdateTransferDtoType = z.infer<typeof UpdateTransferDto>;
export type ReceiveTransferDtoType = z.infer<typeof ReceiveTransferDto>;
export type TransferQueryDtoType = z.infer<typeof TransferQueryDto>;
