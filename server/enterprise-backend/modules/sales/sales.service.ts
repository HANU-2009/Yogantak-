import { prisma } from '../../config/database';
import { generateOrderNumber } from '../../shared/utils/sku-generator';
import { NotFoundError, BadRequestError } from '../../shared/errors/AppError';
import { parsePagination, buildPaginationMeta } from '../../shared/utils/pagination';
import type { 
  CreateSalesOrderDtoType, 
  UpdateSalesOrderDtoType, 
  FulfillSalesOrderDtoType,
  SalesOrderQueryDtoType 
} from './sales.dto';

export class SalesService {
  async findAll(query: SalesOrderQueryDtoType) {
    const { page, limit, skip, sortOrder, sortBy } = parsePagination(query);

    const where = {
      deletedAt: null,
      ...(query.orderNumber && { orderNumber: { contains: query.orderNumber, mode: 'insensitive' as const } }),
      ...(query.customerId && { customerId: query.customerId }),
      ...(query.warehouseId && { warehouseId: query.warehouseId }),
      ...(query.status && { status: query.status }),
      ...(query.paymentStatus && { paymentStatus: query.paymentStatus }),
    };

    const [total, data] = await Promise.all([
      prisma.salesOrder.count({ where }),
      prisma.salesOrder.findMany({
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
    const so = await prisma.salesOrder.findFirst({
      where: { id, deletedAt: null },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          }
        },
      }
    });
    if (!so) throw new NotFoundError('Sales Order not found');
    return so;
  }

  async create(dto: CreateSalesOrderDtoType, userId?: string) {
    const orderNumber = generateOrderNumber();

    return prisma.$transaction(async (tx) => {
      // Calculate totals and reserve stock
      let subTotal = 0;
      let totalTax = 0;
      let totalDiscount = 0;

      const itemsData = [];

      for (const item of dto.items) {
        // Reserve stock via inventory service logic. 
        // We call the logic manually here to keep it within the same transaction if possible, 
        // or just rely on the inventoryService if it manages its own tx. 
        // Better: let's do it inside this transaction.
        
        const inventory = await tx.inventory.findUnique({
          where: {
            productId_variantId_warehouseId: {
              productId: item.productId,
              variantId: item.variantId || '',
              warehouseId: dto.warehouseId,
            }
          }
        });

        if (!inventory) throw new NotFoundError(`Inventory record not found for product ${item.productId}`);
        if (inventory.availableStock < item.quantity) {
          throw new BadRequestError(`Insufficient stock for product ${item.productId}. Available: ${inventory.availableStock}`);
        }

        await tx.inventory.update({
          where: { id: inventory.id },
          data: {
            availableStock: { decrement: item.quantity },
            reservedStock: { increment: item.quantity }
          }
        });

        const lineTotal = item.quantity * item.unitPrice;
        const taxAmount = (lineTotal * item.taxPercent) / 100;
        
        subTotal += lineTotal;
        totalTax += taxAmount;
        totalDiscount += item.discountAmount;

        itemsData.push({
          productId: item.productId,
          variantId: item.variantId || null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountAmount: item.discountAmount,
          taxPercent: item.taxPercent,
          taxAmount,
          totalAmount: lineTotal + taxAmount - item.discountAmount,
          notes: item.notes,
        });
      }

      const grandTotal = subTotal + totalTax - totalDiscount + dto.shippingCost;

      return tx.salesOrder.create({
        data: {
          orderNumber,
          customerId: dto.customerId,
          warehouseId: dto.warehouseId,
          orderDate: dto.orderDate ? new Date(dto.orderDate) : new Date(),
          shippingAddress: dto.shippingAddress,
          billingAddress: dto.billingAddress,
          subtotal: subTotal,
          taxAmount: totalTax,
          discountAmount: totalDiscount,
          shippingAmount: dto.shippingCost,
          totalAmount: grandTotal,
          notes: dto.notes,
          createdById: userId,
          items: {
            create: itemsData,
          }
        },
        include: { items: true }
      });
    });
  }

  async update(id: string, dto: UpdateSalesOrderDtoType, _userId?: string) {
    const so = await prisma.salesOrder.findFirst({ where: { id, deletedAt: null } });
    if (!so) throw new NotFoundError('Sales Order not found');

    if (so.status === 'DELIVERED' || so.status === 'CANCELLED') {
      throw new BadRequestError(`Cannot update a ${so.status} sales order`);
    }

    return prisma.salesOrder.update({
      where: { id },
      data: dto as any,
    });
  }

  async fulfill(id: string, dto: FulfillSalesOrderDtoType, userId?: string, ipAddress?: string) {
    return prisma.$transaction(async (tx) => {
      const so = await tx.salesOrder.findFirst({
        where: { id, deletedAt: null },
        include: { items: true }
      });

      if (!so) throw new NotFoundError('Sales Order not found');
      if (so.status !== 'PENDING' && so.status !== 'PROCESSING') {
        throw new BadRequestError(`Cannot fulfill a sales order in ${so.status} status`);
      }

      if (!so.warehouseId) {
        throw new BadRequestError('Sales Order must be associated with a warehouse to fulfill');
      }

      // Convert reserved stock to actual stock out
      for (const item of so.items) {
        const inventory = await tx.inventory.findFirst({
          where: {
            productId: item.productId,
            variantId: item.variantId,
            warehouseId: so.warehouseId,
          }
        });

        if (!inventory) throw new NotFoundError(`Inventory record not found for product ${item.productId}`);

        await tx.inventory.update({
          where: { id: inventory.id },
          data: {
            reservedStock: { decrement: item.quantity },
            currentStock: { decrement: item.quantity },
            outgoingStock: { increment: item.quantity }
          }
        });

        await tx.inventoryLog.create({
          data: {
            productId: item.productId,
            variantId: item.variantId,
            warehouseId: so.warehouseId,
            operationType: 'SALES_OUT',
            beforeQuantity: inventory.currentStock,
            afterQuantity: inventory.currentStock - item.quantity,
            quantity: item.quantity,
            reason: 'Sales Order Fulfillment',
            referenceType: 'SALES_ORDER',
            referenceId: so.id,
            unitCost: item.unitPrice,
            totalCost: Number(item.unitPrice) * item.quantity,
            userId,
            ipAddress,
          }
        });
      }

      return tx.salesOrder.update({
        where: { id },
        data: {
          status: 'DISPATCHED',
          trackingNumber: dto.trackingNumber,
          notes: dto.notes ? `${so.notes ? so.notes + '\n' : ''}${dto.notes}` : so.notes,
        },
        include: { items: true }
      });
    });
  }
}

export const salesService = new SalesService();
