import { prisma } from '../../config/database';
import { generatePONumber } from '../../shared/utils/sku-generator';
import { NotFoundError, BadRequestError } from '../../shared/errors/AppError';
import { parsePagination, buildPaginationMeta } from '../../shared/utils/pagination';
import { inventoryService } from '../inventory/inventory.service';
import type { 
  CreatePurchaseOrderDtoType, 
  UpdatePurchaseOrderDtoType, 
  ReceivePurchaseOrderDtoType,
  PurchaseOrderQueryDtoType 
} from './purchases.dto';

export class PurchasesService {
  async findAll(query: PurchaseOrderQueryDtoType) {
    const { page, limit, skip, sortOrder, sortBy } = parsePagination(query as any);

    const where = {
      deletedAt: null,
      ...(query.poNumber && { poNumber: { contains: query.poNumber, mode: 'insensitive' as const } }),
      ...(query.supplierId && { supplierId: query.supplierId }),
      ...(query.warehouseId && { warehouseId: query.warehouseId }),
      ...(query.status && { status: query.status }),
      ...(query.paymentStatus && { paymentStatus: query.paymentStatus }),
    };

    const [total, data] = await Promise.all([
      prisma.purchaseOrder.count({ where }),
      prisma.purchaseOrder.findMany({
        where,
        include: {
          supplier: { select: { id: true, name: true, code: true } },
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
    const po = await prisma.purchaseOrder.findFirst({
      where: { id, deletedAt: null },
      include: {
        supplier: true,
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          }
        },
      }
    });
    if (!po) throw new NotFoundError('Purchase Order not found');
    return po;
  }

  async create(dto: CreatePurchaseOrderDtoType, userId?: string) {
    const poNumber = generatePONumber();

    // Calculate totals
    let subTotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    const items = dto.items.map(item => {
      const lineTotal = item.quantity * item.unitPrice;
      const taxAmount = (lineTotal * item.taxPercent) / 100;
      
      subTotal += lineTotal;
      totalTax += taxAmount;
      totalDiscount += item.discountAmount;

      return {
        productId: item.productId,
        variantId: item.variantId || null,
        warehouseId: dto.warehouseId,
        orderedQuantity: item.quantity,
        receivedQuantity: 0,
        pendingQuantity: item.quantity,
        unitCost: item.unitPrice,
        totalCost: lineTotal + taxAmount - item.discountAmount,
        taxPercent: item.taxPercent,
        taxAmount,
        discountAmount: item.discountAmount,
        notes: item.notes,
      };
    });

    const grandTotal = subTotal + totalTax - totalDiscount + dto.shippingCost;

    return prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierId: dto.supplierId,
        warehouseId: dto.warehouseId,
        orderDate: dto.orderDate ? new Date(dto.orderDate) : new Date(),
        expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : null,
        subtotal: subTotal,
        taxAmount: totalTax,
        discountAmount: totalDiscount,
        shippingAmount: dto.shippingCost,
        totalAmount: grandTotal,
        dueAmount: grandTotal,
        notes: dto.notes,
        createdById: userId,
        items: {
          create: items,
        }
      },
      include: { items: true }
    });
  }

  async update(id: string, dto: UpdatePurchaseOrderDtoType, _userId?: string) {
    const po = await prisma.purchaseOrder.findFirst({ where: { id, deletedAt: null } });
    if (!po) throw new NotFoundError('Purchase Order not found');

    if (po.status === 'RECEIVED' || po.status === 'CANCELLED') {
      throw new BadRequestError(`Cannot update a ${po.status} purchase order`);
    }

    return prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: dto.status,
        paymentStatus: dto.paymentStatus,
        expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : undefined,
        shippingAmount: dto.shippingCost,
        notes: dto.notes,
      },
    });
  }

  async receiveItems(id: string, dto: ReceivePurchaseOrderDtoType, userId?: string, ipAddress?: string) {
    return prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findFirst({
        where: { id, deletedAt: null },
        include: { items: true }
      });

      if (!po) throw new NotFoundError('Purchase Order not found');
      if (po.status === 'RECEIVED' || po.status === 'CANCELLED') {
        throw new BadRequestError(`Cannot receive items for a ${po.status} purchase order`);
      }

      if (!po.warehouseId) {
        throw new BadRequestError('Purchase Order must be associated with a warehouse to receive items');
      }

      let allItemsReceived = true;

      for (const receiveItem of dto.items) {
        const poItem = po.items.find(i => i.id === receiveItem.id);
        if (!poItem) throw new NotFoundError(`PO Item ${receiveItem.id} not found`);
        
        const newReceivedQty = poItem.receivedQuantity + receiveItem.receivedQuantity;
        if (newReceivedQty > poItem.orderedQuantity) {
          throw new BadRequestError(`Cannot receive more than ordered for item ${receiveItem.id}`);
        }

        // Update PO Item
        await tx.purchaseOrderItem.update({
          where: { id: receiveItem.id },
          data: { 
            receivedQuantity: newReceivedQty,
            pendingQuantity: poItem.orderedQuantity - newReceivedQty
          }
        });

        // Add to inventory
        if (receiveItem.receivedQuantity > 0) {
          await inventoryService.executeStockOperation({
            productId: poItem.productId,
            variantId: poItem.variantId || undefined,
            warehouseId: po.warehouseId,
            operationType: 'PURCHASE_IN',
            quantity: receiveItem.receivedQuantity,
            reason: 'Purchase Order Receipt',
            referenceType: 'PURCHASE_ORDER',
            referenceId: po.id,
            unitCost: Number(poItem.unitCost),
          }, userId, ipAddress);
        }

        if (newReceivedQty < poItem.orderedQuantity) {
          allItemsReceived = false;
        }
      }

      // Update PO status
      const newStatus = allItemsReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED';
      
      return tx.purchaseOrder.update({
        where: { id },
        data: {
          status: newStatus as any,
        },
        include: { items: true }
      });
    });
  }
}

export const purchasesService = new PurchasesService();
