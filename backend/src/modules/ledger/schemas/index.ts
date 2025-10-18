import { z } from 'zod';
import { AccountType } from '../types.js';

/**
 * Zod schemas for validating ledger data from Python service
 */

export const AccountTypeSchema = z.nativeEnum(AccountType);

export const AccountSchema = z.object({
  name: z.string(),
  type: AccountTypeSchema,
  displayName: z.string().optional(),
});

export const PayeeSchema = z.object({
  name: z.string(),
});

export const TransactionPostingSchema = z.object({
  account: z.string(),
  amount: z.number(),
  currency: z.string().optional(),
  comment: z.string().optional(),
});

export const TransactionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  payee: z.string(),
  narration: z.string(),
  postings: z.array(TransactionPostingSchema),
  tags: z.array(z.string()).optional(),
  links: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

export const ReceiptTransactionItemSchema = z.object({
  name: z.string(),
  price: z.number(),
  expenseAccount: z.string().optional(),
});

export const ReceiptTransactionDataSchema = z.object({
  receiptId: z.bigint(),
  shop: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  items: z.array(ReceiptTransactionItemSchema),
  total: z.number(),
  sourceAccount: z.string(),
  currency: z.string().optional(),
});

// Response schemas from Python service
export const AccountsResponseSchema = z.object({
  accounts: z.array(AccountSchema),
});

export const PayeesResponseSchema = z.object({
  payees: z.array(PayeeSchema),
});
