import { prisma } from '../../config/database';
import { BadRequestError } from '../../shared/errors/AppError';
import type {
  VendorApproveDtoType,
  AssignRoleDtoType,
  CreateTicketDtoType,
  UpdateTicketDtoType,
  CreateStoreDtoType,
  CreateApprovalDtoType,
  UpdateApprovalDtoType,
  CreateTaskDtoType,
  UpdateTaskDtoType
} from './business.dto';

export class BusinessService {
  // Vendor Management
  async getVendorDashboard() {
    const suppliers = await prisma.supplier.findMany();
    const approved = suppliers.filter(s => s.status === 'APPROVED').length;
    const pending = suppliers.filter(s => s.status === 'PENDING').length;
    return {
      totalVendors: suppliers.length,
      approved,
      pending,
      vendors: suppliers
    };
  }

  async updateVendorStatus(id: string, dto: VendorApproveDtoType, userId: string) {
    const vendor = await prisma.supplier.update({
      where: { id },
      data: { status: dto.status }
    });
    // Log approval or rejection in AuditLog
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        module: 'BUSINESS',
        entityType: 'Supplier',
        entityId: id,
        description: dto.comments || ''
      }
    });
    return vendor;
  }

  // Employee Management
  async getEmployees() {
    return prisma.user.findMany({
      include: { userRoles: { include: { role: true } } }
    });
  }

  async assignRole(dto: AssignRoleDtoType) {
    const { userId, roleId } = dto;
    const existing = await prisma.userRole.findFirst({
      where: { userId, roleId }
    });
    if (existing) throw new BadRequestError('User already has this role');
    return prisma.userRole.create({
      data: { userId, roleId }
    });
  }

  // CRM Support Ticket
  async createTicket(dto: CreateTicketDtoType, _userId: string) {
    return prisma.supportTicket.create({
      data: {
        ticketNumber: `TKT-${Date.now()}`,
        title: dto.title,
        description: dto.description,
        priority: dto.priority as any,
        customerId: dto.customerId,
      }
    });
  }

  async getTickets() {
    return prisma.supportTicket.findMany({
      include: { customer: true, assignedStaff: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateTicket(id: string, dto: UpdateTicketDtoType) {
    return prisma.supportTicket.update({
      where: { id },
      data: {
        status: dto.status as any,
        assignedStaffId: dto.assignedStaffId
      }
    });
  }

  // Store Management
  async createStore(dto: CreateStoreDtoType) {
    return prisma.store.create({ data: dto });
  }

  async getStores() {
    return prisma.store.findMany();
  }

  // Advanced Warehouse Slotting
  async getSlottingRecommendation(_productId: string) {
    // Basic slotting algorithm logic based on velocity
    // 1. Fetch available bins
    const bins = await prisma.warehouseBin.findMany({
      where: { isActive: true },
      include: { shelf: { include: { rack: { include: { zone: { include: { warehouse: true } } } } } } }
    });
    // For demo purposes, recommend the first bin that is active
    if (bins.length === 0) return { error: 'No active bins found' };
    return {
      recommendedBin: bins[0],
      reason: 'Standard slotting policy applied based on size.'
    };
  }

  // Timeline
  async getTimeline() {
    const audits = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { user: true }
    });
    const invLogs = await prisma.inventoryLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { user: true, product: true }
    });

    const timeline = [
      ...audits.map(a => ({
        type: 'AUDIT',
        title: `${a.action} on ${a.entityType}`,
        description: a.description,
        user: a.user?.name,
        createdAt: a.createdAt
      })),
      ...invLogs.map(i => ({
        type: 'INVENTORY',
        title: `${i.operationType} for ${i.product?.name}`,
        description: `Quantity changed by ${i.quantity}`,
        user: i.user?.name,
        createdAt: i.createdAt
      }))
    ];

    timeline.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return timeline.slice(0, 30);
  }

  // Approval Workflow
  async createApprovalRequest(dto: CreateApprovalDtoType, userId: string) {
    return prisma.approvalRequest.create({
      data: {
        entityType: dto.entityType,
        entityId: dto.entityId,
        assignedApproverId: dto.assignedApproverId,
        requestedById: userId,
        comments: dto.comments
      }
    });
  }

  async updateApprovalStatus(id: string, dto: UpdateApprovalDtoType, _userId: string) {
    return prisma.approvalRequest.update({
      where: { id },
      data: { status: dto.status as any, comments: dto.comments }
    });
  }

  // Tasks
  async createTask(dto: CreateTaskDtoType, userId: string) {
    return prisma.staffTask.create({
      data: {
        title: dto.title,
        description: dto.description,
        priority: dto.priority as any,
        assignedToId: dto.assignedToId,
        createdById: userId,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null
      }
    });
  }

  async getTasks() {
    return prisma.staffTask.findMany({
      include: { assignedTo: true, createdBy: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateTaskStatus(id: string, dto: UpdateTaskDtoType) {
    return prisma.staffTask.update({
      where: { id },
      data: { status: dto.status as any }
    });
  }
}

export const businessService = new BusinessService();
