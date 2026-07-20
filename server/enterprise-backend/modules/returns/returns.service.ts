import { prisma } from '../../config/database';
import { generateReturnNumber } from '../../shared/utils/sku-generator';
import { NotFoundError, BadRequestError } from '../../shared/errors/AppError';
import { parsePagination, buildPaginationMeta } from '../../shared/utils/pagination';
import { inventoryService } from '../inventory/inventory.service';
import type { 
  CreateReturnDtoType, 
  UpdateReturnDtoType, 
  ReceiveReturnDtoType,
  ReturnQueryDtoType 
} from './returns.dto';

export class ReturnsService {
  async findAll(query: ReturnQueryDtoType) {
    const { page, limit, skip, sortOrder, sortBy } = parsePagination(query);

    const isCustomer = !query.returnType || query.returnType === 'CUSTOMER_RETURN';

    if (isCustomer) {
      const where = {
        ...(query.returnNumber && { returnNumber: { contains: query.returnNumber, mode: 'insensitive' as const } }),
        ...(query.status && { status: query.status }),
      };

      const [total, data] = await Promise.all([
        prisma.salesReturn.count({ where }),
        prisma.salesReturn.findMany({
          where,
          include: {
            salesOrder: true,
          },
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
        }),
      ]);

      return {
        data: data.map(d => ({ ...d, returnType: 'CUSTOMER_RETURN' as const })),
        pagination: buildPaginationMeta(total, page, limit),
      };
    } else {
      const where = {
        ...(query.returnNumber && { returnNumber: { contains: query.returnNumber, mode: 'insensitive' as const } }),
        ...(query.status && { status: query.status }),
      };

      const [total, data] = await Promise.all([
        prisma.purchaseReturn.count({ where }),
        prisma.purchaseReturn.findMany({
          where,
          include: {
            purchaseOrder: true,
          },
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
        }),
      ]);

      return {
        data: data.map(d => ({ ...d, returnType: 'SUPPLIER_RETURN' as const })),
        pagination: buildPaginationMeta(total, page, limit),
      };
    }
  }

  async findById(id: string) {
    const salesReturn = await prisma.salesReturn.findUnique({
      where: { id },
      include: {
        items: true,
        salesOrder: true,
      }
    });

    if (salesReturn) {
      return { ...salesReturn, returnType: 'CUSTOMER_RETURN' as const };
    }

    const purchaseReturn = await prisma.purchaseReturn.findUnique({
      where: { id },
      include: {
        items: true,
        purchaseOrder: true,
      }
    });

    if (purchaseReturn) {
      return { ...purchaseReturn, returnType: 'SUPPLIER_RETURN' as const };
    }

    throw new NotFoundError('Return not found');
  }

  async create(dto: CreateReturnDtoType, _userId?: string) {
    const returnNumber = generateReturnNumber();

    if (dto.returnType === 'CUSTOMER_RETURN') {
      if (!dto.referenceId) {
        throw new BadRequestError('salesOrderId must be provided as referenceId for customer returns');
      }

      const totalAmount = dto.items.reduce((sum, item) => sum + (item.quantity * 10), 0);

      return prisma.salesReturn.create({
        data: {
          returnNumber,
          salesOrderId: dto.referenceId,
          reason: dto.reason,
          totalAmount,
          notes: dto.notes,
          items: {
            create: dto.items.map(item => ({
              productId: item.productId,
              variantId: item.variantId || null,
              quantity: item.quantity,
              unitPrice: 10,
              totalAmount: item.quantity * 10,
              reason: item.reason,
              condition: item.condition,
            })),
          }
        },
        include: { items: true }
      });
    } else {
      if (!dto.referenceId) {
        throw new BadRequestError('purchaseOrderId must be provided as referenceId for supplier returns');
      }

      const totalAmount = dto.items.reduce((sum, item) => sum + (item.quantity * 10), 0);

      return prisma.purchaseReturn.create({
        data: {
          returnNumber,
          purchaseOrderId: dto.referenceId,
          reason: dto.reason,
          totalAmount,
          notes: dto.notes,
          items: {
            create: dto.items.map(item => ({
              productId: item.productId,
              variantId: item.variantId || null,
              quantity: item.quantity,
              unitCost: 10,
              totalCost: item.quantity * 10,
              reason: item.reason,
            })),
          }
        },
        include: { items: true }
      });
    }
  }

