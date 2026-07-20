import { prisma } from '../../config/database';
import { generateSlug } from '../../shared/utils/sku-generator';
import { NotFoundError, ConflictError } from '../../shared/errors/AppError';
import type { CreateBrandDtoType, UpdateBrandDtoType, BrandQueryDtoType } from './brands.dto';

export class BrandsService {
  async findAll(query: BrandQueryDtoType) {
    const where = {
      ...(query.isActive !== undefined && { isActive: query.isActive }),
    };

    return prisma.brand.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const brand = await prisma.brand.findFirst({
      where: { id },
    });
    if (!brand) throw new NotFoundError('Brand not found');
    return brand;
  }

  async create(dto: CreateBrandDtoType) {
    const slug = generateSlug(dto.name);
    const existing = await prisma.brand.findUnique({ where: { slug } });
    if (existing) throw new ConflictError('Brand with similar name exists');

    return prisma.brand.create({
      data: { ...dto, slug },
    });
  }

  async update(id: string, dto: UpdateBrandDtoType) {
    const brand = await prisma.brand.findFirst({ where: { id } });
    if (!brand) throw new NotFoundError('Brand not found');

    let slug = brand.slug;
    if (dto.name && dto.name !== brand.name) {
      slug = generateSlug(dto.name);
      const existing = await prisma.brand.findUnique({ where: { slug } });
      if (existing && existing.id !== id) throw new ConflictError('Brand with similar name exists');
    }

    return prisma.brand.update({
      where: { id },
      data: { ...dto, slug },
    });
  }

  async delete(id: string) {
    const brand = await prisma.brand.findFirst({ where: { id } });
    if (!brand) throw new NotFoundError('Brand not found');

    await prisma.brand.delete({
      where: { id },
    });
  }
}

export const brandsService = new BrandsService();
