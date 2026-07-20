import { z } from 'zod';
import { ReturnStatus, ReturnType } from '@prisma/client';

export const ReturnItemDto = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.number().int().positive(),
  reason: z.string().max(255).optional(),
  condition: z.enum(['NEW', 'DAMAGED', 'DEFECTIVE', 'OPEN_BOX']).default('NEW'),
});

export const CreateReturnDto = z.object({
  returnType: z.nativeEnum(ReturnType),
  warehouseId: z.string().uuid(),
  customerId: z.string().uuid().optional(),
  supplierId: z.string().uuid().optional(),
  referenceType: z.string().max(100).optional(),
  referenceId: z.string().max(100).optional(),
  reason: z.string().max(500),
  notes: z.string().optional(),
  items: z.array(ReturnItemDto).min(1),
}).refine(data => {
  if (data.returnType === 'CUSTOMER_RETURN' && !data.customerId) return false;
  if (data.returnType === 'SUPPLIER_RETURN' && !data.supplierId) return false;
  return true;
}, { message: "Appropriate ID must be provided based on return type" });

export const UpdateReturnDto = z.object({
  status: z.nativeEnum(ReturnStatus).optional(),
  notes: z.string().optional(),
});

export const ReceiveReturnDto = z.object({
  notes: z.string().optional(),
  items: z.array(z.object({
    id: z.string().uuid(),
    receivedQuantity: z.number().int().min(0),
    condition: z.enum(['NEW', 'DAMAGED', 'DEFECTIVE', 'OPEN_BOX']).optional(),
  })).min(1),
});

export const ReturnQueryDto = z.object({
  page: z.string().optional().transform(Number),
  limit: z.string().optional().transform(Number),
  returnType: z.nativeEnum(ReturnType).optional(),
  status: z.nativeEnum(ReturnStatus).optional(),
  warehouseId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  supplierId: z.string().uuid().optional(),
  returnNumber: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type ReturnItemDtoType = z.infer<typeof ReturnItemDto>;
export type CreateReturnDtoType = z.infer<typeof CreateReturnDto>;
export type UpdateReturnDtoType = z.infer<typeof UpdateReturnDto>;
export type ReceiveReturnDtoType = z.infer<typeof ReceiveReturnDto>;
export type ReturnQueryDtoType = z.infer<typeof ReturnQueryDto>;
