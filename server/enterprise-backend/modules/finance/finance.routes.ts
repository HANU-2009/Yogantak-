import { Router } from 'express';
import { financeController } from './finance.controller';
import { authenticate, requirePermission, Permissions } from '../../shared/middleware/rbac.middleware';
import { validateBody } from '../../shared/middleware/validate.middleware';
import { 
  WalletTransactionDto, 
  CreateRefundDto, 
  CreateAccountDto, 
  PostJournalEntryDto, 
  CreateReconciliationDto 
} from './finance.dto';

const router = Router();

router.use(authenticate);

// ============================================================
// WALLET SYSTEM ENDPOINTS
// ============================================================

/**
 * @swagger
 * /finance/wallet/balance:
 *   get:
 *     tags: [Finance]
 *     summary: Retrieve user's current wallet balance
 *     responses:
 *       200:
 *         description: Current wallet balance retrieved
 */
router.get('/wallet/balance', financeController.getWalletBalance.bind(financeController));

/**
 * @swagger
 * /finance/wallet/transactions:
 *   get:
 *     tags: [Finance]
 *     summary: Get wallet transactions history of the user
 *     responses:
 *       200:
 *         description: List of wallet transactions
 */
router.get('/wallet/transactions', financeController.getWalletTransactions.bind(financeController));

/**
 * @swagger
 * /finance/wallet/credit:
 *   post:
 *     tags: [Finance]
 *     summary: Credit funds to a wallet (admin/staff or manual checkout credit)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               userId: { type: string, format: uuid }
 *               amount: { type: number }
 *               source: { type: string }
 *               referenceId: { type: string }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Wallet credited successfully
 */
router.post('/wallet/credit', requirePermission(Permissions.FINANCE_UPDATE), validateBody(WalletTransactionDto), financeController.creditWallet.bind(financeController));

/**
 * @swagger
 * /finance/wallet/debit:
 *   post:
 *     tags: [Finance]
 *     summary: Debit funds from a wallet (for wallet purchases)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               userId: { type: string, format: uuid }
 *               amount: { type: number }
 *               source: { type: string }
 *               referenceId: { type: string }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Wallet debited successfully
 */
router.post('/wallet/debit', requirePermission(Permissions.FINANCE_UPDATE), validateBody(WalletTransactionDto), financeController.debitWallet.bind(financeController));

// ============================================================
// REFUND ENDPOINTS
// ============================================================

/**
 * @swagger
 * /finance/refunds:
 *   post:
 *     tags: [Finance]
 *     summary: Process a customer refund (credits wallet if WALLET, updates order status)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, paymentMethod]
 *             properties:
 *               salesOrderId: { type: string, format: uuid }
 *               salesReturnId: { type: string, format: uuid }
 *               amount: { type: number }
 *               paymentMethod: { type: string, enum: [CASH, BANK_TRANSFER, UPI, WALLET] }
 *               gatewayReference: { type: string }
 *               reason: { type: string }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Refund log created and processed
 *   get:
 *     tags: [Finance]
 *     summary: Get all refunds history
 *     responses:
 *       200:
 *         description: List of processed refunds
 */
router.post('/refunds', requirePermission(Permissions.FINANCE_CREATE), validateBody(CreateRefundDto), financeController.createRefund.bind(financeController));
router.get('/refunds', requirePermission(Permissions.FINANCE_READ), financeController.getRefunds.bind(financeController));

// ============================================================
// GST & TAX ENDPOINTS
// ============================================================

/**
 * @swagger
 * /finance/taxes/calculate:
 *   get:
 *     tags: [Finance]
 *     summary: Calculate CGST, SGST, IGST split based on transaction states
 *     parameters:
 *       - in: query
 *         name: taxableAmount
 *         required: true
 *         schema: { type: number }
 *       - in: query
 *         name: gstPercent
 *         required: true
 *         schema: { type: number }
 *       - in: query
 *         name: fromState
 *         schema: { type: string }
 *       - in: query
 *         name: toState
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: GST split calculated
 */
router.get('/taxes/calculate', requirePermission(Permissions.FINANCE_READ), financeController.calculateTax.bind(financeController));

