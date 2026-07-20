import { analyticsService } from '../analytics.service';
import { prisma } from '../../../config/database';

// Mock the prisma client database connection
jest.mock('../../../config/database', () => {
  return {
    prisma: {
      product: {
        count: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      salesOrder: {
        findMany: jest.fn(),
      },
      salesOrderItem: {
        findMany: jest.fn(),
        groupBy: jest.fn(),
      },
      inventory: {
        findMany: jest.fn(),
      },
      warehouse: {
        count: jest.fn(),
      },
    },
  };
});

describe('AnalyticsService Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ABC & XYZ Analysis', () => {
    it('should categorize products correctly into ABC classes based on revenue ratios', async () => {
      // Mock 3 products and sales items generating revenue
      const mockProducts = [
        { id: 'prod-a', name: 'Product A', sku: 'SKU-A' },
        { id: 'prod-b', name: 'Product B', sku: 'SKU-B' },
        { id: 'prod-c', name: 'Product C', sku: 'SKU-C' },
      ];
      (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);

      const mockSalesItems = [
        { productId: 'prod-a', totalAmount: 7000, quantity: 10, createdAt: new Date() },
        { productId: 'prod-b', totalAmount: 2000, quantity: 5, createdAt: new Date() },
        { productId: 'prod-c', totalAmount: 1000, quantity: 2, createdAt: new Date() },
      ];
      (prisma.salesOrderItem.findMany as jest.Mock).mockResolvedValue(mockSalesItems);

      const result = await analyticsService.getAbcXyzAnalysis({ days: 90 });
      expect(result.totalRevenue).toBe(10000);

      const itemA = result.matrix.find(x => x.productId === 'prod-a');
      const itemB = result.matrix.find(x => x.productId === 'prod-b');
      const itemC = result.matrix.find(x => x.productId === 'prod-c');

      expect(itemA?.abcCategory).toBe('A'); // 70% contribution
      expect(itemB?.abcCategory).toBe('B'); // 20% contribution
      expect(itemC?.abcCategory).toBe('C'); // 10% contribution
    });
  });

  describe('AI Forecasting Demand', () => {
    it('should generate baseline forecasts for products with low sales history', async () => {
      const mockProduct = { id: 'prod-uuid', name: 'Product X' };
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (prisma.salesOrderItem.findMany as jest.Mock).mockResolvedValue([]); // No sales history

      const result = await analyticsService.predictDemand({
        productId: 'prod-uuid',
        daysToForecast: 7,
      });

      expect(result.method).toBe('Flat Baseline');
      expect(result.forecast.length).toBe(7);
      expect(result.forecast[0].predictedQuantity).toBe(1);
    });

    it('should run linear regression forecast for products with adequate sales history', async () => {
      const mockProduct = { id: 'prod-uuid', name: 'Product X' };
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);

      // 3 days of sales history showing upward trend (10, 20, 30 units)
      const mockSalesItems = [
        { productId: 'prod-uuid', quantity: 10, salesOrder: { orderDate: new Date('2026-07-10') } },
        { productId: 'prod-uuid', quantity: 20, salesOrder: { orderDate: new Date('2026-07-11') } },
        { productId: 'prod-uuid', quantity: 30, salesOrder: { orderDate: new Date('2026-07-12') } },
      ];
      (prisma.salesOrderItem.findMany as jest.Mock).mockResolvedValue(mockSalesItems);

      const result = await analyticsService.predictDemand({
        productId: 'prod-uuid',
        daysToForecast: 5,
      });

      expect(result.method).toBe('AI Linear Regression Trend Analysis');
      expect(result.forecast.length).toBe(5);
      expect(result.growthRate).toBeGreaterThan(0); // Upward trend
    });
  });
});
