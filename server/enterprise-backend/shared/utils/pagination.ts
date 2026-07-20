import { PaginationMeta } from '../types';
import { env } from '../../config/environment';

export interface PaginationOptions {
  page?: number | string;
  limit?: number | string;
  sortBy?: string;
  sortOrder?: string;
}

export interface ParsedPagination {
  page: number;
  limit: number;
  skip: number;
  take: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export function parsePagination(
  options: PaginationOptions,
  defaultSortBy = 'createdAt'
): ParsedPagination {
  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.min(
    env.MAX_PAGE_SIZE,
    Math.max(1, Number(options.limit) || env.DEFAULT_PAGE_SIZE)
  );
  const skip = (page - 1) * limit;
  const sortOrder = options.sortOrder === 'asc' ? 'asc' : 'desc';
  const sortBy = options.sortBy || defaultSortBy;

  return { page, limit, skip, take: limit, sortBy, sortOrder };
}

export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export function buildOrderBy(
  sortBy: string,
  sortOrder: 'asc' | 'desc',
  allowedFields: string[]
): Record<string, 'asc' | 'desc'> {
  const field = allowedFields.includes(sortBy) ? sortBy : 'createdAt';
  return { [field]: sortOrder };
}
