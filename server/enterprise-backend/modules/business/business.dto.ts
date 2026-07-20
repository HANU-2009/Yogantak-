import { z } from 'zod';

export const VendorApproveDto = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  comments: z.string().optional(),
});
export type VendorApproveDtoType = z.infer<typeof VendorApproveDto>;

export const AssignRoleDto = z.object({
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
});
export type AssignRoleDtoType = z.infer<typeof AssignRoleDto>;

export const CreateTicketDto = z.object({
  customerId: z.string().uuid().optional(),
  title: z.string().min(1),
  description: z.string().min(1),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
});
export type CreateTicketDtoType = z.infer<typeof CreateTicketDto>;

export const UpdateTicketDto = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  assignedStaffId: z.string().uuid().optional(),
});
export type UpdateTicketDtoType = z.infer<typeof UpdateTicketDto>;

export const CreateStoreDto = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});
export type CreateStoreDtoType = z.infer<typeof CreateStoreDto>;

export const CreateApprovalDto = z.object({
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  assignedApproverId: z.string().uuid(),
  comments: z.string().optional(),
});
export type CreateApprovalDtoType = z.infer<typeof CreateApprovalDto>;

export const UpdateApprovalDto = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  comments: z.string().optional(),
});
export type UpdateApprovalDtoType = z.infer<typeof UpdateApprovalDto>;

export const CreateTaskDto = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  assignedToId: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional(),
});
export type CreateTaskDtoType = z.infer<typeof CreateTaskDto>;

export const UpdateTaskDto = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
});
export type UpdateTaskDtoType = z.infer<typeof UpdateTaskDto>;
