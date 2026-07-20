import { prisma } from '../../config/database';
import { generateWarehouseCode } from '../../shared/utils/sku-generator';
import { NotFoundError, ConflictError } from '../../shared/errors/AppError';
import type { 
  CreateWarehouseDtoType, 
  UpdateWarehouseDtoType, 
  WarehouseQueryDtoType,
  CreateZoneDtoType,
  CreateRackDtoType,
  CreateShelfDtoType,
  CreateBinDtoType
} from './warehouses.dto';

export class WarehousesService {
  async findAll(query: WarehouseQueryDtoType) {
    const where = {
      deletedAt: null,
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      ...(query.isDefault !== undefined && { isDefault: query.isDefault }),
    };

    return prisma.warehouse.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const warehouse = await prisma.warehouse.findFirst({
      where: { id, deletedAt: null },
      include: {
        zones: {
          include: {
            racks: {
              include: {
                shelves: {
                  include: {
                    bins: true
                  }
                }
              }
            }
          }
        }
      }
    });
    if (!warehouse) throw new NotFoundError('Warehouse not found');
    return warehouse;
  }

  async create(dto: CreateWarehouseDtoType) {
    const code = generateWarehouseCode();

    if (dto.isDefault) {
      await prisma.warehouse.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    return prisma.warehouse.create({
      data: { ...dto, code },
    });
  }

  async update(id: string, dto: UpdateWarehouseDtoType) {
    const warehouse = await prisma.warehouse.findFirst({ where: { id, deletedAt: null } });
    if (!warehouse) throw new NotFoundError('Warehouse not found');

    if (dto.isDefault) {
      await prisma.warehouse.updateMany({
        where: { id: { not: id }, isDefault: true },
        data: { isDefault: false },
      });
    }

    return prisma.warehouse.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string) {
    const warehouse = await prisma.warehouse.findFirst({ where: { id, deletedAt: null } });
    if (!warehouse) throw new NotFoundError('Warehouse not found');

    if (warehouse.isDefault) {
      throw new ConflictError('Cannot delete the default warehouse');
    }

    await prisma.warehouse.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  // --- Zone Management ---
  async addZone(warehouseId: string, dto: CreateZoneDtoType) {
    const warehouse = await prisma.warehouse.findFirst({ where: { id: warehouseId, deletedAt: null } });
    if (!warehouse) throw new NotFoundError('Warehouse not found');

    const code = dto.code || `Z${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    return prisma.warehouseZone.create({
      data: { ...dto, code, warehouseId },
    });
  }

  // --- Rack Management ---
  async addRack(zoneId: string, dto: CreateRackDtoType) {
    const zone = await prisma.warehouseZone.findUnique({ where: { id: zoneId } });
    if (!zone) throw new NotFoundError('Zone not found');

    const code = dto.code || `R${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    return prisma.warehouseRack.create({
      data: { ...dto, code, zoneId },
    });
  }

  // --- Shelf Management ---
  async addShelf(rackId: string, dto: CreateShelfDtoType) {
    const rack = await prisma.warehouseRack.findUnique({ where: { id: rackId } });
    if (!rack) throw new NotFoundError('Rack not found');

    const code = dto.code || `S${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    return prisma.warehouseShelf.create({
      data: { ...dto, code, rackId },
    });
  }

  // --- Bin Management ---
  async addBin(shelfId: string, dto: CreateBinDtoType) {
    const shelf = await prisma.warehouseShelf.findUnique({ where: { id: shelfId } });
    if (!shelf) throw new NotFoundError('Shelf not found');

    const code = dto.code || `B${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    return prisma.warehouseBin.create({
      data: { ...dto, code, shelfId },
    });
  }
}

export const warehousesService = new WarehousesService();
