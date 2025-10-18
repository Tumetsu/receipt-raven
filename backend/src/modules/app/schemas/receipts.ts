import { z } from 'zod';

export const receiptSchema = z.object({
  id: z.number(),
  payee: z.string(),
  sourceAccount: z.string().nullish(),
  date: z.string(),
  totalSum: z.number(),
  status: z.string(),
  filename: z.string(),
  fileUrl: z.string(),
});

export const receiptItemSchema = z.object({
  id: z.number(),
  receiptId: z.number(),
  name: z.string(),
  expenseAccount: z.string(),
  price: z.number(),
});

export const receiptSubmissionSchema = z.object({
  sourceAccount: z.string(),
  payee: z.string(),
  date: z.string(),
  totalSum: z.number(),
  items: z
    .array(
      z.object({
        id: z.number().optional(), // Missing from new items created on frontend
        name: z.string(),
        price: z.number(),
        expenseAccount: z.string(),
      })
    )
    .min(1), // minItems: 1
});

// Export inferred TypeScript types
export type Receipt = z.infer<typeof receiptSchema>;
export type ReceiptItem = z.infer<typeof receiptItemSchema>;
export type ReceiptSubmission = z.infer<typeof receiptSubmissionSchema>;
