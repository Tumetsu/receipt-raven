import { z } from 'zod';

export const receiptSchema = z
  .object({
    id: z.number().describe('Unique identifier for the receipt'),
    payee: z.string().describe('Name of the shop or vendor'),
    sourceAccount: z
      .string()
      .nullish()
      .describe('Source account for the payment (optional)'),
    date: z.string().describe('Date of the receipt (ISO 8601 format)'),
    totalSum: z.number().describe('Total amount of the receipt'),
    status: z
      .string()
      .describe(
        'Status of the receipt (pending, approved, rejected, or error)'
      ),
    filename: z.string().describe('Filename of the receipt image'),
    fileUrl: z.string().describe('URL to access the receipt image'),
  })
  .describe('A receipt with all its details');

export const receiptItemSchema = z
  .object({
    id: z.number().describe('Unique identifier for the receipt item'),
    receiptId: z.number().describe('ID of the receipt this item belongs to'),
    name: z.string().describe('Name of the purchased item'),
    expenseAccount: z.string().describe('Ledger expense account for this item'),
    price: z.number().describe('Price of the item'),
  })
  .describe('A single item within a receipt');

export const receiptSubmissionSchema = z
  .object({
    sourceAccount: z.string().describe('Source account for the payment'),
    payee: z.string().describe('Name of the shop or vendor'),
    date: z.string().describe('Date of the receipt (ISO 8601 format)'),
    totalSum: z.number().describe('Total amount of the receipt'),
    items: z
      .array(
        z.object({
          id: z
            .number()
            .optional()
            .describe('ID of existing item (omit for new items)'),
          name: z.string().describe('Name of the purchased item'),
          price: z.number().describe('Price of the item'),
          expenseAccount: z
            .string()
            .describe('Ledger expense account for this item'),
        })
      )
      .min(1)
      .describe('List of items in the receipt (at least 1 required)'),
  })
  .describe('Data required to submit a receipt to the ledger');

// Export inferred TypeScript types
export type Receipt = z.infer<typeof receiptSchema>;
export type ReceiptItem = z.infer<typeof receiptItemSchema>;
export type ReceiptSubmission = z.infer<typeof receiptSubmissionSchema>;
