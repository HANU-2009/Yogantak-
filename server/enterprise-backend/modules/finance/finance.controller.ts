import { Request, Response, NextFunction } from 'express';
import { financeService } from './finance.service';
import { sendSuccess, sendCreated } from '../../shared/utils/response';
import { BadRequestError } from '../../shared/errors/AppError';

export class FinanceController {
  // ============================================================
  // WALLET CONTROLLER
  // ============================================================

  async getWalletBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const wallet = await financeService.getOrCreateWallet(userId);
      sendSuccess(res, { balance: wallet.balance, currency: wallet.currency });
    } catch (error) { next(error); }
  }

  async getWalletTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const data = await financeService.getWalletTransactions(userId);
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  async creditWallet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.body.userId || req.user!.id;
      const data = await financeService.creditWallet(userId, req.body);
      sendCreated(res, data, 'Wallet credited successfully');
    } catch (error) { next(error); }
  }

  async debitWallet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.body.userId || req.user!.id;
      const data = await financeService.debitWallet(userId, req.body);
      sendCreated(res, data, 'Wallet debited successfully');
    } catch (error) { next(error); }
  }

  // ============================================================
  // REFUND CONTROLLER
  // ============================================================

  async createRefund(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await financeService.createRefund(req.body);
      sendCreated(res, data, 'Refund processed successfully');
    } catch (error) { next(error); }
  }

  async getRefunds(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await financeService.getRefunds();
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  // ============================================================
  // GST & TAX CONTROLLER
  // ============================================================

  async calculateTax(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { taxableAmount, gstPercent, fromState, toState } = req.query;
      if (!taxableAmount || !gstPercent) {
        throw new BadRequestError('Missing query parameters: taxableAmount, gstPercent');
      }
      const data = financeService.calculateGst(
        parseFloat(taxableAmount as string),
        parseFloat(gstPercent as string),
        fromState as string,
        toState as string
      );
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  async getTaxRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await financeService.getTaxRecords();
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  // ============================================================
  // ACCOUNTING CONTROLLER
  // ============================================================

  async getAccounts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await financeService.getAccounts();
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  async createAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await financeService.createAccount(req.body);
      sendCreated(res, data, 'Chart Account created');
    } catch (error) { next(error); }
  }

  async postJournalEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await financeService.postJournalEntry(req.body);
      sendCreated(res, data, 'Journal posting complete');
    } catch (error) { next(error); }
  }

  // ============================================================
  // RECONCILIATION CONTROLLER
  // ============================================================

  async reconcilePayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await financeService.reconcilePayment(req.body);
      sendCreated(res, data, 'Reconciliation entry logged');
    } catch (error) { next(error); }
  }

  async getReconciliations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await financeService.getReconciliations();
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  // ============================================================
  // REPORTS CONTROLLER
  // ============================================================

  async getRevenueReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      const data = await financeService.getRevenueReport(startDate as string, endDate as string);
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  async getProfitLossReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      const data = await financeService.getProfitLossReport(startDate as string, endDate as string);
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }
}

export const financeController = new FinanceController();
