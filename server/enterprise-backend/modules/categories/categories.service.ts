import { prisma } from '../../config/database';
import { generateSlug } from '../../shared/utils/sku-generator';
import { NotFoundError, ConflictError } from '../../shared/errors/AppError';
import type { CreateCategoryDtoType, UpdateCategoryDtoType, CategoryQueryDtoType } from './categories.dto';

export class CategoriesService {
  async findAll(query: CategoryQueryDtoType) {
    const where = {
      deletedAt: null,
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      ...(query.parentId !== undefined ? { parentId: query.parentId } : { parentId: null }),
    };

    return prisma.category.findMany({
      where,
      include: query.includeChildren ? { children: { where: { deletedAt: null } } } : undefined,
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findById(id: string) {
    const category = await prisma.category.findFirst({
      where: { id, deletedAt: null },
      include: { children: { where: { deletedAt: null } } },
    });
    if (!category) throw new NotFoundError('Category not found');
    return category;
  }

  async create(dto: CreateCategoryDtoType) {
    const slug = generateSlug(dto.name);
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) throw new ConflictError('Category with similar name exists');

    if (dto.parentId) {
      const parent = await prisma.category.findFirst({ where: { id: dto.parentId, deletedAt: null } });
      if (!parent) throw new NotFoundError('Parent category not found');
    }

    return prisma.category.create({
      data: { ...dto, slug },
    });
  }

  async update(id: string, dto: UpdateCategoryDtoType) {
    const category = await prisma.category.findFirst({ where: { id, deletedAt: null } });
    if (!category) throw new NotFoundError('Category not found');

    let slug = category.slug;
    if (dto.name && dto.name !== category.name) {
      slug = generateSlug(dto.name);
      const existing = await prisma.category.findUnique({ where: { slug } });
      if (existing && existing.id !== id) throw new ConflictError('Category with similar name exists');
    }

    return prisma.category.update({
      where: { id },
      data: { ...dto, slug },
    });
  }

  async delete(id: string) {
    const category = await prisma.category.findFirst({ where: { id, deletedAt: null } });
    if (!category) throw new NotFoundError('Category not found');

    await prisma.category.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}

export const categoriesService = new CategoriesService();
