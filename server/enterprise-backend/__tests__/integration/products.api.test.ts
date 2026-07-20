import request from 'supertest';
import { app } from '../../app';
import { prisma } from '../../config/database';
import jwt from 'jsonwebtoken';
import { env } from '../../config/environment';

jest.mock('../../config/database', () => ({
  prisma: {
    product: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

describe('Products API Integration Tests', () => {
  let token: string;

  beforeAll(() => {
    token = jwt.sign({ userId: 'user1', email: 'admin@test.com', roles: ['admin'] }, env.JWT_SECRET);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/products', () => {
    it('should return products list for authorized users', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user1', email: 'admin@test.com', status: 'ACTIVE', userRoles: [{ role: { name: 'admin', rolePermissions: [] } }] });
      (prisma.product.count as jest.Mock).mockResolvedValue(1);
      (prisma.product.findMany as jest.Mock).mockResolvedValue([{
        id: 'prod-id',
        name: 'Test Product',
        sku: 'TEST-SKU-1'
      }]);

      const response = await request(app)
        .get('/api/v1/products')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].name).toBe('Test Product');
    });

    it('should return 401 if unauthorized', async () => {
      const response = await request(app).post('/api/v1/products').send({});
      expect(response.status).toBe(401);
    });
  });
});
