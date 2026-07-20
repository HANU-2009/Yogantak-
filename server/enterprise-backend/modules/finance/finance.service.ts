import { prisma } from '../../config/database';
import { BadRequestError, NotFoundError } from '../../shared/errors/AppError';
import type { 
  WalletTransactionDtoType, 
  CreateRefundDtoType, 
  CreateAccountDtoType, 
  PostJournalEntryDtoType, 
  CreateReconciliationDtoType 
} from './finance.dto';
import { Decimal } from '@prisma/client/runtime/library';

export class FinanceService {
  // ============================================================
  // WALLET SYSTEM
  // ============================================================

  async getOrCreateWallet(userId: string) {
    let wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId,
          balance: 0,
        },
      });
    }
    return wallet;
  }

  async creditWallet(userId: string, dto: WalletTransactionDtoType) {
    const wallet = await this.getOrCreateWallet(userId);
    const newBalance = new Decimal(wallet.balance).add(dto.amount);

    return prisma.$transaction(async (tx) => {
      // 1. Update wallet balance
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance },
      });

      // 2. Create transaction record
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: dto.amount,
          type: 'CREDIT',
          source: dto.source,
          referenceId: dto.referenceId,
          description: dto.description || 'Wallet credit transaction',
        },
      });

      return { wallet: updatedWallet, transaction };
    });
  }

  async debitWallet(userId: string, dto: WalletTransactionDtoType) {
    const wallet = await this.getOrCreateWallet(userId);
    const currentBalance = new Decimal(wallet.balance);

    if (currentBalance.lessThan(dto.amount)) {
      throw new BadRequestError(`Insufficient wallet balance. Current balance: ${currentBalance.toFixed(2)}`);
    }

    const newBalance = currentBalance.sub(dto.amount);

    return prisma.$transaction(async (tx) => {
      // 1. Update wallet balance
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance },
      });

      // 2. Create transaction record
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: dto.amount,
          type: 'DEBIT',
          source: dto.source,
          referenceId: dto.referenceId,
          description: dto.description || 'Wallet debit transaction',
        },
      });

      return { wallet: updatedWallet, transaction };
    });
  }

  async getWalletTransactions(userId: string) {
    const wallet = await this.getOrCreateWallet(userId);
    return prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ============================================================
  // REFUND MANAGEMENT
  // ============================================================

  async createRefund(dto: CreateRefundDtoType) {
    // 1. Validate target order/return
    let customerId: string | null = null;
    if (dto.salesOrderId) {
      const order = await prisma.salesOrder.findUnique({
        where: { id: dto.salesOrderId },
      });
      if (!order) throw new NotFoundError(`Sales order not found`);
      customerId = order.customerId;
    } else if (dto.salesReturnId) {
      const ret = await prisma.salesReturn.findUnique({
        where: { id: dto.salesReturnId },
        include: { salesOrder: true },
      });
      if (!ret) throw new NotFoundError(`Sales return record not found`);
      customerId = ret.salesOrder.customerId;
    }

    const refundNumber = `REF-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return prisma.$transaction(async (tx) => {
      // 2. Create Refund log
      const refund = await tx.refund.create({
        data: {
          refundNumber,
          salesOrderId: dto.salesOrderId,
          salesReturnId: dto.salesReturnId,
          amount: dto.amount,
          status: 'PROCESSED',
          paymentMethod: dto.paymentMethod,
          gatewayReference: dto.gatewayReference,
          reason: dto.reason,
          notes: dto.notes,
        },
      });

      // 3. Process Wallet Credit if payment method is wallet
      if (dto.paymentMethod === 'WALLET') {
        if (!customerId) {
          throw new BadRequestError(`Cannot refund to wallet without a valid customer ID`);
        }
        
        let wallet = await tx.wallet.findUnique({
          where: { userId: customerId },
        });

        if (!wallet) {
          wallet = await tx.wallet.create({
            data: { userId: customerId, balance: 0 },
          });
        }

        const newBalance = new Decimal(wallet.balance).add(dto.amount);
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: newBalance },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            amount: dto.amount,
            type: 'CREDIT',
            source: 'REFUND',
            referenceId: refund.id,
            description: `Refund credited for ${dto.salesOrderId ? 'Order' : 'Return'}`,
          },
        });
      }

      // 4. Update order / return status to REFUNDED
      if (dto.salesOrderId) {
        await tx.salesOrder.update({
          where: { id: dto.salesOrderId },
          data: { 
            paymentStatus: 'REFUNDED',
            status: 'REFUNDED'
          },
        });
      }
      if (dto.salesReturnId) {
        await tx.salesReturn.update({
          where: { id: dto.salesReturnId },
          data: { status: 'REFUNDED' },
        });
      }

      // 5. Post accounting entry
      await this.postJournalEntryFromTransaction(tx, {
        reference: refundNumber,
        description: `Customer refund: ${dto.reason || 'sales refund'}`,
        entries: [
          { accountCode: '4100', type: 'DEBIT', amount: dto.amount }, // Sales Returns Account
          { accountCode: dto.paymentMethod === 'WALLET' ? '2100' : '1000', type: 'CREDIT', amount: dto.amount } // Wallet liability (2100) or Cash asset (1000)
        ]
      });

      // 6. Post Tax Record reversal
      await this.postTaxRecordFromTransaction(tx, {
        transactionType: 'REFUND',
        referenceId: refund.id,
        hsnCode: 'REFUND',
        taxableAmount: -dto.amount,
        gstPercent: 18,
        fromState: 'DEFAULT',
        toState: 'DEFAULT'
      });

      return refund;
    });
  }

  async getRefunds() {
    return prisma.refund.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        salesOrder: true,
        salesReturn: true,
      }
    });
  }

  // ============================================================
  // GST & TAX MANAGEMENT
  // ============================================================

  calculateGst(taxableAmount: number, gstPercent: number, fromState?: string, toState?: string) {
    const amount = new Decimal(taxableAmount);
    const taxRate = new Decimal(gstPercent).div(100);
    const totalTax = amount.mul(taxRate);

    let cgst = new Decimal(0);
    let sgst = new Decimal(0);
    let igst = new Decimal(0);

    // If destination state is same as warehouse origin, CGST + SGST apply. Else, IGST applies.
    if (fromState && toState && fromState.toLowerCase() === toState.toLowerCase()) {
      cgst = totalTax.div(2);
      sgst = totalTax.div(2);
    } else {
      igst = totalTax;
    }

    return {
      taxableAmount: amount.toNumber(),
      gstPercent,
      cgstAmount: cgst.toNumber(),
      sgstAmount: sgst.toNumber(),
      igstAmount: igst.toNumber(),
      totalTaxAmount: totalTax.toNumber(),
    };
  }

  private async postTaxRecordFromTransaction(tx: any, params: {
    transactionType: 'SALES' | 'PURCHASE' | 'RETURN' | 'REFUND';
    referenceId: string;
    hsnCode?: string;
    taxableAmount: number;
    gstPercent: number;
    fromState: string;
    toState: string;
  }) {
    const taxData = this.calculateGst(params.taxableAmount, params.gstPercent, params.fromState, params.toState);
    return tx.taxRecord.create({
      data: {
        transactionType: params.transactionType,
        referenceId: params.referenceId,
        hsnCode: params.hsnCode || null,
        taxableAmount: taxData.taxableAmount,
        gstPercent: taxData.gstPercent,
        cgstAmount: taxData.cgstAmount,
        sgstAmount: taxData.sgstAmount,
        igstAmount: taxData.igstAmount,
        totalTaxAmount: taxData.totalTaxAmount,
        state: params.toState,
      }
    });
  }

  async getTaxRecords() {
    return prisma.taxRecord.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  // ============================================================
  // DOUBLE-ENTRY ACCOUNTING
  // ============================================================

  async getAccounts() {
    // Seed default accounts if empty
    const count = await prisma.account.count();
    if (count === 0) {
      await prisma.account.createMany({
        data: [
          { code: '1000', name: 'Cash/Bank Account', type: 'ASSET', balance: 100000 },
          { code: '1200', name: 'Accounts Receivable', type: 'ASSET', balance: 0 },
          { code: '1300', name: 'Inventory Asset', type: 'ASSET', balance: 50000 },
          { code: '2000', name: 'Accounts Payable', type: 'LIABILITY', balance: 0 },
          { code: '2100', name: 'Customer Wallet Balances', type: 'LIABILITY', balance: 0 },
          { code: '2200', name: 'GST Tax Liability', type: 'LIABILITY', balance: 0 },
          { code: '3000', name: 'Retained Earnings', type: 'EQUITY', balance: 150000 },
          { code: '4000', name: 'Sales Revenue', type: 'REVENUE', balance: 0 },
          { code: '4100', name: 'Sales Returns & Allowances', type: 'REVENUE', balance: 0 },
          { code: '5000', name: 'Cost of Goods Sold (COGS)', type: 'EXPENSE', balance: 0 },
          { code: '5100', name: 'Operational Expenses', type: 'EXPENSE', balance: 0 },
        ]
      });
    }
    return prisma.account.findMany({
      orderBy: { code: 'asc' },
    });
  }

  async createAccount(dto: CreateAccountDtoType) {
    const existing = await prisma.account.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new BadRequestError(`Account with code ${dto.code} already exists`);
    }

    return prisma.account.create({
      data: {
        code: dto.code,
        name: dto.name,
        type: dto.type,
        description: dto.description,
        balance: 0,
      }
    });
  }

  async postJournalEntry(dto: PostJournalEntryDtoType) {
    let totalDebit = new Decimal(0);
    let totalCredit = new Decimal(0);

    for (const entry of dto.entries) {
      if (entry.type === 'DEBIT') {
        totalDebit = totalDebit.add(entry.amount);
      } else {
        totalCredit = totalCredit.add(entry.amount);
      }
    }

    if (!totalDebit.equals(totalCredit)) {
      throw new BadRequestError(`Accounting discrepancy: Total Debits (${totalDebit.toFixed(2)}) must equal Total Credits (${totalCredit.toFixed(2)})`);
    }

    return prisma.$transaction(async (tx) => {
      const journal = await tx.transactionJournal.create({
        data: {
          reference: dto.reference,
          description: dto.description,
          date: dto.date ? new Date(dto.date) : new Date(),
        }
      });

      for (const entry of dto.entries) {
        const account = await tx.account.findUnique({
          where: { id: entry.accountId },
        });

        if (!account) {
          throw new NotFoundError(`Ledger account not found`);
        }

        // Apply GAAP debit/credit calculation
        let newBalance = new Decimal(account.balance);
        const amount = new Decimal(entry.amount);

        if (entry.type === 'DEBIT') {
          if (account.type === 'ASSET' || account.type === 'EXPENSE') {
            newBalance = newBalance.add(amount);
          } else {
            newBalance = newBalance.sub(amount);
          }
        } else { // CREDIT
          if (account.type === 'ASSET' || account.type === 'EXPENSE') {
            newBalance = newBalance.sub(amount);
          } else {
            newBalance = newBalance.add(amount);
          }
        }

        await tx.account.update({
          where: { id: account.id },
          data: { balance: newBalance },
        });

        await tx.journalEntry.create({
          data: {
            journalId: journal.id,
            accountId: account.id,
            type: entry.type,
            amount: entry.amount,
          }
        });
      }

      return journal;
    });
  }

  private async postJournalEntryFromTransaction(tx: any, params: {
    reference?: string;
    description?: string;
    entries: { accountCode: string; type: 'DEBIT' | 'CREDIT'; amount: number }[];
  }) {
    const journal = await tx.transactionJournal.create({
      data: {
        reference: params.reference,
        description: params.description,
        date: new Date(),
      }
    });

    for (const item of params.entries) {
      const account = await tx.account.findUnique({
        where: { code: item.accountCode },
      });

      if (!account) continue; // Skip if account config seed is not run yet

      let newBalance = new Decimal(account.balance);
      const amount = new Decimal(item.amount);

      if (item.type === 'DEBIT') {
        if (account.type === 'ASSET' || account.type === 'EXPENSE') {
          newBalance = newBalance.add(amount);
        } else {
          newBalance = newBalance.sub(amount);
        }
      } else {
        if (account.type === 'ASSET' || account.type === 'EXPENSE') {
          newBalance = newBalance.sub(amount);
        } else {
          newBalance = newBalance.add(amount);
        }
      }

      await tx.account.update({
        where: { id: account.id },
        data: { balance: newBalance },
      });

      await tx.journalEntry.create({
        data: {
          journalId: journal.id,
          accountId: account.id,
          type: item.type,
          amount: item.amount,
        }
      });
    }
  }

  // ============================================================
  // INVOICES
  // ============================================================

  async getSalesInvoice(invoiceId: string) {
    const invoice = await prisma.salesInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        salesOrder: {
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        }
      }
    });
    if (!invoice) throw new NotFoundError('Invoice not found');
    return invoice;
  }

  async getPurchaseInvoice(invoiceId: string) {
    const invoice = await prisma.purchaseInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        purchaseOrder: {
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        }
      }
    });
    if (!invoice) throw new NotFoundError('Invoice not found');
    return invoice;
  }

  // ============================================================
  // PAYMENT RECONCILIATION
  // ============================================================

  async reconcilePayment(dto: CreateReconciliationDtoType) {
    let matchedOrderId = dto.matchedOrderId || null;
    let reconciliationStatus: 'RECONCILED' | 'UNRECONCILED' | 'DISCREPANCY' = 'UNRECONCILED';
    let discrepancyAmt = 0;

    // Check if we can auto-match via payment reference against order number
    if (!matchedOrderId) {
      const matchedOrder = await prisma.salesOrder.findFirst({
        where: { orderNumber: dto.paymentRef },
      });
      if (matchedOrder) {
        matchedOrderId = matchedOrder.id;
      }
    }

    if (matchedOrderId) {
      const order = await prisma.salesOrder.findUnique({
        where: { id: matchedOrderId },
      });

      if (order) {
        const orderTotal = new Decimal(order.totalAmount);
        const received = new Decimal(dto.amount);
        if (orderTotal.equals(received)) {
          reconciliationStatus = 'RECONCILED';
        } else {
          reconciliationStatus = 'DISCREPANCY';
          discrepancyAmt = orderTotal.sub(received).abs().toNumber();
        }
      }
    }

    return prisma.paymentReconciliation.create({
      data: {
        paymentRef: dto.paymentRef,
        amount: dto.amount,
        paymentDate: new Date(dto.paymentDate),
        status: reconciliationStatus,
        matchedOrderId,
        matchedType: dto.matchedType || 'SALES',
        discrepancyAmt: discrepancyAmt || null,
        notes: dto.notes,
      }
    });
  }

  async getReconciliations() {
    return prisma.paymentReconciliation.findMany({
      orderBy: { paymentDate: 'desc' },
    });
  }

  // ============================================================
  // FINANCIAL REPORTS
  // ============================================================

  async getRevenueReport(startDateStr?: string, endDateStr?: string) {
    const where: any = {
      status: { notIn: ['CANCELLED', 'RETURNED'] },
    };

    if (startDateStr || endDateStr) {
      where.orderDate = {};
      if (startDateStr) where.orderDate.gte = new Date(startDateStr);
      if (endDateStr) where.orderDate.lte = new Date(endDateStr);
    }

    const orders = await prisma.salesOrder.findMany({
      where,
      select: {
        totalAmount: true,
        orderDate: true,
      }
    });

    const totalRevenue = orders.reduce((sum, order) => sum.add(new Decimal(order.totalAmount)), new Decimal(0));

    return {
      startDate: startDateStr || 'all-time',
      endDate: endDateStr || 'all-time',
      totalRevenue: totalRevenue.toNumber(),
      ordersCount: orders.length,
      orders,
    };
  }

  async getProfitLossReport(startDateStr?: string, endDateStr?: string) {
    // 1. Calculate Revenue
    const revenueReport = await this.getRevenueReport(startDateStr, endDateStr);
    const revenue = new Decimal(revenueReport.totalRevenue);

    // 2. Calculate COGS
    const salesOrderWhere: any = {
      status: { notIn: ['CANCELLED', 'RETURNED'] },
    };
    if (startDateStr || endDateStr) {
      salesOrderWhere.orderDate = {};
      if (startDateStr) salesOrderWhere.orderDate.gte = new Date(startDateStr);
      if (endDateStr) salesOrderWhere.orderDate.lte = new Date(endDateStr);
    }

    const salesItems = await prisma.salesOrderItem.findMany({
      where: {
        salesOrder: salesOrderWhere
      },
      include: {
        product: true
      }
    });

    let cogs = new Decimal(0);
    for (const item of salesItems) {
      const cost = item.product.costPrice ? new Decimal(item.product.costPrice) : new Decimal(item.unitPrice).mul(0.6); // Fallback: 60% of unit price
      cogs = cogs.add(cost.mul(item.quantity));
    }

    // 3. Calculate Expenses from accounting entries (Code 5100: Operational Expenses)
    const expenseAccount = await prisma.account.findUnique({
      where: { code: '5100' },
    });
    const expenses = expenseAccount ? new Decimal(expenseAccount.balance) : new Decimal(0);

    const grossProfit = revenue.sub(cogs);
    const netProfit = grossProfit.sub(expenses);

    return {
      startDate: startDateStr || 'all-time',
      endDate: endDateStr || 'all-time',
      revenue: revenue.toNumber(),
      cogs: cogs.toNumber(),
      grossProfit: grossProfit.toNumber(),
      expenses: expenses.toNumber(),
      netProfit: netProfit.toNumber(),
    };
  }
}

export const financeService = new FinanceService();
