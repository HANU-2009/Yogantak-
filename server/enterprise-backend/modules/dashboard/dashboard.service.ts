import { prisma } from '../../config/database';

export class DashboardService {
  async getOverview() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalProducts,
      totalWarehouses,
      lowStockItems,
      pendingPurchases,
      pendingSales,
      todaySales,
    ] = await Promise.all([
      prisma.product.count({ where: { deletedAt: null } }),
      prisma.warehouse.count({ where: { deletedAt: null } }),
      prisma.inventory.count({
        where: { availableStock: { lte: prisma.inventory.fields.minStockLevel } }
      }),
      prisma.purchaseOrder.count({
        where: { deletedAt: null, status: 'PENDING' }
      }),
      prisma.salesOrder.count({
        where: { deletedAt: null, status: 'PENDING' }
      }),
      prisma.salesOrder.aggregate({
        where: {
          deletedAt: null,
          orderDate: { gte: today },
          status: { notIn: ['CANCELLED'] }
        },
        _sum: { totalAmount: true },
        _count: true,
      })
    ]);

    return {
      totalProducts,
      totalWarehouses,
      lowStockItems,
      pendingPurchases,
      pendingSales,
      todaySalesValue: todaySales._sum?.totalAmount || 0,
      todaySalesCount: todaySales._count,
    };
  }

  async getRecentActivities() {
    return prisma.inventoryLog.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        user: { select: { id: true, name: true } },
      }
    });
  }
}

export const dashboardService = new DashboardService();