/**
 * @swagger
 * /finance/taxes/records:
 *   get:
 *     tags: [Finance]
 *     summary: Retrieve log of tax records
 *     responses:
 *       200:
 *         description: List of GST tax records
 */
router.get('/taxes/records', requirePermission(Permissions.FINANCE_READ), financeController.getTaxRecords.bind(financeController));

// ============================================================
// DOUBLE-ENTRY ACCOUNTING ENDPOINTS
// ============================================================

/**
 * @swagger
 * /finance/accounting/accounts:
 *   get:
 *     tags: [Finance]
 *     summary: List chart of accounts
 *     responses:
 *       200:
 *         description: List of ledger accounts
 *   post:
 *     tags: [Finance]
 *     summary: Create a chart of account ledger category
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, name, type]
 *             properties:
 *               code: { type: string }
 *               name: { type: string }
 *               type: { type: string, enum: [ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE] }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Chart account created
 */
router.get('/accounting/accounts', requirePermission(Permissions.FINANCE_READ), financeController.getAccounts.bind(financeController));
router.post('/accounting/accounts', requirePermission(Permissions.FINANCE_CREATE), validateBody(CreateAccountDto), financeController.createAccount.bind(financeController));

/**
 * @swagger
 * /finance/accounting/journal:
 *   post:
 *     tags: [Finance]
 *     summary: Post a double-entry journal voucher to the ledger
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [entries]
 *             properties:
 *               reference: { type: string }
 *               description: { type: string }
 *               date: { type: string, format: date-time }
 *               entries:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [accountId, type, amount]
 *                   properties:
 *                     accountId: { type: string, format: uuid }
 *                     type: { type: string, enum: [DEBIT, CREDIT] }
 *                     amount: { type: number }
 *     responses:
 *       201:
 *         description: Journal posting completed
 */
router.post('/accounting/journal', requirePermission(Permissions.FINANCE_CREATE), validateBody(PostJournalEntryDto), financeController.postJournalEntry.bind(financeController));

// ============================================================
// PAYMENT RECONCILIATION ENDPOINTS
// ============================================================

/**
 * @swagger
 * /finance/reconcile:
 *   post:
 *     tags: [Finance]
 *     summary: Record and automatically reconcile a bank/gateway transaction against orders
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [paymentRef, amount, paymentDate]
 *             properties:
 *               paymentRef: { type: string }
 *               amount: { type: number }
 *               paymentDate: { type: string, format: date-time }
 *               matchedOrderId: { type: string, format: uuid }
 *               matchedType: { type: string, enum: [SALES, PURCHASE] }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Reconciliation entry logged
 */
router.post('/reconcile', requirePermission(Permissions.FINANCE_RECONCILE), validateBody(CreateReconciliationDto), financeController.reconcilePayment.bind(financeController));

/**
 * @swagger
 * /finance/reconciliations:
 *   get:
 *     tags: [Finance]
 *     summary: Get list of payment reconciliations
 *     responses:
 *       200:
 *         description: List of bank payment reconciliations
 */
router.get('/reconciliations', requirePermission(Permissions.FINANCE_READ), financeController.getReconciliations.bind(financeController));

// ============================================================
// FINANCIAL REPORTS ENDPOINTS
// ============================================================

/**
 * @swagger
 * /finance/reports/revenue:
 *   get:
 *     tags: [Finance]
 *     summary: Generate revenue summary and order metrics report
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string }
 *       - in: query
 *         name: endDate
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Revenue report computed
 */
router.get('/reports/revenue', requirePermission(Permissions.REPORTS_VIEW), financeController.getRevenueReport.bind(financeController));

/**
 * @swagger
 * /finance/reports/profit-loss:
 *   get:
 *     tags: [Finance]
 *     summary: Generate Profit & Loss (P&L) statement
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string }
 *       - in: query
 *         name: endDate
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: P&L statement computed
 */
router.get('/reports/profit-loss', requirePermission(Permissions.REPORTS_VIEW), financeController.getProfitLossReport.bind(financeController));

export default router;
