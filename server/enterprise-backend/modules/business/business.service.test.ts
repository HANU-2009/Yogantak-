import { businessService } from './business.service';
import { prisma } from '../../config/database';

jest.mock('../../config/database', () => ({
  prisma: {
    supplier: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
    userRole: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    supportTicket: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    store: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    warehouseBin: {
      findMany: jest.fn(),
    },
    inventoryLog: {
      findMany: jest.fn(),
    },
    approvalRequest: {
      create: jest.fn(),
      update: jest.fn(),
    },
    staffTask: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    }
  }
}));

describe('BusinessService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getVendorDashboard', () => {
    it('should return vendor counts correctly', async () => {
      const mockSuppliers = [
        { id: '1', status: 'APPROVED' },
        { id: '2', status: 'PENDING' },
        { id: '3', status: 'APPROVED' },
      ];
      (prisma.supplier.findMany as jest.Mock).mockResolvedValue(mockSuppliers);

      const result = await businessService.getVendorDashboard();
      expect(result.totalVendors).toBe(3);
      expect(result.approved).toBe(2);
      expect(result.pending).toBe(1);
    });
  });

  describe('updateVendorStatus', () => {
    it('should update vendor status and create audit log', async () => {
      (prisma.supplier.update as jest.Mock).mockResolvedValue({ id: '1', status: 'APPROVED' });
      
      const result = await businessService.updateVendorStatus('1', { status: 'APPROVED', comments: 'Looks good' }, 'user1');
      expect(prisma.supplier.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { status: 'APPROVED' }
      });
      expect(prisma.auditLog.create).toHaveBeenCalled();
      expect(result.status).toBe('APPROVED');
    });
  });

  describe('getSlottingRecommendation', () => {
    it('should recommend the first available bin', async () => {
      const mockBins = [{ id: 'bin1' }, { id: 'bin2' }];
      (prisma.warehouseBin.findMany as jest.Mock).mockResolvedValue(mockBins);

      const result = await businessService.getSlottingRecommendation('prod1');
      expect(result.recommendedBin).toEqual({ id: 'bin1' });
    });

    it('should return error if no bins available', async () => {
      (prisma.warehouseBin.findMany as jest.Mock).mockResolvedValue([]);

      const result = await businessService.getSlottingRecommendation('prod1');
      expect(result.error).toBe('No active bins found');
    });
  });

  describe('assignRole', () => {
    it('should throw if user already has role', async () => {
      (prisma.userRole.findFirst as jest.Mock).mockResolvedValue({ id: 'ur1' });
      await expect(businessService.assignRole({ userId: 'u1', roleId: 'r1' })).rejects.toThrow('User already has this role');
    });

    it('should create userRole if not exists', async () => {
      (prisma.userRole.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.userRole.create as jest.Mock).mockResolvedValue({ id: 'ur1' });
      const result = await businessService.assignRole({ userId: 'u1', roleId: 'r1' });
      expect(result.id).toBe('ur1');
    });
  });
});
