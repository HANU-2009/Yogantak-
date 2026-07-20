import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database';
import { NotFoundError, ConflictError } from '../../shared/errors/AppError';
import { parsePagination, buildPaginationMeta } from '../../shared/utils/pagination';
import { env } from '../../config/environment';
import type { CreateUserDtoType, UpdateUserDtoType, UserQueryDtoType } from './users.dto';

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  status: true,
  createdAt: true,
  userRoles: { select: { role: { select: { id: true, name: true, displayName: true } } } },
};

export class UsersService {
  async findAll(query: UserQueryDtoType) {
    const { page, limit, skip, sortOrder, sortBy } = parsePagination(query);

    const where = {
      deletedAt: null,
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' as const } },
          { email: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }),
      ...(query.status && { status: query.status }),
      ...(query.roleId && { userRoles: { some: { roleId: query.roleId } } }),
    };

    const [total, data] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: USER_SELECT,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
    ]);

    const formattedData = data.map(user => ({
      ...user,
      roles: user.userRoles.map(ur => ur.role),
      userRoles: undefined,
    }));

    return {
      data: formattedData,
      pagination: buildPaginationMeta(total, page, limit),
    };
  }

  async findById(id: string) {
    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: USER_SELECT,
    });
    if (!user) throw new NotFoundError('User not found');
    
    return {
      ...user,
      roles: user.userRoles.map(ur => ur.role),
      userRoles: undefined,
    };
  }

  async create(dto: CreateUserDtoType) {
    const existing = await prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictError('Email already in use');

    const password = dto.password || Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        password: hashedPassword,
        status: dto.status,
        userRoles: {
          create: dto.roleIds.map(roleId => ({ roleId })),
        },
      },
      select: USER_SELECT,
    });

    return {
      ...user,
      roles: user.userRoles.map(ur => ur.role),
      userRoles: undefined,
    };
  }

  async update(id: string, dto: UpdateUserDtoType) {
    const user = await prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) throw new NotFoundError('User not found');

    if (dto.email && dto.email !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email: dto.email } });
      if (existing) throw new ConflictError('Email already in use');
    }

    const { roleIds, ...updateData } = dto;

    const updated = await prisma.$transaction(async (tx) => {
      if (roleIds) {
        await tx.userRole.deleteMany({ where: { userId: id } });
        if (roleIds.length > 0) {
          await tx.userRole.createMany({
            data: roleIds.map(roleId => ({ userId: id, roleId })),
          });
        }
      }

      return tx.user.update({
        where: { id },
        data: updateData,
        select: USER_SELECT,
      });
    });

    return {
      ...updated,
      roles: updated.userRoles.map(ur => ur.role),
      userRoles: undefined,
    };
  }

  async softDelete(id: string) {
    const user = await prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) throw new NotFoundError('User not found');

    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'INACTIVE', refreshTokenHash: null },
    });
  }
}

export const usersService = new UsersService();
