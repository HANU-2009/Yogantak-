import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { InsufficientStockError, NotFoundError, BadRequestError } from '../../shared/errors/AppError';
import { parsePagination, buildPaginationMeta } from '../../shared/utils/pagination';
import type { 
  StockOperationDtoType, 
  BulkStockUpdateDtoType, 
  InventoryQueryDtoType,
  ReserveStockDtoType
} from './inventory.dto';

export class InventoryService {
  async findAll(query: InventoryQueryDtoType) {
    const { page, limit, skip, sortOrder, sortBy } = parsePagination(query);

    const where: Prisma.InventoryWhereInput = {
      ...(query.productId && { productId: query.productId }),
      ...(query.variantId && { variantId: query.variantId }),
      ...(query.warehouseId && { warehouseId: query.warehouseId }),
      ...(query.lowStock && {
        availableStock: { lte: prisma.inventory.fields.minStockLevel }
      })
    };

    const [total, data] = await Promise.all([
      prisma.inventory.count({ where }),
      prisma.inventory.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, sku: true } },
          warehouse: { select: { id: true, name: true, code: true } },
        },
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

  async getProductStock(productId: string) {
    const stocks = await prisma.inventory.findMany({
      where: { productId },
      include: {
        warehouse: { select: { id: true, name: true } },
      }
    });

    const totalAvailable = stocks.reduce((sum, item) => sum + item.availableStock, 0);
    const totalReserved = stocks.reduce((sum, item) => sum + item.reservedStock, 0);

    return { stocks, totalAvailable, totalReserved };
  }

  async executeStockOperation(dto: StockOperationDtoType, userId?: string, ipAddress?: string) {
    return prisma.$transaction(async (tx) => {
      // 1. Upsert Inventory Record
      let inventory = await tx.inventory.findUnique({
        where: {
          productId_variantId_warehouseId: {
            productId: dto.productId,
            variantId: dto.variantId || '',
            warehouseId: dto.warehouseId,
          }
        }
      });

      if (!inventory) {
        inventory = await tx.inventory.create({
          data: {
            productId: dto.productId,
            variantId: dto.variantId,
            warehouseId: dto.warehouseId,
            currentStock: 0,
            availableStock: 0,
          }
        });
      }

      const beforeQuantity = inventory.currentStock;
      let afterQuantity = beforeQuantity;
      
      const updateData: any = {};

      switch (dto.operationType) {
        case 'STOCK_IN':
        case 'PURCHASE_IN':
        case 'RETURN_IN':
          afterQuantity += dto.quantity;
          updateData.currentStock = { increment: dto.quantity };
          updateData.availableStock = { increment: dto.quantity };
          if (dto.operationType === 'RETURN_IN') updateData.returnedStock = { increment: dto.quantity };
          break;

        case 'STOCK_OUT':
        case 'SALES_OUT':
        case 'RETURN_OUT':
          if (inventory.availableStock < dto.quantity) {
            throw new InsufficientStockError(`Only ${inventory.availableStock} available in warehouse`);
          }
          afterQuantity -= dto.quantity;
          updateData.currentStock = { decrement: dto.quantity };
          updateData.availableStock = { decrement: dto.quantity };
          if (dto.operationType === 'SALES_OUT') updateData.outgoingStock = { increment: dto.quantity };
          break;

        case 'ADJUSTMENT':
        case 'CORRECTION':
          // Quantity can be negative for adjustments
          if (inventory.availableStock + dto.quantity < 0) {
             throw new InsufficientStockError('Adjustment results in negative stock');
          }
          afterQuantity += dto.quantity;
          updateData.currentStock = { increment: dto.quantity };
          updateData.availableStock = { increment: dto.quantity };
          break;

        case 'DAMAGE':
          if (inventory.availableStock < dto.quantity) throw new InsufficientStockError('Not enough available stock');
          afterQuantity -= dto.quantity;
          updateData.currentStock = { decrement: dto.quantity };
          updateData.availableStock = { decrement: dto.quantity };
          updateData.damagedStock = { increment: dto.quantity };
          break;
          
        case 'EXPIRY':
          if (inventory.availableStock < dto.quantity) throw new InsufficientStockError('Not enough available stock');
          afterQuantity -= dto.quantity;
          updateData.currentStock = { decrement: dto.quantity };
          updateData.availableStock = { decrement: dto.quantity };
          updateData.expiredStock = { increment: dto.quantity };
          break;

        case 'LOST':
          if (inventory.availableStock < dto.quantity) throw new InsufficientStockError('Not enough available stock');
          afterQuantity -= dto.quantity;
          updateData.currentStock = { decrement: dto.quantity };
          updateData.availableStock = { decrement: dto.quantity };
          updateData.lostStock = { increment: dto.quantity };
          break;
      }

      // 2. Update Inventory
      await tx.inventory.update({
        where: { id: inventory.id },
        data: updateData
      });

      // 3. Create Log
      const totalCost = dto.unitCost ? dto.unitCost * Math.abs(dto.quantity) : undefined;
      
      const log = await tx.inventoryLog.create({
        data: {
          productId: dto.productId,
          variantId: dto.variantId,
          warehouseId: dto.warehouseId,
          operationType: dto.operationType,
          beforeQuantity,
          afterQuantity,
          quantity: dto.quantity,
          reason: dto.reason,
          referenceType: dto.referenceType,
          referenceId: dto.referenceId,
          batchNumber: dto.batchNumber,
          serialNumber: dto.serialNumber,
          unitCost: dto.unitCost,
          totalCost,
          userId,
          ipAddress,
          notes: dto.notes
        }
      });

      return log;
    });
  }

  async bulkUpdate(dto: BulkStockUpdateDtoType, userId?: string, ipAddress?: string) {
    const results = [];
    for (const op of dto.operations) {
      try {
        const result = await this.executeStockOperation(op, userId, ipAddress);
        results.push({ success: true, operation: op, result });
      } catch (error: any) {
        results.push({ success: false, operation: op, error: error.message });
      }
    }
    return results;
  }

  async reserveStock(dto: ReserveStockDtoType) {
    return prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.findUnique({
        where: {
          productId_variantId_warehouseId: {
            productId: dto.productId,
            variantId: dto.variantId || '',
            warehouseId: dto.warehouseId,
          }
        }
      });

      if (!inventory) throw new NotFoundError('Inventory record not found');
      if (inventory.availableStock < dto.quantity) {
        throw new InsufficientStockError(`Cannot reserve ${dto.quantity}. Only ${inventory.availableStock} available.`);
      }

      return tx.inventory.update({
        where: { id: inventory.id },
        data: {
          availableStock: { decrement: dto.quantity },
          reservedStock: { increment: dto.quantity }
        }
      });
    });
  }

  async releaseStock(dto: ReserveStockDtoType) {
    return prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.findUnique({
        where: {
          productId_variantId_warehouseId: {
            productId: dto.productId,
            variantId: dto.variantId || '',
            warehouseId: dto.warehouseId,
          }
        }
      });

      if (!inventory) throw new NotFoundError('Inventory record not found');
      if (inventory.reservedStock < dto.quantity) {
        throw new BadRequestError('Cannot release more than reserved stock');
      }

      return tx.inventory.update({
        where: { id: inventory.id },
        data: {
          availableStock: { increment: dto.quantity },
          reservedStock: { decrement: dto.quantity }
        }
      });
    });
  }
}

export const inventoryService = new InventoryService();
