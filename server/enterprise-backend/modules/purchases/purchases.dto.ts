import { z } from 'zod';
import { PurchaseOrderStatus, PaymentStatus } from '@prisma/client';

export const PurchaseOrderItemDto = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().min(0),
  taxPercent: z.number().min(0).max(100).default(0),
  discountAmount: z.number().min(0).default(0),
  notes: z.string().optional(),
});

export const CreatePurchaseOrderDto = z.object({
  supplierId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  orderDate: z.string().datetime().optional(),
  expectedDate: z.string().datetime().optional(),
  referenceNumber: z.string().max(100).optional(),
  shippingCost: z.number().min(0).default(0),
  otherCharges: z.number().min(0).default(0),
  notes: z.string().optional(),
  items: z.array(PurchaseOrderItemDto).min(1),
});

export const UpdatePurchaseOrderDto = z.object({
  status: z.nativeEnum(PurchaseOrderStatus).optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  expectedDate: z.string().datetime().optional(),
  shippingCost: z.number().min(0).optional(),
  otherCharges: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export const ReceivePurchaseOrderDto = z.object({
  receivedDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    id: z.string().uuid(),
    receivedQuantity: z.number().int().min(0),
  })).min(1),
});

export const PurchaseOrderQueryDto = z.object({
  page: z.string().optional().transform(Number),
  limit: z.string().optional().transform(Number),
  supplierId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
  status: z.nativeEnum(PurchaseOrderStatus).optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  poNumber: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type PurchaseOrderItemDtoType = z.infer<typeof PurchaseOrderItemDto>;
export type CreatePurchaseOrderDtoType = z.infer<typeof CreatePurchaseOrderDto>;
export type UpdatePurchaseOrderDtoType = z.infer<typeof UpdatePurchaseOrderDto>;
export type ReceivePurchaseOrderDtoType = z.infer<typeof ReceivePurchaseOrderDto>;
export type PurchaseOrderQueryDtoType = z.infer<typeof PurchaseOrderQueryDto>;