  async update(id: string, dto: UpdateReturnDtoType, _userId?: string) {
    const salesReturn = await prisma.salesReturn.findUnique({ where: { id } });
    if (salesReturn) {
      if (salesReturn.status === 'PROCESSED' || salesReturn.status === 'REFUNDED') {
        throw new BadRequestError(`Cannot update a ${salesReturn.status} return`);
      }
      return prisma.salesReturn.update({
        where: { id },
        data: {
          status: dto.status as any,
          notes: dto.notes,
        },
      });
    }

    const purchaseReturn = await prisma.purchaseReturn.findUnique({ where: { id } });
    if (purchaseReturn) {
      if (purchaseReturn.status === 'PROCESSED') {
        throw new BadRequestError(`Cannot update a ${purchaseReturn.status} return`);
      }
      return prisma.purchaseReturn.update({
        where: { id },
        data: {
          status: dto.status as any,
          notes: dto.notes,
        },
      });
    }

    throw new NotFoundError('Return not found');
  }

  async receive(id: string, dto: ReceiveReturnDtoType, userId?: string, ipAddress?: string) {
    return prisma.$transaction(async (tx) => {
      const salesReturn = await tx.salesReturn.findUnique({
        where: { id },
        include: { items: true }
      });

      if (salesReturn) {
        if (salesReturn.status === 'PROCESSED' || salesReturn.status === 'REFUNDED') {
          throw new BadRequestError(`Cannot receive items for a ${salesReturn.status} return`);
        }

        const salesOrder = await tx.salesOrder.findUnique({
          where: { id: salesReturn.salesOrderId },
        });
        const warehouseId = salesOrder?.warehouseId;
        if (!warehouseId) {
          throw new BadRequestError('Warehouse not specified for this return');
        }

        for (const receiveItem of dto.items) {
          const returnItem = salesReturn.items.find(i => i.id === receiveItem.id);
          if (!returnItem) throw new NotFoundError(`Return Item ${receiveItem.id} not found`);

          if (receiveItem.receivedQuantity > 0) {
            const operationType = 'RETURN_IN';
            const condition = receiveItem.condition || returnItem.condition || 'NEW';
            const isDamaged = condition === 'DAMAGED' || condition === 'DEFECTIVE';

            await inventoryService.executeStockOperation({
              productId: returnItem.productId,
              variantId: returnItem.variantId || undefined,
              warehouseId,
              operationType,
              quantity: receiveItem.receivedQuantity,
              reason: `Customer Return: ${returnItem.reason || salesReturn.reason}`,
              referenceType: 'RETURN',
              referenceId: salesReturn.id,
            }, userId, ipAddress);

            if (isDamaged) {
              await inventoryService.executeStockOperation({
                productId: returnItem.productId,
                variantId: returnItem.variantId || undefined,
                warehouseId,
                operationType: 'DAMAGE',
                quantity: receiveItem.receivedQuantity,
                reason: 'Marked as damaged upon return receipt',
                referenceType: 'RETURN',
                referenceId: salesReturn.id,
              }, userId, ipAddress);
            }
          }
        }

        return tx.salesReturn.update({
          where: { id },
          data: {
            status: 'PROCESSED',
            notes: dto.notes ? `${salesReturn.notes ? salesReturn.notes + '\n' : ''}${dto.notes}` : salesReturn.notes,
          },
          include: { items: true }
        });
      }

      const purchaseReturn = await tx.purchaseReturn.findUnique({
        where: { id },
        include: { items: true }
      });

      if (purchaseReturn) {
        if (purchaseReturn.status === 'PROCESSED') {
          throw new BadRequestError(`Cannot receive items for a ${purchaseReturn.status} return`);
        }

        const purchaseOrder = await tx.purchaseOrder.findUnique({
          where: { id: purchaseReturn.purchaseOrderId },
        });
        const warehouseId = purchaseOrder?.warehouseId;
        if (!warehouseId) {
          throw new BadRequestError('Warehouse not specified for this return');
        }

        for (const receiveItem of dto.items) {
          const returnItem = purchaseReturn.items.find(i => i.id === receiveItem.id);
          if (!returnItem) throw new NotFoundError(`Return Item ${receiveItem.id} not found`);

          if (receiveItem.receivedQuantity > 0) {
            await inventoryService.executeStockOperation({
              productId: returnItem.productId,
              variantId: returnItem.variantId || undefined,
              warehouseId,
              operationType: 'RETURN_OUT',
              quantity: receiveItem.receivedQuantity,
              reason: `Supplier Return: ${returnItem.reason || purchaseReturn.reason}`,
              referenceType: 'RETURN',
              referenceId: purchaseReturn.id,
            }, userId, ipAddress);
          }
        }

        return tx.purchaseReturn.update({
          where: { id },
          data: {
            status: 'PROCESSED',
            notes: dto.notes ? `${purchaseReturn.notes ? purchaseReturn.notes + '\n' : ''}${dto.notes}` : purchaseReturn.notes,
          },
          include: { items: true }
        });
      }

      throw new NotFoundError('Return not found');
    });
  }
}

export const returnsService = new ReturnsService();
