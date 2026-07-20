import { z } from 'zod';

// ============================================================
// WALLET DTO
// ============================================================

export const WalletTransactionDto = z.object({
  userId: z.string().uuid().optional(), // Admin can credit/debit for other users
  amount: z.number().positive(),
  source: z.string().default('MANUAL'),
  referenceId: z.string().optional(),
  description: z.string().optional(),
});

export type WalletTransactionDtoType = z.infer<typeof WalletTransactionDto>;

// ============================================================
// REFUND DTO
// ============================================================

export const CreateRefundDto = z.object({
  salesOrderId: z.string().uuid().optional(),
  salesReturnId: z.string().uuid().optional(),
  amount: z.number().positive(),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CHEQUE', 'UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING', 'WALLET', 'COD', 'CREDIT_NOTE']),
  gatewayReference: z.string().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateRefundDtoType = z.infer<typeof CreateRefundDto>;

// ============================================================
// ACCOUNTING DTO
// ============================================================

export const CreateAccountDto = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']),
  description: z.string().optional(),
});

export type CreateAccountDtoType = z.infer<typeof CreateAccountDto>;

export const PostJournalEntryDto = z.object({
  reference: z.string().optional(),
  description: z.string().optional(),
  date: z.string().datetime().optional(),
  entries: z.array(
    z.object({
      accountId: z.string().uuid(),
      type: z.enum(['DEBIT', 'CREDIT']),
      amount: z.number().positive(),
    })
  ).min(2),
});

export type PostJournalEntryDtoType = z.infer<typeof PostJournalEntryDto>;

// ============================================================
// RECONCILIATION DTO
// ============================================================

export const CreateReconciliationDto = z.object({
  paymentRef: z.string().min(1),
  amount: z.number().positive(),
  paymentDate: z.string().datetime().or(z.string().date()),
  matchedOrderId: z.string().uuid().optional(),
  matchedType: z.enum(['SALES', 'PURCHASE']).optional(),
  notes: z.string().optional(),
});

export type CreateReconciliationDtoType = z.infer<typeof CreateReconciliationDto>;
