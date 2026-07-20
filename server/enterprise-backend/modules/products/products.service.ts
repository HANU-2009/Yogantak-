import bwipjs from 'bwip-js';
import QRCode from 'qrcode';
import { prisma } from '../../config/database';
import { productsRepository } from './products.repository';
import type {
  CreateProductDtoType,
  UpdateProductDtoType,
  ProductQueryDtoType,
  CreateVariantDtoType,
  BulkProductActionDtoType,
  BulkPriceUpdateDto,
} from './products.dto';
import { z } from 'zod';

type BulkPriceUpdateDtoType = z.infer<typeof BulkPriceUpdateDto>;

export class ProductsService {
  async findAll(query: ProductQueryDtoType) {
    return productsRepository.findAll(query);
  }

  async findById(id: string) {
    return productsRepository.findById(id);
  }

  async findBySku(sku: string) {
    const product = await productsRepository.findBySku(sku);
    if (!product) throw new Error('Product not found');
    return product;
  }

  async findByBarcode(barcode: string) {
    const product = await productsRepository.findByBarcode(barcode);
    if (!product) throw new Error('Product not found');
    return product;
  }

  async create(dto: CreateProductDtoType, userId?: string) {
    const product = await productsRepository.create(dto, userId);

    // Generate QR code
    const qrData = JSON.stringify({ id: product.id, sku: (product as any).sku, name: (product as any).name });
    const qrCode = await QRCode.toDataURL(qrData);

    await prisma.product.update({
      where: { id: product.id },
      data: { qrCode },
    });

    return { ...product, qrCode };
  }

  async update(id: string, dto: UpdateProductDtoType, userId?: string) {
    return productsRepository.update(id, dto, userId);
  }

  async delete(id: string): Promise<void> {
    return productsRepository.softDelete(id);
  }

  async bulkAction(dto: BulkProductActionDtoType) {
    return productsRepository.bulkAction(dto);
  }

  async bulkPriceUpdate(dto: BulkPriceUpdateDtoType) {
    const results = await Promise.allSettled(
      dto.updates.map((u) =>
        prisma.product.update({
          where: { id: u.productId },
          data: {
            ...(u.mrp && { mrp: u.mrp }),
            ...(u.sellingPrice && { sellingPrice: u.sellingPrice }),
            ...(u.discountPrice !== undefined && { discountPrice: u.discountPrice }),
          },
        })
      )
    );

    const success = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;
    return { success, failed, total: dto.updates.length };
  }

  async addVariant(productId: string, dto: CreateVariantDtoType) {
    return productsRepository.addVariant(productId, dto);
  }

  async updateVariant(productId: string, variantId: string, dto: Partial<CreateVariantDtoType>) {
    return productsRepository.updateVariant(productId, variantId, dto);
  }

  async deleteVariant(variantId: string): Promise<void> {
    return productsRepository.deleteVariant(variantId);
  }

  async generateBarcode(productId: string): Promise<Buffer> {
    const product = await productsRepository.findById(productId);
    if (!product) throw new Error('Product not found');

    const barcodeValue = (product as any).barcode || (product as any).sku;
    const png = await bwipjs.toBuffer({
      bcid: 'code128',
      text: barcodeValue,
      scale: 3,
      height: 10,
      includetext: true,
      textxalign: 'center',
    });

    return Buffer.from(png);
  }

  async generateQRCode(productId: string): Promise<string> {
    const product = await productsRepository.findById(productId);
    const qrData = JSON.stringify({
      id: (product as any).id,
      sku: (product as any).sku,
      name: (product as any).name,
      barcode: (product as any).barcode,
    });
    return QRCode.toDataURL(qrData);
  }

  async uploadImages(productId: string, files: Express.Multer.File[]) {
    const images = files.map((file, index) => ({
      productId,
      url: `/uploads/${file.filename}`,
      alt: file.originalname,
      sortOrder: index,
      isPrimary: index === 0,
    }));

    await prisma.productImage.createMany({ data: images });

    // Set thumbnail to first image
    if (images.length > 0) {
      await prisma.product.update({
        where: { id: productId },
        data: { thumbnail: images[0].url },
      });
    }

    return prisma.productImage.findMany({ where: { productId }, orderBy: { sortOrder: 'asc' } });
  }

  async deleteImage(imageId: string): Promise<void> {
    await prisma.productImage.delete({ where: { id: imageId } });
  }

  async getDashboardStats() {
    const [
      total,
      active,
      draft,
      featured,
      trending,
      newArrivals,
      bestSellers,
    ] = await Promise.all([
      prisma.product.count({ where: { deletedAt: null } }),
      prisma.product.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
      prisma.product.count({ where: { deletedAt: null, status: 'DRAFT' } }),
      prisma.product.count({ where: { deletedAt: null, isFeatured: true } }),
      prisma.product.count({ where: { deletedAt: null, isTrending: true } }),
      prisma.product.count({ where: { deletedAt: null, isNewArrival: true } }),
      prisma.product.count({ where: { deletedAt: null, isBestSeller: true } }),
    ]);

    return { total, active, draft, featured, trending, newArrivals, bestSellers };
  }
}

export const productsService = new ProductsService();
