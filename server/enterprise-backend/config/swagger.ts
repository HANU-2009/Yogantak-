import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './environment';

const options: any = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Enterprise Inventory Management API',
      version: '1.0.0',
      description: `
## Enterprise-Grade Inventory & Stock Management REST API

A complete backend system for managing products, inventory, warehouses, purchases, sales, and analytics for an e-commerce platform.

### Features
- 🏭 Multi-Warehouse Management
- 📦 Complete Product & Variant System
- 📊 Real-time Inventory Tracking
- 🛒 Purchase & Sales Order Management
- 🔄 Stock Transfer System
- 📈 Analytics & Reporting (PDF/Excel/CSV)
- 🔔 Automated Alerts
- 🔐 Role-Based Access Control
- 📝 Full Audit Trail
- 🏷️ Barcode & QR Code Generation

### Authentication
Use Bearer JWT token in the Authorization header:
\`Authorization: Bearer <your_access_token>\`

### Base URL
\`${env.APP_URL}${env.API_PREFIX}\`
      `,
      contact: {
        name: 'Enterprise Dev Team',
        email: 'support@inventory.com',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: `${env.APP_URL}${env.API_PREFIX}`,
        description: env.NODE_ENV === 'production' ? 'Production Server' : 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array', items: {} },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                totalPages: { type: 'integer' },
                hasNext: { type: 'boolean' },
                hasPrev: { type: 'boolean' },
              },
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'object' } },
            statusCode: { type: 'integer' },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentication & Token Management' },
      { name: 'Users', description: 'User Management' },
      { name: 'Roles', description: 'Role & Permission Management' },
      { name: 'Products', description: 'Product Management' },
      { name: 'Categories', description: 'Category Management' },
      { name: 'Brands', description: 'Brand Management' },
      { name: 'Suppliers', description: 'Supplier Management' },
      { name: 'Warehouses', description: 'Warehouse Management' },
      { name: 'Inventory', description: 'Inventory & Stock Management' },
      { name: 'Purchases', description: 'Purchase Order Management' },
      { name: 'Sales', description: 'Sales Order Management' },
      { name: 'Transfers', description: 'Stock Transfer Management' },
      { name: 'Returns', description: 'Return Management' },
      { name: 'Barcodes', description: 'Barcode & QR Code Generation' },
      { name: 'Reports', description: 'Reports & Analytics' },
      { name: 'Dashboard', description: 'Dashboard & KPIs' },
      { name: 'Alerts', description: 'Stock Alerts & Notifications' },
      { name: 'Audit', description: 'Audit Trail & Logs' },
      { name: 'Settings', description: 'System Settings' },
      { name: 'Health', description: 'System Health & Availability' },
      { name: 'Monitoring', description: 'System Metrics & Monitoring' },
      { name: 'Webhooks', description: 'Webhook Management & Dispatch' },
    ],
  },
  apis: ['./src/modules/**/*.routes.ts', './src/modules/**/*.controller.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

export function setupSwagger(app: Express): void {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
