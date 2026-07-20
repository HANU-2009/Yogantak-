import { prisma } from '../../config/database';
import { Prisma } from '@prisma/client';
import {
  generateSKU,
  generateSlug,
  generateBarcodeValue,
} from '../../shared/utils/sku-generator';
import {
  NotFoundError,
  ConflictError,
} from '../../shared/errors/AppError';
import { parsePagination, buildPaginationMeta } from '../../shared/utils/pagination';
import { cacheGet, cacheSet, cacheDel, cacheDelPattern, CacheKeys } from '../../config/redis';
import { env } from '../../config/environment';
import type {
  CreateProductDtoType,
  UpdateProductDtoType,
  ProductQueryDtoType,
  CreateVariantDtoType,
  BulkProductActionDtoType,
} from './products.dto';

const PRODUCT_SELECT = {
  id: true,
  sku: true,
  barcode: true,
  qrCode: true,
  name: true,
  slug: true,
  shortDescription: true,
  longDescription: true,
  productType: true,
  hsnCode: true,
  gstPercent: true,
  manufacturer: true,
  countryOfOrigin: true,
  warranty: true,
  weight: true,
  weightUnit: true,
  length: true,
  width: true,
  height: true,
  dimensionUnit: true,
  material: true,
  color: true,
  size: true,
  thumbnail: true,
  mrp: true,
  costPrice: true,
  sellingPrice: true,
  discountPrice: true,
  status: true,
  isFeatured: true,
  isTrending: true,
  isNewArrival: true,
  isBestSeller: true,
  isActive: true,
  metaTitle: true,
  metaDescription: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  brand: { select: { id: true, name: true, slug: true } },
  category: { select: { id: true, name: true, slug: true } },
  subcategory: { select: { id: true, name: true, slug: true } },
  supplier: { select: { id: true, name: true, code: true } },
  images: { select: { id: true, url: true, alt: true, sortOrder: true, isPrimary: true }, orderBy: { sortOrder: 'asc' as const } },
  videos: { select: { id: true, url: true, title: true, thumbnail: true } },
  tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
  collections: { select: { collection: { select: { id: true, name: true, slug: true } } } },
  variants: {
    where: { isActive: true },
    select: {
      id: true, sku: true, barcode: true, name: true, color: true, size: true,
      ram: true, storage: true, mrp: true, sellingPrice: true, discountPrice: true,
      image: true, isActive: true, sortOrder: true,
    },
    orderBy: { sortOrder: 'asc' as const },
  },
} satisfies Prisma.ProductSelect;

