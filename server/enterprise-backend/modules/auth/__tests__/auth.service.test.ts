import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authService } from '../auth.service';
import { prisma } from '../../../config/database';
import { UnauthorizedError, ConflictError } from '../../../shared/errors/AppError';

jest.mock('../../../config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    role: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    loginHistory: {
      create: jest.fn(),
    },
  },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

jest.mock('../../../config/redis', () => ({
  cacheDel: jest.fn(),
  CacheKeys: {
    USER: jest.fn((id) => `user:${id}`),
  },
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (prisma.role.findFirst as jest.Mock).mockResolvedValue({ id: 'role-id', name: 'viewer' });
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        name: 'Test User'
      });

      const result = await authService.register({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        phone: '1234567890'
      });

      expect(result).toBeDefined();
      expect(result.email).toBe('test@example.com');
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('should throw ConflictError if email exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-id' });

      await expect(authService.register({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        phone: '1234567890'
      })).rejects.toThrow('Email already registered');
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        password: 'hashedPassword',
        status: 'ACTIVE',
        userRoles: [{ role: { name: 'admin' } }],
        failedLoginCount: 0,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('token');

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('token');
      expect(result.refreshToken).toBe('token');
      expect(prisma.loginHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ success: true }) })
      );
    });

    it('should throw UnauthorizedError on invalid password', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        password: 'hashedPassword',
        failedLoginCount: 0,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login({
        email: 'test@example.com',
        password: 'wrongpassword'
      })).rejects.toThrow('Invalid email or password');

      expect(prisma.user.update).toHaveBeenCalled();
      expect(prisma.loginHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ success: false }) })
      );
    });
  });
});
