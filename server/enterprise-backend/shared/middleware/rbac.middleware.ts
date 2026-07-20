import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../errors/AppError';
export { authenticate } from './auth.middleware';

/**
 * Require specific roles (OR logic — user needs at least one matching role)
 */
export function requireRoles(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ForbiddenError('Authentication required'));
      return;
    }

    const hasRole = roles.some((role) => req.user!.roles.includes(role));
    if (!hasRole) {
      next(new ForbiddenError(`Requires one of: ${roles.join(', ')}`));
      return;
    }
    next();
  };
}

/**
 * Require specific permission (module:action format)
 * e.g. requirePermission('products:create')
 */
export function requirePermission(permission: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ForbiddenError('Authentication required'));
      return;
    }

    // Super admin bypasses all checks
    if (req.user.roles.includes('super_admin') || req.user.roles.includes('admin')) {
      next();
      return;
    }

    if (!req.user.permissions.includes(permission)) {
      next(new ForbiddenError(`Missing permission: ${permission}`));
      return;
    }
    next();
  };
}

/**
 * Require ALL of the specified permissions (AND logic)
 */
export function requireAllPermissions(...permissions: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ForbiddenError('Authentication required'));
      return;
    }

    if (req.user.roles.includes('super_admin') || req.user.roles.includes('admin')) {
      next();
      return;
    }

    const missing = permissions.filter((p) => !req.user!.permissions.includes(p));
    if (missing.length > 0) {
      next(new ForbiddenError(`Missing permissions: ${missing.join(', ')}`));
      return;
    }
    next();
  };
}

/**
 * Check ownership or admin access
 */
export function requireOwnerOrAdmin(getUserId: (req: Request) => string | undefined) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ForbiddenError('Authentication required'));
      return;
    }

    const isAdmin =
      req.user.roles.includes('super_admin') || req.user.roles.includes('admin');

    if (isAdmin) {
      next();
      return;
    }

    const resourceUserId = getUserId(req);
    if (resourceUserId !== req.user.id) {
      next(new ForbiddenError('You do not have permission to access this resource'));
      return;
    }
    next();
  };
}

export const Permissions = {
  // Products
  PRODUCTS_CREATE: 'products:create',
  PRODUCTS_READ: 'products:read',
  PRODUCTS_UPDATE: 'products:update',
  PRODUCTS_DELETE: 'products:delete',
  PRODUCTS_APPROVE: 'products:approve',
  PRODUCTS_EXPORT: 'products:export',
  PRODUCTS_IMPORT: 'products:import',

  // Inventory
  INVENTORY_READ: 'inventory:read',
  INVENTORY_UPDATE: 'inventory:update',
  INVENTORY_ADJUST: 'inventory:adjust',
  INVENTORY_TRANSFER: 'inventory:transfer',
  INVENTORY_EXPORT: 'inventory:export',

  // Purchases
  PURCHASES_CREATE: 'purchases:create',
  PURCHASES_READ: 'purchases:read',
  PURCHASES_UPDATE: 'purchases:update',
  PURCHASES_DELETE: 'purchases:delete',
  PURCHASES_APPROVE: 'purchases:approve',

  // Sales
  SALES_CREATE: 'sales:create',
  SALES_READ: 'sales:read',
  SALES_UPDATE: 'sales:update',
  SALES_DELETE: 'sales:delete',
  SALES_APPROVE: 'sales:approve',

  // Warehouses
  WAREHOUSES_CREATE: 'warehouses:create',
  WAREHOUSES_READ: 'warehouses:read',
  WAREHOUSES_UPDATE: 'warehouses:update',
  WAREHOUSES_DELETE: 'warehouses:delete',

  // Users
  USERS_CREATE: 'users:create',
  USERS_READ: 'users:read',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  USERS_SUSPEND: 'users:suspend',

  // Reports
  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',

  // Settings
  SETTINGS_READ: 'settings:read',
  SETTINGS_UPDATE: 'settings:update',

  // Audit
  AUDIT_READ: 'audit:read',

  // Dashboard
  DASHBOARD_VIEW: 'dashboard:view',

  // Finance
  FINANCE_CREATE: 'finance:create',
  FINANCE_READ: 'finance:read',
  FINANCE_UPDATE: 'finance:update',
  FINANCE_DELETE: 'finance:delete',
  FINANCE_RECONCILE: 'finance:reconcile',

  // Analytics & AI
  ANALYTICS_READ: 'analytics:read',
  ANALYTICS_COMPUTE: 'analytics:compute',

  // Business Platform
  BUSINESS_READ: 'business:read',
  BUSINESS_CREATE: 'business:create',
  BUSINESS_UPDATE: 'business:update',
  BUSINESS_DELETE: 'business:delete',
  BUSINESS_APPROVE: 'business:approve',
  TASKS_ASSIGN: 'tasks:assign',
} as const;
