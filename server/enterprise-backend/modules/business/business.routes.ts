import { Router } from 'express';
import { businessController } from './business.controller';
import { authenticate, requirePermission, Permissions } from '../../shared/middleware/rbac.middleware';
import { validateBody } from '../../shared/middleware/validate.middleware';
import {
  VendorApproveDto,
  AssignRoleDto,
  CreateTicketDto,
  UpdateTicketDto,
  CreateStoreDto,
  CreateApprovalDto,
  UpdateApprovalDto,
  CreateTaskDto,
  UpdateTaskDto
} from './business.dto';

const router = Router();

router.use(authenticate);

// ============================================================
// VENDOR MANAGEMENT
// ============================================================

/**
 * @swagger
 * /business/vendors/dashboard:
 *   get:
 *     tags: [Business]
 *     summary: Retrieve vendor statistics and directory
 *     responses:
 *       200:
 *         description: Vendor dashboard data
 */
router.get('/vendors/dashboard', requirePermission(Permissions.BUSINESS_READ), businessController.getVendorDashboard.bind(businessController));

/**
 * @swagger
 * /business/vendors/{id}/approve:
 *   put:
 *     tags: [Business]
 *     summary: Approve or reject a vendor
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, APPROVED, REJECTED]
 *               comments:
 *                 type: string
 *     responses:
 *       200:
 *         description: Vendor status updated
 */
router.put('/vendors/:id/approve', requirePermission(Permissions.BUSINESS_APPROVE), validateBody(VendorApproveDto), businessController.updateVendorStatus.bind(businessController));

// ============================================================
// EMPLOYEE MANAGEMENT
// ============================================================

/**
 * @swagger
 * /business/employees:
 *   get:
 *     tags: [Business]
 *     summary: List all employees and their roles
 *     responses:
 *       200:
 *         description: Employees list
 */
router.get('/employees', requirePermission(Permissions.BUSINESS_READ), businessController.getEmployees.bind(businessController));

/**
 * @swagger
 * /business/employees/assign-role:
 *   post:
 *     tags: [Business]
 *     summary: Assign a role to an employee
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               roleId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Role assigned
 */
router.post('/employees/assign-role', requirePermission(Permissions.BUSINESS_UPDATE), validateBody(AssignRoleDto), businessController.assignRole.bind(businessController));

// ============================================================
// CRM TICKETS
// ============================================================

/**
 * @swagger
 * /business/tickets:
 *   get:
 *     tags: [Business]
 *     summary: List all support tickets
 *     responses:
 *       200:
 *         description: Tickets list
 */
router.get('/tickets', requirePermission(Permissions.BUSINESS_READ), businessController.getTickets.bind(businessController));

/**
 * @swagger
 * /business/tickets:
 *   post:
 *     tags: [Business]
 *     summary: Create a support ticket
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customerId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *     responses:
 *       201:
 *         description: Ticket created
 */
router.post('/tickets', requirePermission(Permissions.BUSINESS_CREATE), validateBody(CreateTicketDto), businessController.createTicket.bind(businessController));

/**
 * @swagger
 * /business/tickets/{id}:
 *   put:
 *     tags: [Business]
 *     summary: Update a support ticket status or assignee
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *               assignedStaffId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ticket updated
 */
router.put('/tickets/:id', requirePermission(Permissions.BUSINESS_UPDATE), validateBody(UpdateTicketDto), businessController.updateTicket.bind(businessController));

// ============================================================
// STORES
// ============================================================

/**
 * @swagger
 * /business/stores:
 *   get:
 *     tags: [Business]
 *     summary: List all stores
 *     responses:
 *       200:
 *         description: Stores list
 */
router.get('/stores', requirePermission(Permissions.BUSINESS_READ), businessController.getStores.bind(businessController));

/**
 * @swagger
 * /business/stores:
 *   post:
 *     tags: [Business]
 *     summary: Create a store location
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: Store created
 */
router.post('/stores', requirePermission(Permissions.BUSINESS_CREATE), validateBody(CreateStoreDto), businessController.createStore.bind(businessController));

// ============================================================
// WAREHOUSE
// ============================================================

/**
 * @swagger
 * /business/warehouse/slotting-recommendation:
 *   get:
 *     tags: [Business]
 *     summary: Get advanced slotting recommendation for a product
 *     parameters:
 *       - in: query
 *         name: productId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Recommended Bin
 */
router.get('/warehouse/slotting-recommendation', requirePermission(Permissions.BUSINESS_READ), businessController.getSlottingRecommendation.bind(businessController));

// ============================================================
// TIMELINE
// ============================================================

/**
 * @swagger
 * /business/timeline:
 *   get:
 *     tags: [Business]
 *     summary: Get aggregated business activity timeline feed
 *     responses:
 *       200:
 *         description: Activity feed
 */
router.get('/timeline', requirePermission(Permissions.BUSINESS_READ), businessController.getTimeline.bind(businessController));

// ============================================================
// APPROVALS
// ============================================================

/**
 * @swagger
 * /business/approvals:
 *   post:
 *     tags: [Business]
 *     summary: Request an approval workflow
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               entityType:
 *                 type: string
 *               entityId:
 *                 type: string
 *               assignedApproverId:
 *                 type: string
 *               comments:
 *                 type: string
 *     responses:
 *       201:
 *         description: Request created
 */
router.post('/approvals', requirePermission(Permissions.BUSINESS_CREATE), validateBody(CreateApprovalDto), businessController.createApprovalRequest.bind(businessController));

/**
 * @swagger
 * /business/approvals/{id}:
 *   put:
 *     tags: [Business]
 *     summary: Approve or reject an approval request
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *               comments:
 *                 type: string
 *     responses:
 *       200:
 *         description: Approval status updated
 */
router.put('/approvals/:id', requirePermission(Permissions.BUSINESS_APPROVE), validateBody(UpdateApprovalDto), businessController.updateApprovalStatus.bind(businessController));

// ============================================================
// TASKS
// ============================================================

/**
 * @swagger
 * /business/tasks:
 *   get:
 *     tags: [Business]
 *     summary: List staff tasks
 *     responses:
 *       200:
 *         description: Tasks list
 */
router.get('/tasks', requirePermission(Permissions.BUSINESS_READ), businessController.getTasks.bind(businessController));

/**
 * @swagger
 * /business/tasks:
 *   post:
 *     tags: [Business]
 *     summary: Assign a task to staff
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *               assignedToId:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Task created
 */
router.post('/tasks', requirePermission(Permissions.TASKS_ASSIGN), validateBody(CreateTaskDto), businessController.createTask.bind(businessController));

/**
 * @swagger
 * /business/tasks/{id}:
 *   put:
 *     tags: [Business]
 *     summary: Update task status
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Task updated
 */
router.put('/tasks/:id', requirePermission(Permissions.BUSINESS_UPDATE), validateBody(UpdateTaskDto), businessController.updateTaskStatus.bind(businessController));

export default router;
