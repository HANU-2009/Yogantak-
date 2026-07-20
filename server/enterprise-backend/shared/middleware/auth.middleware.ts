import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/environment';
import { prisma } from '../../config/database';
import { cacheGet, cacheSet, CacheKeys } from '../../config/redis';
import { UnauthorizedError } from '../errors/AppError';
import { JwtPayload, RequestUser } from '../types';

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req);

    if (!token) {
      throw new UnauthorizedError('Authentication token required');
    }

    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    // Check cache first
    let user = await cacheGet<RequestUser>(CacheKeys.USER(payload.userId));

    if (!user) {
      const dbUser = await prisma.user.findUnique({
        where: { id: payload.userId, deletedAt: null },
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: { permission: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!dbUser || dbUser.status === 'SUSPENDED' || dbUser.status === 'BANNED') {
        throw new UnauthorizedError('Account is not active');
      }

      const roles = dbUser.userRoles.map((ur) => ur.role.name);
      const permissions = dbUser.userRoles.flatMap((ur) =>
        ur.role.rolePermissions.map((rp) => `${rp.permission.module}:${rp.permission.action}`)
      );

      user = {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        roles,
        permissions: [...new Set(permissions)],
      };

      await cacheSet(CacheKeys.USER(payload.userId), user, env.CACHE_TTL_SHORT);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError(error.message));
    } else {
      next(error);
    }
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    next();
    return;
  }
  authenticate(req, res, next);
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  if (req.cookies?.access_token) {
    return req.cookies.access_token as string;
  }
  return null;
}
