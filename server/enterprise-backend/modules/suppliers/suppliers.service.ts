import { prisma } from '../../config/database';
import { generateSupplierCode } from '../../shared/utils/sku-generator';
import { NotFoundError } from '../../shared/errors/AppError';
import { parsePagination, buildPaginationMeta } from '../../shared/utils/pagination';
import type { CreateSupplierDtoType, UpdateSupplierDtoType, SupplierQueryDtoType } from './suppliers.dto';

export class SuppliersService {
  async findAll(query: SupplierQueryDtoType) {
    const { page, limit, skip, sortOrder, sortBy } = parsePagination(query);

    const where = {
      deletedAt: null,
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' as const } },
          { email: { contains: query.search, mode: 'insensitive' as const } },
          { code: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }),
      ...(query.isActive !== undefined && { isActive: query.isActive }),
    };

    const [total, data] = await Promise.all([
      prisma.supplier.count({ where }),
      prisma.supplier.findMany({
        where,
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
    const supplier = await prisma.supplier.findFirst({
      where: { id, deletedAt: null },
    });
    if (!supplier) throw new NotFoundError('Supplier not found');
    return supplier;
  }

  async create(dto: CreateSupplierDtoType) {
    const code = generateSupplierCode();

    return prisma.supplier.create({
      data: { ...dto, code },
    });
  }

  async update(id: string, dto: UpdateSupplierDtoType) {
    const supplier = await prisma.supplier.findFirst({ where: { id, deletedAt: null } });
    if (!supplier) throw new NotFoundError('Supplier not found');

    return prisma.supplier.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string) {
    const supplier = await prisma.supplier.findFirst({ where: { id, deletedAt: null } });
    if (!supplier) throw new NotFoundError('Supplier not found');

    await prisma.supplier.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}

export const suppliersService = new SuppliersService();