export class ProductsRepository {
  async findAll(query: ProductQueryDtoType) {
    const { page, limit, skip, sortOrder } = parsePagination(query);
    const sortBy = query.sortBy || 'createdAt';

    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { sku: { contains: query.search, mode: 'insensitive' } },
          { barcode: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
      ...(query.categoryId && { categoryId: query.categoryId }),
      ...(query.subcategoryId && { subcategoryId: query.subcategoryId }),
      ...(query.brandId && { brandId: query.brandId }),
      ...(query.supplierId && { supplierId: query.supplierId }),
      ...(query.status && { status: query.status }),
      ...(query.productType && { productType: query.productType }),
      ...(query.isFeatured !== undefined && { isFeatured: query.isFeatured }),
      ...(query.isTrending !== undefined && { isTrending: query.isTrending }),
      ...(query.isNewArrival !== undefined && { isNewArrival: query.isNewArrival }),
      ...(query.isBestSeller !== undefined && { isBestSeller: query.isBestSeller }),
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      ...((query.minPrice || query.maxPrice) && {
        sellingPrice: {
          ...(query.minPrice && { gte: query.minPrice }),
          ...(query.maxPrice && { lte: query.maxPrice }),
        },
      }),
    };

    const [total, data] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        select: PRODUCT_SELECT,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
    ]);

    return {
      data,
      pagination: buildPaginationMeta(total, page, limit),
    };
  }

  async findById(id: string) {
    const cached = await cacheGet(CacheKeys.PRODUCT(id));
    if (cached) return cached;

    const product = await prisma.product.findFirst({
      where: { id, deletedAt: null },
      select: PRODUCT_SELECT,
    });

    if (!product) throw new NotFoundError('Product not found');

    await cacheSet(CacheKeys.PRODUCT(id), product, env.CACHE_TTL_MEDIUM);
    return product;
  }

  async findBySku(sku: string) {
    return prisma.product.findFirst({
      where: { sku, deletedAt: null },
      select: PRODUCT_SELECT,
    });
  }

  async findByBarcode(barcode: string) {
    return prisma.product.findFirst({
      where: { barcode, deletedAt: null },
      select: PRODUCT_SELECT,
    });
  }

  async create(dto: CreateProductDtoType, userId?: string) {
    // Generate SKU if not provided
    let sku = dto.sku;
    if (!sku) {
      do {
        sku = generateSKU('PROD');
      } while (await prisma.product.findUnique({ where: { sku } }));
    } else {
      const exists = await prisma.product.findUnique({ where: { sku } });
      if (exists) throw new ConflictError(`SKU '${sku}' already exists`);
    }

    // Generate slug
    const slug = generateSlug(dto.name);

    // Generate barcode if not provided
    let barcode = dto.barcode;
    if (!barcode) {
      barcode = generateBarcodeValue();
    }

    const { tagIds, collectionIds, ...productData } = dto;

    const product = await prisma.product.create({
      data: {
        ...productData,
        sku,
        slug,
        barcode,
        gstPercent: productData.gstPercent !== undefined ? productData.gstPercent : undefined,
        createdById: userId,
        updatedById: userId,
        ...(tagIds?.length && {
          tags: { create: tagIds.map((tagId) => ({ tagId })) },
        }),
        ...(collectionIds?.length && {
          collections: { create: collectionIds.map((collectionId) => ({ collectionId })) },
        }),
      },
      select: PRODUCT_SELECT,
    });

    await cacheDelPattern('products:list:*');
    return product;
  }

  async update(id: string, dto: UpdateProductDtoType, userId?: string) {
    const existing = await prisma.product.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundError('Product not found');

    if (dto.sku && dto.sku !== existing.sku) {
      const skuConflict = await prisma.product.findFirst({
        where: { sku: dto.sku, id: { not: id }, deletedAt: null },
      });
      if (skuConflict) throw new ConflictError(`SKU '${dto.sku}' already exists`);
    }

    const { tagIds, collectionIds, ...productData } = dto;

    const product = await prisma.$transaction(async (tx) => {
      if (tagIds !== undefined) {
        await tx.productTag.deleteMany({ where: { productId: id } });
        if (tagIds.length > 0) {
          await tx.productTag.createMany({
            data: tagIds.map((tagId) => ({ productId: id, tagId })),
          });
        }
      }

      if (collectionIds !== undefined) {
        await tx.productCollection.deleteMany({ where: { productId: id } });
        if (collectionIds.length > 0) {
          await tx.productCollection.createMany({
            data: collectionIds.map((collectionId) => ({ productId: id, collectionId })),
          });
        }
      }

      return tx.product.update({
        where: { id },
        data: { ...productData, updatedById: userId },
        select: PRODUCT_SELECT,
      });
    });

    await cacheDel(CacheKeys.PRODUCT(id));
    await cacheDelPattern('products:list:*');
    return product;
  }

  async softDelete(id: string): Promise<void> {
    const product = await prisma.product.findFirst({ where: { id, deletedAt: null } });
    if (!product) throw new NotFoundError('Product not found');

    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'ARCHIVED', isActive: false },
    });

    await cacheDel(CacheKeys.PRODUCT(id));
    await cacheDelPattern('products:list:*');
  }

  async bulkAction(dto: BulkProductActionDtoType): Promise<{ affected: number }> {
    let data: Prisma.ProductUpdateManyMutationInput = {};

    switch (dto.action) {
      case 'delete':
        await prisma.product.updateMany({
          where: { id: { in: dto.ids } },
          data: { deletedAt: new Date(), status: 'ARCHIVED', isActive: false },
        });
        return { affected: dto.ids.length };
      case 'activate':
        data = { status: 'ACTIVE', isActive: true };
        break;
      case 'deactivate':
        data = { status: 'INACTIVE', isActive: false };
        break;
      case 'archive':
        data = { status: 'ARCHIVED' };
        break;
      case 'feature':
        data = { isFeatured: true };
        break;
      case 'unfeature':
        data = { isFeatured: false };
        break;
    }

    const result = await prisma.product.updateMany({
      where: { id: { in: dto.ids }, deletedAt: null },
      data,
    });

    await cacheDelPattern('products:list:*');
    for (const id of dto.ids) await cacheDel(CacheKeys.PRODUCT(id));

    return { affected: result.count };
  }

  // Variant Operations
  async addVariant(productId: string, dto: CreateVariantDtoType) {
    const product = await prisma.product.findFirst({ where: { id: productId, deletedAt: null } });
    if (!product) throw new NotFoundError('Product not found');

    let sku = dto.sku;
    if (!sku) {
      sku = generateSKU(product.sku.split('-')[0]);
    }

    return prisma.productVariant.create({
      data: { ...dto, productId, sku, barcode: dto.barcode || generateBarcodeValue() },
    });
  }

  async updateVariant(productId: string, variantId: string, dto: Partial<CreateVariantDtoType>) {
    return prisma.productVariant.update({
      where: { id: variantId, productId },
      data: dto,
    });
  }

  async deleteVariant(variantId: string): Promise<void> {
    await prisma.productVariant.delete({ where: { id: variantId } });
  }

  async getLowStockProducts(_threshold = 10) {
    return prisma.inventory.findMany({
      where: { availableStock: { lte: prisma.inventory.fields.minStockLevel } },
      include: { product: { select: { id: true, name: true, sku: true } }, warehouse: true },
      take: 50,
    });
  }
}

export const productsRepository = new ProductsRepository();
