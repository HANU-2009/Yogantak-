import { financeService } from '../finance.service';
import { prisma } from '../../../config/database';

// Mock the prisma client database connection
jest.mock('../../../config/database', () => {
  return {
    prisma: {
      wallet: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      walletTransaction: {
        create: jest.fn(),
      },
      refund: {
        create: jest.fn(),
      },
      taxRecord: {
        create: jest.fn(),
      },
      account: {
        count: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      transactionJournal: {
        create: jest.fn(),
      },
      journalEntry: {
        create: jest.fn(),
      },
      salesOrder: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      salesReturn: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      paymentReconciliation: {
        create: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    },
  };
});

describe('FinanceService Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Wallet System', () => {
    it('should calculate and return correct GST splits for intrastate', () => {
      const result = financeService.calculateGst(1000, 18, 'Maharashtra', 'Maharashtra');
      expect(result.totalTaxAmount).toBe(180);
      expect(result.cgstAmount).toBe(90);
      expect(result.sgstAmount).toBe(90);
      expect(result.igstAmount).toBe(0);
    });

    it('should calculate and return correct GST splits for interstate', () => {
      const result = financeService.calculateGst(1000, 18, 'Maharashtra', 'Delhi');
      expect(result.totalTaxAmount).toBe(180);
      expect(result.cgstAmount).toBe(0);
      expect(result.sgstAmount).toBe(0);
      expect(result.igstAmount).toBe(180);
    });
  });

  describe('Reconciliation System', () => {
    it('should reconciliation fail discrepancy if order amount does not match', async () => {
      const mockSalesOrder = {
        id: 'sales-order-uuid',
        totalAmount: 1200,
      };
      (prisma.salesOrder.findUnique as jest.Mock).mockResolvedValue(mockSalesOrder);
      (prisma.paymentReconciliation.create as jest.Mock).mockImplementation((args) => args.data);

      const result = await financeService.reconcilePayment({
        paymentRef: 'UPI-REF-123',
        amount: 1000,
        paymentDate: '2026-07-13T10:00:00Z',
        matchedOrderId: 'sales-order-uuid',
        matchedType: 'SALES',
      });

      expect(result.status).toBe('DISCREPANCY');
      expect(result.discrepancyAmt).toBe(200);
    });

    it('should reconcile fully if amounts match', async () => {
      const mockSalesOrder = {
        id: 'sales-order-uuid',
        totalAmount: 1000,
      };
      (prisma.salesOrder.findUnique as jest.Mock).mockResolvedValue(mockSalesOrder);
      (prisma.paymentReconciliation.create as jest.Mock).mockImplementation((args) => args.data);

      const result = await financeService.reconcilePayment({
        paymentRef: 'UPI-REF-123',
        amount: 1000,
        paymentDate: '2026-07-13T10:00:00Z',
        matchedOrderId: 'sales-order-uuid',
        matchedType: 'SALES',
      });

      expect(result.status).toBe('RECONCILED');
      expect(result.discrepancyAmt).toBeNull();
    });
  });
});
