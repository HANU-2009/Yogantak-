import { z } from 'zod';
import { SalesOrderStatus, PaymentStatus } from '@prisma/client';

export const SalesOrderItemDto = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().min(0),
  taxPercent: z.number().min(0).max(100).default(0),
  discountAmount: z.number().min(0).default(0),
  notes: z.string().optional(),
});

export const CreateSalesOrderDto = z.object({
  customerId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  orderDate: z.string().datetime().optional(),
  shippingAddress: z.string().max(500),
  billingAddress: z.string().max(500),
  shippingCost: z.number().min(0).default(0),
  otherCharges: z.number().min(0).default(0),
  notes: z.string().optional(),
  items: z.array(SalesOrderItemDto).min(1),
});

export const UpdateSalesOrderDto = z.object({
  status: z.nativeEnum(SalesOrderStatus).optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  shippingAddress: z.string().max(500).optional(),
  billingAddress: z.string().max(500).optional(),
  shippingCost: z.number().min(0).optional(),
  otherCharges: z.number().min(0).optional(),
  trackingNumber: z.string().max(100).optional(),
  notes: z.string().optional(),
});

export const FulfillSalesOrderDto = z.object({
  trackingNumber: z.string().max(100).optional(),
  notes: z.string().optional(),
});

export const SalesOrderQueryDto = z.object({
  page: z.string().optional().transform(Number),
  limit: z.string().optional().transform(Number),
  customerId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
  status: z.nativeEnum(SalesOrderStatus).optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  orderNumber: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type SalesOrderItemDtoType = z.infer<typeof SalesOrderItemDto>;
export type CreateSalesOrderDtoType = z.infer<typeof CreateSalesOrderDto>;
export type UpdateSalesOrderDtoType = z.infer<typeof UpdateSalesOrderDto>;
export type FulfillSalesOrderDtoType = z.infer<typeof FulfillSalesOrderDto>;
export type SalesOrderQueryDtoType = z.infer<typeof SalesOrderQueryDto>;
