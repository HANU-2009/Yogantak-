import { prisma } from '../../config/database';
import { generateTransferNumber } from '../../shared/utils/sku-generator';
import { NotFoundError, BadRequestError, ConflictError } from '../../shared/errors/AppError';
import { parsePagination, buildPaginationMeta } from '../../shared/utils/pagination';
import { inventoryService } from '../inventory/inventory.service';
import type { 
  CreateTransferDtoType, 
  UpdateTransferDtoType, 
  ReceiveTransferDtoType,
  TransferQueryDtoType 
} from './transfers.dto';

export class TransfersService {
  async findAll(query: TransferQueryDtoType) {
    const { page, limit, skip, sortOrder, sortBy } = parsePagination(query);

    const where = {
      ...(query.transferNumber && { transferNumber: { contains: query.transferNumber, mode: 'insensitive' as const } }),
      ...(query.fromWarehouseId && { fromWarehouseId: query.fromWarehouseId }),
      ...(query.toWarehouseId && { toWarehouseId: query.toWarehouseId }),
      ...(query.status && { status: query.status }),
    };

    const [total, data] = await Promise.all([
      prisma.stockTransfer.count({ where }),
      prisma.stockTransfer.findMany({
        where,
        include: {
          fromWarehouse: { select: { id: true, name: true, code: true } },
          toWarehouse: { select: { id: true, name: true, code: true } },
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

  async findById(id: string) {
    const transfer = await prisma.stockTransfer.findFirst({
      where: { id },
      include: {
        fromWarehouse: true,
        toWarehouse: true,
        items: true,
      }
    });
    if (!transfer) throw new NotFoundError('Transfer not found');
    return transfer;
  }

  async create(dto: CreateTransferDtoType, userId?: string, ipAddress?: string) {
    if (dto.fromWarehouseId === dto.toWarehouseId) {
      throw new ConflictError('Source and destination warehouses cannot be the same');
    }

    const transferNumber = generateTransferNumber();

    return prisma.$transaction(async (tx) => {
      // 1. Verify and deduct stock from source warehouse
      for (const item of dto.items) {
        await inventoryService.executeStockOperation({
          productId: item.productId,
          variantId: item.variantId || undefined,
          warehouseId: dto.fromWarehouseId,
          operationType: 'STOCK_OUT',
          quantity: item.quantity,
          reason: 'Stock Transfer',
          referenceType: 'TRANSFER',
          referenceId: transferNumber,
        }, userId, ipAddress);
      }

      // 2. Create the transfer record
      return tx.stockTransfer.create({
        data: {
          transferNumber,
          fromWarehouseId: dto.fromWarehouseId,
          toWarehouseId: dto.toWarehouseId,
          transferDate: dto.transferDate ? new Date(dto.transferDate) : new Date(),
          notes: dto.notes,
          createdById: userId,
          items: {
            create: dto.items.map(item => ({
              productId: item.productId,
              variantId: item.variantId || null,
              requestedQty: item.quantity,
              notes: item.notes,
            })),
          }
        },
        include: { items: true }
      });
    });
  }

  async update(id: string, dto: UpdateTransferDtoType, _userId?: string) {
    const transfer = await prisma.stockTransfer.findFirst({ where: { id } });
    if (!transfer) throw new NotFoundError('Transfer not found');

    if (transfer.status !== 'PENDING' && transfer.status !== 'IN_TRANSIT') {
      throw new BadRequestError(`Cannot update a ${transfer.status} transfer`);
    }

    return prisma.stockTransfer.update({
      where: { id },
      data: {
        notes: dto.notes,
      },
    });
  }

  async dispatch(id: string, _userId?: string) {
    const transfer = await prisma.stockTransfer.findFirst({ where: { id } });
    if (!transfer) throw new NotFoundError('Transfer not found');
    if (transfer.status !== 'PENDING') throw new BadRequestError('Transfer is not pending');

    return prisma.stockTransfer.update({
      where: { id },
      data: { status: 'IN_TRANSIT' }
    });
  }

  async receive(id: string, dto: ReceiveTransferDtoType, userId?: string, ipAddress?: string) {
    return prisma.$transaction(async (tx) => {
      const transfer = await tx.stockTransfer.findFirst({
        where: { id },
        include: { items: true }
      });

      if (!transfer) throw new NotFoundError('Transfer not found');
      if (transfer.status === 'COMPLETED' || transfer.status === 'CANCELLED') {
        throw new BadRequestError(`Cannot receive items for a ${transfer.status} transfer`);
      }

      let allItemsReceived = true;

      for (const receiveItem of dto.items) {
        const transferItem = transfer.items.find(i => i.id === receiveItem.id);
        if (!transferItem) throw new NotFoundError(`Transfer Item ${receiveItem.id} not found`);
        
        const newTransferredQty = transferItem.transferredQty + receiveItem.receivedQuantity;
        if (newTransferredQty > transferItem.requestedQty) {
          throw new BadRequestError(`Cannot receive more than requested for item ${receiveItem.id}`);
        }

        // Update Transfer Item
        await tx.stockTransferItem.update({
          where: { id: receiveItem.id },
          data: { transferredQty: newTransferredQty }
        });

        // Add to destination inventory
        if (receiveItem.receivedQuantity > 0) {
          await inventoryService.executeStockOperation({
            productId: transferItem.productId,
            variantId: transferItem.variantId || undefined,
            warehouseId: transfer.toWarehouseId,
            operationType: 'STOCK_IN',
            quantity: receiveItem.receivedQuantity,
            reason: 'Stock Transfer Receipt',
            referenceType: 'TRANSFER',
            referenceId: transfer.id,
          }, userId, ipAddress);
        }

        if (newTransferredQty < transferItem.requestedQty) {
          allItemsReceived = false;
        }
      }

      const newStatus = allItemsReceived ? 'COMPLETED' : 'IN_TRANSIT';
      
      return tx.stockTransfer.update({
        where: { id },
        data: {
          status: newStatus as any,
        },
        include: { items: true }
      });
    });
  }
}

export const transfersService = new TransfersService();
