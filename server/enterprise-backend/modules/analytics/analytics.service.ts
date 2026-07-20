import { prisma } from '../../config/database';
import { NotFoundError } from '../../shared/errors/AppError';
import type { 
  GetRecommendationDtoType, 
  GetForecastDtoType, 
  GetVelocityDtoType, 
  GetAbcXyzDtoType 
} from './analytics.dto';
import { Decimal } from '@prisma/client/runtime/library';

export class AnalyticsService {
  // ============================================================
  // AI PRODUCT RECOMMENDATION
  // ============================================================

  async getRecommendations(dto: GetRecommendationDtoType) {
    const limit = dto.limit || 5;

    // A. Item-to-item Recommendation based on orders containing the same product (Frequently Bought Together)
    if (dto.productId) {
      const orderItems = await prisma.salesOrderItem.findMany({
        where: { productId: dto.productId },
        select: { salesOrderId: true }
      });
      const orderIds = orderItems.map(item => item.salesOrderId);

      if (orderIds.length > 0) {
        const relatedItems = await prisma.salesOrderItem.groupBy({
          by: ['productId'],
          where: {
            salesOrderId: { in: orderIds },
            productId: { not: dto.productId }
          },
          _count: {
            productId: true
          },
          orderBy: {
            _count: {
              productId: 'desc'
            }
          },
          take: limit
        });

        if (relatedItems.length > 0) {
          const productIds = relatedItems.map(item => item.productId);
          const products = await prisma.product.findMany({
            where: { id: { in: productIds } }
          });
          return { type: 'Frequently Bought Together', products };
        }
      }
    }

    // B. User-based Category Recommendation (Category Similarity)
    if (dto.userId) {
      const userOrders = await prisma.salesOrder.findMany({
        where: { customerId: dto.userId },
        include: { items: { include: { product: true } } },
        orderBy: { orderDate: 'desc' },
        take: 5
      });

      const categoryIds = new Set<string>();
      for (const order of userOrders) {
        for (const item of order.items) {
          if (item.product.categoryId) {
            categoryIds.add(item.product.categoryId);
          }
        }
      }

      if (categoryIds.size > 0) {
        const products = await prisma.product.findMany({
          where: {
            categoryId: { in: Array.from(categoryIds) },
            isActive: true,
            status: 'ACTIVE'
          },
          take: limit,
          orderBy: { mrp: 'desc' } // Proxy for popularity / premium
        });
        if (products.length > 0) {
          return { type: 'Recommended based on your Category History', products };
        }
      }
    }

    // C. Fallback: Top Selling Products
    const topSales = await prisma.salesOrderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit
    });

    const topIds = topSales.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: topIds } }
    });

    return { type: 'Best Sellers', products };
  }

  // ============================================================
  // AI INVENTORY FORECASTING / DEMAND / SALES PREDICTION
  // ============================================================

  async predictDemand(dto: GetForecastDtoType) {
    const { productId, daysToForecast = 30 } = dto;

    const product = await prisma.product.findUnique({
      where: { id: productId }
    });
    if (!product) throw new NotFoundError('Product not found');

    const salesHistory = await prisma.salesOrderItem.findMany({
      where: { productId },
      include: { salesOrder: true },
      orderBy: { createdAt: 'asc' }
    });

    // Heuristic Forecast: Simple Moving Average (SMA) + Linear Regression
    // If no sales history, return flat baseline forecast of 1 unit per day
    if (salesHistory.length < 2) {
      const forecast = [];
      const now = new Date();
      for (let i = 1; i <= daysToForecast; i++) {
        const forecastDate = new Date();
        forecastDate.setDate(now.getDate() + i);
        forecast.push({
          date: forecastDate.toISOString().split('T')[0],
          predictedQuantity: 1,
          confidence: 'low (baseline)'
        });
      }
      return { productId, forecast, method: 'Flat Baseline' };
    }

    // Process sales data into daily quantities
    const salesMap = new Map<string, number>();
    for (const item of salesHistory) {
      const dateStr = item.salesOrder.orderDate.toISOString().split('T')[0];
      salesMap.set(dateStr, (salesMap.get(dateStr) || 0) + item.quantity);
    }

    // Apply Linear Regression: y = mx + c
    const xValues: number[] = [];
    const yValues: number[] = [];
    let dayIndex = 0;
    
    // Fill arrays sorted chronologically
    const sortedDates = Array.from(salesMap.keys()).sort();
    for (const dateStr of sortedDates) {
      xValues.push(dayIndex++);
      yValues.push(salesMap.get(dateStr) || 0);
    }

    // Linear Regression coefficients
    const n = xValues.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
      sumX += xValues[i];
      sumY += yValues[i];
      sumXY += xValues[i] * yValues[i];
      sumXX += xValues[i] * xValues[i];
    }

    const denominator = (n * sumXX - sumX * sumX);
    const m = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
    const c = (sumY - m * sumX) / n;

    const forecast = [];
    const now = new Date();
    for (let i = 1; i <= daysToForecast; i++) {
      const forecastDate = new Date();
      forecastDate.setDate(now.getDate() + i);
      
      // Calculate prediction using linear equation
      const predictedVal = m * (dayIndex + i) + c;
      const finalVal = Math.max(0, Math.round(predictedVal * 10) / 10); // Minimum of 0 units

      forecast.push({
        date: forecastDate.toISOString().split('T')[0],
        predictedQuantity: finalVal || 0.5, // baseline fraction
        confidence: m > 0 ? 'high (upward trend)' : 'medium (downward trend)'
      });
    }

    return {
      productId,
      forecast,
      method: 'AI Linear Regression Trend Analysis',
      growthRate: Math.round(m * 1000) / 1000
    };
  }

  // ============================================================
  // SMART REORDER SUGGESTIONS
  // ============================================================

  async getReorderSuggestions() {
    const inventory = await prisma.inventory.findMany({
      where: {
        availableStock: { lte: prisma.inventory.fields.reorderLevel }
      },
      include: {
        product: {
          include: { supplier: true }
        },
        warehouse: true
      }
    });

    return inventory.map(item => {
      const minLvl = item.minStockLevel || 5;
      const reorderLvl = item.reorderLevel || 10;
      const maxLvl = item.maxStockLevel || (minLvl + reorderLvl * 2);
      const suggestedQty = Math.max(0, maxLvl - item.availableStock);

      return {
        productId: item.productId,
        productName: item.product.name,
        sku: item.product.sku,
        warehouseId: item.warehouseId,
        warehouseName: item.warehouse.name,
        availableStock: item.availableStock,
        reorderLevel: item.reorderLevel,
        suggestedQuantity: suggestedQty,
        supplierName: item.product.supplier?.name || 'No assigned supplier',
        supplierId: item.product.supplierId || null,
        reorderStatus: item.availableStock === 0 ? 'CRITICAL_STOCKOUT' : 'REORDER_TRIGGERED'
      };
    });
  }

  // ============================================================
  // DEAD STOCK DETECTION
  // ============================================================

  async getDeadStock() {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // 1. Get all products with current active stock
    const activeStock = await prisma.inventory.findMany({
      where: { availableStock: { gt: 0 } },
      include: { product: true }
    });

    // 2. Find product sales in the last 90 days
    const recentSales = await prisma.salesOrderItem.groupBy({
      by: ['productId'],
      where: {
        createdAt: { gte: ninetyDaysAgo }
      },
      _sum: { quantity: true }
    });
    const recentlySoldProductIds = new Set(recentSales.map(item => item.productId));

    // 3. Filter items with stock but no sales in the last 90 days
    const deadStock = activeStock
      .filter(item => !recentlySoldProductIds.has(item.productId))
      .map(item => {
        const capitalLocked = new Decimal(item.availableStock).mul(item.product.costPrice || item.product.mrp);
        return {
          productId: item.productId,
          productName: item.product.name,
          sku: item.product.sku,
          warehouseId: item.warehouseId,
          availableStock: item.availableStock,
          daysSinceLastSale: '90+',
          capitalLockedAmount: capitalLocked.toNumber(),
          costPrice: item.product.costPrice ? new Decimal(item.product.costPrice).toNumber() : null,
          mrp: new Decimal(item.product.mrp).toNumber()
        };
      });

    // Sort by capital locked up descending
    return deadStock.sort((a, b) => b.capitalLockedAmount - a.capitalLockedAmount);
  }

  // ============================================================
  // FAST MOVING / SLOW MOVING PRODUCTS
  // ============================================================

  async getVelocityClassification(dto: GetVelocityDtoType) {
    const days = dto.days || 30;
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    // Sum sales units per product
    const salesSums = await prisma.salesOrderItem.groupBy({
      by: ['productId'],
      where: {
        createdAt: { gte: sinceDate }
      },
      _sum: { quantity: true }
    });

    const products = await prisma.product.findMany({
      where: { deletedAt: null }
    });

    // Create mapping of productId to quantity sold
    const salesMap = new Map<string, number>();
    for (const item of salesSums) {
      salesMap.set(item.productId, item._sum.quantity || 0);
    }

    const velocityData = products.map(p => {
      const unitsSold = salesMap.get(p.id) || 0;
      return {
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        unitsSold,
        dailyVelocity: Math.round((unitsSold / days) * 100) / 100
      };
    });

    // Sort by units sold descending
    velocityData.sort((a, b) => b.unitsSold - a.unitsSold);

    const totalProducts = velocityData.length;
    const fastLimit = Math.max(1, Math.round(totalProducts * 0.2)); // Top 20%
    const slowLimit = Math.max(1, Math.round(totalProducts * 0.2)); // Bottom 20%

    return velocityData.map((item, idx) => {
      let classification: 'FAST_MOVING' | 'MEDIUM_MOVING' | 'SLOW_MOVING' = 'MEDIUM_MOVING';
      if (idx < fastLimit && item.unitsSold > 0) {
        classification = 'FAST_MOVING';
      } else if (idx >= totalProducts - slowLimit || item.unitsSold === 0) {
        classification = 'SLOW_MOVING';
      }
      return { ...item, classification };
    });
  }

  // ============================================================
  // ABC & XYZ ANALYSIS
  // ============================================================

  async getAbcXyzAnalysis(dto: GetAbcXyzDtoType) {
    const days = dto.days || 90;
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    // 1. ABC Analysis (Revenue Contribution)
    const salesItems = await prisma.salesOrderItem.findMany({
      where: { createdAt: { gte: sinceDate } },
      include: { product: true }
    });

    const revenueMap = new Map<string, Decimal>();
    for (const item of salesItems) {
      const rev = new Decimal(item.totalAmount);
      revenueMap.set(item.productId, (revenueMap.get(item.productId) || new Decimal(0)).add(rev));
    }

    const products = await prisma.product.findMany({
      where: { deletedAt: null }
    });

    let totalRevenue = new Decimal(0);
    const abcList = products.map(p => {
      const revenue = revenueMap.get(p.id) || new Decimal(0);
      totalRevenue = totalRevenue.add(revenue);
      return {
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        revenue: revenue.toNumber()
      };
    });

    // Sort by revenue descending
    abcList.sort((a, b) => b.revenue - a.revenue);

    let cumulativeRevenue = new Decimal(0);
    const abcAnalysis = abcList.map(item => {
      cumulativeRevenue = cumulativeRevenue.add(item.revenue);
      const ratio = totalRevenue.gt(0) ? cumulativeRevenue.div(totalRevenue).toNumber() : 1.0;
      
      let abcCategory: 'A' | 'B' | 'C' = 'C';
      if (ratio <= 0.70 && item.revenue > 0) {
        abcCategory = 'A';
      } else if (ratio <= 0.90 && item.revenue > 0) {
        abcCategory = 'B';
      }

      return {
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        revenue: item.revenue,
        cumulativeRatio: Math.round(ratio * 100) / 100,
        abcCategory
      };
    });

    // 2. XYZ Analysis (Demand Predictability / Weekly Coefficient of Variation)
    // For simplicity, we calculate the variation of sales quantity across weekly buckets.
    const weeksCount = Math.ceil(days / 7);
    const xyzAnalysis = products.map(p => {
      const pSales = salesItems.filter(item => item.productId === p.id);
      
      // Bucket sales by week index
      const weeklyBuckets = new Array(weeksCount).fill(0);
      for (const item of pSales) {
        const diffTime = Math.abs(new Date().getTime() - item.createdAt.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const weekIdx = Math.min(weeksCount - 1, Math.floor(diffDays / 7));
        weeklyBuckets[weekIdx] += item.quantity;
      }

      // Compute CV (Coefficient of Variation) = StdDev / Mean
      const sum = weeklyBuckets.reduce((a, b) => a + b, 0);
      const mean = sum / weeksCount;

      let stdDev = 0;
      if (weeksCount > 1) {
        const sqDiffSum = weeklyBuckets.reduce((accum, val) => accum + Math.pow(val - mean, 2), 0);
        stdDev = Math.sqrt(sqDiffSum / weeksCount);
      }

      const cv = mean > 0 ? stdDev / mean : 99; // 99 indicates highly erratic (zero/irregular sales)

      let xyzCategory: 'X' | 'Y' | 'Z' = 'Z';
      if (cv < 0.2 && mean > 0) {
        xyzCategory = 'X';
      } else if (cv <= 0.5 && mean > 0) {
        xyzCategory = 'Y';
      }

      return {
        productId: p.id,
        meanWeeklySales: Math.round(mean * 100) / 100,
        coefficientOfVariation: Math.round(cv * 100) / 100,
        xyzCategory
      };
    });

    // Merge ABC and XYZ analyses
    const mergedList = abcAnalysis.map(abcItem => {
      const xyzItem = xyzAnalysis.find(x => x.productId === abcItem.productId);
      return {
        ...abcItem,
        meanWeeklySales: xyzItem?.meanWeeklySales || 0,
        coefficientOfVariation: xyzItem?.coefficientOfVariation || 99,
        xyzCategory: xyzItem?.xyzCategory || 'Z',
        matrixCode: `${abcItem.abcCategory}${xyzItem?.xyzCategory || 'Z'}`
      };
    });

    return {
      daysAnalyzed: days,
      totalRevenue: totalRevenue.toNumber(),
      matrix: mergedList
    };
  }

  // ============================================================
  // TURNOVER & SELL THROUGH RATE
  // ============================================================

  async getTurnoverAndStr() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeInventory = await prisma.inventory.findMany({
      include: { product: true }
    });

    const recentSales = await prisma.salesOrderItem.groupBy({
      by: ['productId'],
      where: { createdAt: { gte: thirtyDaysAgo } },
      _sum: { quantity: true, totalAmount: true }
    });

    const salesQtyMap = new Map<string, number>();
    for (const item of recentSales) {
      salesQtyMap.set(item.productId, item._sum.quantity || 0);
    }

    const report = activeInventory.map(item => {
      const unitsSold = salesQtyMap.get(item.productId) || 0;
      const endingStock = item.availableStock;
      const beginningStock = endingStock + unitsSold;

      // Sell Through Rate = (Sold / Beginning Stock) * 100
      const str = beginningStock > 0 ? (unitsSold / beginningStock) * 100 : 0;

      // Cost of Goods Sold = unitsSold * costPrice
      const costPrice = item.product.costPrice ? new Decimal(item.product.costPrice) : new Decimal(item.product.mrp).mul(0.6);
      const cogs = costPrice.mul(unitsSold);
      const currentVal = costPrice.mul(endingStock);
      const beginningVal = costPrice.mul(beginningStock);
      const avgInventoryVal = beginningVal.add(currentVal).div(2);

      // Turnover Rate = COGS / Average Inventory Value
      const turnoverRate = avgInventoryVal.gt(0) ? cogs.div(avgInventoryVal).toNumber() : 0;

      return {
        productId: item.productId,
        productName: item.product.name,
        sku: item.product.sku,
        warehouseId: item.warehouseId,
        availableStock: endingStock,
        unitsSold30Days: unitsSold,
        sellThroughRate: Math.round(str * 100) / 100,
        cogs: cogs.toNumber(),
        averageInventoryValue: avgInventoryVal.toNumber(),
        inventoryTurnoverRate: Math.round(turnoverRate * 100) / 100
      };
    });

    return report;
  }

  // ============================================================
  // BI DASHBOARD METRICS
  // ============================================================

  async getAnalyticsDashboard() {
    const [productsCount, warehousesCount, inventoryRows] = await Promise.all([
      prisma.product.count({ where: { deletedAt: null } }),
      prisma.warehouse.count({ where: { isActive: true } }),
      prisma.inventory.findMany({ include: { product: true } })
    ]);

    let totalStockItems = 0;
    let stockoutItemsCount = 0;
    let totalStockVal = new Decimal(0);
    let lowStockCount = 0;

    for (const item of inventoryRows) {
      totalStockItems += item.availableStock;
      if (item.availableStock === 0) stockoutItemsCount++;
      if (item.availableStock <= item.reorderLevel) lowStockCount++;

      const cost = item.product.costPrice ? new Decimal(item.product.costPrice) : new Decimal(item.product.mrp).mul(0.6);
      totalStockVal = totalStockVal.add(cost.mul(item.availableStock));
    }

    const stockoutRate = inventoryRows.length > 0 ? (stockoutItemsCount / inventoryRows.length) * 100 : 0;

    // Fetch matrix details
    const matrix = await this.getAbcXyzAnalysis({ days: 90 });
    const abcA = matrix.matrix.filter(item => item.abcCategory === 'A').length;
    const abcB = matrix.matrix.filter(item => item.abcCategory === 'B').length;
    const abcC = matrix.matrix.filter(item => item.abcCategory === 'C').length;

    // Fetch suggestions
    const reorders = await this.getReorderSuggestions();

    return {
      overview: {
        totalProducts: productsCount,
        activeWarehouses: warehousesCount,
        totalInventoryUnits: totalStockItems,
        totalInventoryValue: totalStockVal.toNumber(),
        stockoutRate: Math.round(stockoutRate * 100) / 100,
        lowStockItemsCount: lowStockCount
      },
      classifications: {
        abcAnalysis: { ClassA: abcA, ClassB: abcB, ClassC: abcC },
        xyzAnalysis: {
          ClassX: matrix.matrix.filter(item => item.xyzCategory === 'X').length,
          ClassY: matrix.matrix.filter(item => item.xyzCategory === 'Y').length,
          ClassZ: matrix.matrix.filter(item => item.xyzCategory === 'Z').length,
        }
      },
      reorderAlertsCount: reorders.length
    };
  }
}

export const analyticsService = new AnalyticsService();
