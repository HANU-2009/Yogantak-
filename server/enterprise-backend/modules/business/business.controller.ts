import { Request, Response, NextFunction } from 'express';
import { businessService } from './business.service';
import { sendSuccess, sendCreated } from '../../shared/utils/response';

export class BusinessController {
  // Vendor Management
  async getVendorDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await businessService.getVendorDashboard();
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  async updateVendorStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await businessService.updateVendorStatus(req.params.id as string, req.body, req.user?.id as string);
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  // Employees
  async getEmployees(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await businessService.getEmployees();
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  async assignRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await businessService.assignRole(req.body);
      sendCreated(res, data);
    } catch (error) { next(error); }
  }

  // CRM Support Tickets
  async createTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await businessService.createTicket(req.body, req.user?.id as string);
      sendCreated(res, data);
    } catch (error) { next(error); }
  }

  async getTickets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await businessService.getTickets();
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  async updateTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await businessService.updateTicket(req.params.id as string, req.body);
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  // Stores
  async createStore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await businessService.createStore(req.body);
      sendCreated(res, data);
    } catch (error) { next(error); }
  }

  async getStores(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await businessService.getStores();
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  // Advanced Warehouse
  async getSlottingRecommendation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await businessService.getSlottingRecommendation(req.query.productId as string);
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  // Timeline
  async getTimeline(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await businessService.getTimeline();
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  // Approvals
  async createApprovalRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await businessService.createApprovalRequest(req.body, req.user?.id as string);
      sendCreated(res, data);
    } catch (error) { next(error); }
  }

  async updateApprovalStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await businessService.updateApprovalStatus(req.params.id as string, req.body, req.user?.id as string);
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  // Tasks
  async createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await businessService.createTask(req.body, req.user?.id as string);
      sendCreated(res, data);
    } catch (error) { next(error); }
  }

  async getTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await businessService.getTasks();
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  async updateTaskStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await businessService.updateTaskStatus(req.params.id as string, req.body);
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }
}

export const businessController = new BusinessController();
