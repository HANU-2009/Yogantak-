import { z } from 'zod';
import { ProductStatus, ProductType } from '@prisma/client';

export const CreateProductDto = z.object({
  name: z.string().min(2).max(255).trim(),
  sku: z.string().min(2).max(100).trim().optional(),
  barcode: z.string().max(100).optional(),
  shortDescription: z.string().max(500).optional(),
  longDescription: z.string().optional(),
  brandId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  subcategoryId: z.string().uuid().optional(),
  supplierId: z.string().uuid().optional(),
  productType: z.nativeEnum(ProductType).default('SIMPLE'),
  hsnCode: z.string().max(20).optional(),
  gstPercent: z.number().min(0).max(100).optional(),
  manufacturer: z.string().max(255).optional(),
  countryOfOrigin: z.string().max(100).optional(),
  warranty: z.string().max(255).optional(),
  weight: z.number().positive().optional(),
  weightUnit: z.string().default('kg'),
  length: z.number().positive().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  dimensionUnit: z.string().default('cm'),
  material: z.string().max(255).optional(),
  color: z.string().max(100).optional(),
  size: z.string().max(100).optional(),
  mrp: z.number().positive(),
  costPrice: z.number().positive().optional(),
  sellingPrice: z.number().positive(),
  discountPrice: z.number().positive().optional(),
  status: z.nativeEnum(ProductStatus).default('DRAFT'),
  isFeatured: z.boolean().default(false),
  isTrending: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  isActive: z.boolean().default(true),
  metaTitle: z.string().max(255).optional(),
  metaDescription: z.string().max(500).optional(),
  notes: z.string().optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  collectionIds: z.array(z.string().uuid()).optional(),
});

export const UpdateProductDto = CreateProductDto.partial();

export const ProductQueryDto = z.object({
  page: z.string().optional().transform(Number),
  limit: z.string().optional().transform(Number),
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  subcategoryId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  supplierId: z.string().uuid().optional(),
  status: z.nativeEnum(ProductStatus).optional(),
  productType: z.nativeEnum(ProductType).optional(),
  isFeatured: z.string().optional().transform((v) => v === 'true' ? true : v === 'false' ? false : undefined),
  isTrending: z.string().optional().transform((v) => v === 'true' ? true : v === 'false' ? false : undefined),
  isNewArrival: z.string().optional().transform((v) => v === 'true' ? true : v === 'false' ? false : undefined),
  isBestSeller: z.string().optional().transform((v) => v === 'true' ? true : v === 'false' ? false : undefined),
  isActive: z.string().optional().transform((v) => v === 'true' ? true : v === 'false' ? false : undefined),
  minPrice: z.string().optional().transform(Number),
  maxPrice: z.string().optional().transform(Number),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const CreateVariantDto = z.object({
  sku: z.string().min(2).max(100).optional(),
  barcode: z.string().max(100).optional(),
  name: z.string().min(2).max(255),
  color: z.string().max(100).optional(),
  size: z.string().max(100).optional(),
  weight: z.number().positive().optional(),
  ram: z.string().max(50).optional(),
  storage: z.string().max(50).optional(),
  model: z.string().max(100).optional(),
  edition: z.string().max(100).optional(),
  package: z.string().max(100).optional(),
  mrp: z.number().positive(),
  costPrice: z.number().positive().optional(),
  sellingPrice: z.number().positive(),
  discountPrice: z.number().positive().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const BulkProductActionDto = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
  action: z.enum(['delete', 'restore', 'archive', 'activate', 'deactivate', 'feature', 'unfeature']),
});

export const BulkPriceUpdateDto = z.object({
  updates: z.array(z.object({
    productId: z.string().uuid(),
    mrp: z.number().positive().optional(),
    sellingPrice: z.number().positive().optional(),
    discountPrice: z.number().positive().optional(),
  })).min(1).max(500),
});

export type CreateProductDtoType = z.infer<typeof CreateProductDto>;
export type UpdateProductDtoType = z.infer<typeof UpdateProductDto>;
export type ProductQueryDtoType = z.infer<typeof ProductQueryDto>;
export type CreateVariantDtoType = z.infer<typeof CreateVariantDto>;
export type BulkProductActionDtoType = z.infer<typeof BulkProductActionDto>;
