import request from 'supertest';
import { app } from '../../app';
import { prisma } from '../../config/database';
import jwt from 'jsonwebtoken';
import { env } from '../../config/environment';

jest.mock('../../config/database', () => ({
  prisma: {
    inventory: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

describe('Inventory API Integration Tests', () => {
  let token: string;

  beforeAll(() => {
    token = jwt.sign({ userId: 'user1', email: 'admin@test.com', roles: ['admin'] }, env.JWT_SECRET);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/inventory', () => {
    it('should return inventory list', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user1', email: 'admin@test.com', status: 'ACTIVE', userRoles: [{ role: { name: 'admin', rolePermissions: [] } }] });
      (prisma.inventory.count as jest.Mock).mockResolvedValue(1);
      (prisma.inventory.findMany as jest.Mock).mockResolvedValue([{
        id: 'inv-id',
        productId: 'prod-id',
        availableStock: 10
      }]);

      const response = await request(app)
        .get('/api/v1/inventory')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
    });
  });
});
