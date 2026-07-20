// ============================================================
// Shared TypeScript Types & Interfaces
// ============================================================

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: ValidationError[];
  pagination?: PaginationMeta;
  statusCode?: number;
  timestamp?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

export interface RequestUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
      startTime?: number;
    }
  }
}

export interface StockCalculation {
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  incomingStock: number;
  outgoingStock: number;
  damagedStock: number;
  returnedStock: number;
  expiredStock: number;
  lostStock: number;
}

export interface InventoryValue {
  quantity: number;
  costPrice: number;
  totalValue: number;
}

export type SortOrder = 'asc' | 'desc';

export interface DateRange {
  from?: Date;
  to?: Date;
}

export interface ReportFilter {
  dateRange?: DateRange;
  warehouseId?: string;
  categoryId?: string;
  brandId?: string;
  supplierId?: string;
  status?: string;
}

export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'json';
