import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { env } from '../../config/environment';
import { logger } from '../../config/logger';
import { cacheDel, CacheKeys } from '../../config/redis';
import {
  UnauthorizedError,
  ConflictError,
  NotFoundError,
  BadRequestError,
} from '../../shared/errors/AppError';
import { JwtPayload } from '../../shared/types';
import type { RegisterDtoType, LoginDtoType, ChangePasswordDtoType } from './auth.dto';

export class AuthService {
  async register(dto: RegisterDtoType, _ipAddress?: string) {
    // Check duplicate email
    const existing = await prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, env.BCRYPT_SALT_ROUNDS);

    // Get default viewer role
    let defaultRole = await prisma.role.findFirst({ where: { name: 'viewer' } });
    if (!defaultRole) {
      defaultRole = await prisma.role.create({
        data: { name: 'viewer', displayName: 'Viewer' },
      });
    }

    const user = await prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        password: hashedPassword,
        status: 'ACTIVE',
        emailVerified: false,
        userRoles: {
          create: { roleId: defaultRole.id },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
      },
    });

    logger.info(`New user registered: ${user.email}`);
    return user;
  }

  async login(dto: LoginDtoType, ipAddress?: string, userAgent?: string) {
    const user = await prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedError(`Account locked until ${user.lockedUntil.toISOString()}`);
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      // Increment failed attempts
      const failedCount = user.failedLoginCount + 1;
      const lockedUntil = failedCount >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null;

      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginCount: failedCount, lockedUntil },
      });

      // Log failed attempt
      await prisma.loginHistory.create({
        data: {
          userId: user.id,
          ipAddress,
          userAgent,
          success: false,
          failReason: 'Invalid password',
        },
      });

      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.status === 'SUSPENDED' || user.status === 'BANNED') {
      throw new UnauthorizedError(`Account is ${user.status.toLowerCase()}`);
    }

    if (user.status === 'INACTIVE') {
      throw new UnauthorizedError('Account is inactive');
    }

    const roles = user.userRoles.map((ur) => ur.role.name);

    // Generate tokens
    const accessToken = this.generateAccessToken(user.id, user.email, roles);
    const refreshToken = this.generateRefreshToken(user.id, user.email, roles);

    // Hash and store refresh token
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshTokenHash,
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
        failedLoginCount: 0,
        lockedUntil: null,
      },
    });

    // Log successful login
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        ipAddress,
        userAgent,
        success: true,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles,
        status: user.status,
      },
    };
  }

  async refreshToken(token: string) {
    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { userRoles: { include: { role: true } } },
    });

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedError('Refresh token revoked');
    }

    const isValid = await bcrypt.compare(token, user.refreshTokenHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const roles = user.userRoles.map((ur) => ur.role.name);
    const accessToken = this.generateAccessToken(user.id, user.email, roles);
    const newRefreshToken = this.generateRefreshToken(user.id, user.email, roles);
    const newHash = await bcrypt.hash(newRefreshToken, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: newHash },
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
    await cacheDel(CacheKeys.USER(userId));
  }

  async changePassword(userId: string, dto: ChangePasswordDtoType): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');

    const isValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isValid) throw new BadRequestError('Current password is incorrect');

    const hashed = await bcrypt.hash(dto.newPassword, env.BCRYPT_SALT_ROUNDS);
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashed,
        passwordChangedAt: new Date(),
        refreshTokenHash: null,
      },
    });

    await cacheDel(CacheKeys.USER(userId));
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        status: true,
        emailVerified: true,
        phoneVerified: true,
        twoFactorEnabled: true,
        lastLoginAt: true,
        lastLoginIp: true,
        createdAt: true,
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });

    if (!user) throw new NotFoundError('User not found');

    return {
      ...user,
      roles: user.userRoles.map((ur) => ur.role.name),
      permissions: user.userRoles.flatMap((ur) =>
        ur.role.rolePermissions.map((rp) => `${rp.permission.module}:${rp.permission.action}`)
      ),
    };
  }

  private generateAccessToken(userId: string, email: string, roles: string[]): string {
    return jwt.sign({ userId, email, roles }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any,
    });
  }

  private generateRefreshToken(userId: string, email: string, roles: string[]): string {
    return jwt.sign({ userId, email, roles }, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
    });
  }
}

export const authService = new AuthService();
