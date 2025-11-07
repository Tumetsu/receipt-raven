import { z } from 'zod';

export enum ReceiptStatus {
  APPROVED = 'approved',
  UNAPPROVED = 'unapproved',
}

export enum ReceiptJobStatus {
  WAITING = 'waiting',
  PROCESSED = 'processed',
  FAILED = 'failed',
}

export enum HeuristicLevel {
  WARN = 'WARN',
  SEVERE = 'SEVERE',
  ERROR = 'ERROR',
}

export interface HeuristicIssue {
  level: HeuristicLevel;
  message: string;
}

export const HeuristicIssueSchema = z.object({
  level: z.enum(['WARN', 'SEVERE', 'ERROR']),
  message: z.string(),
});

export const OcrNotesSchema = z
  .object({
    suspiciousDate: HeuristicIssueSchema.optional(),
  })
  .strict();

export type OcrNotes = z.infer<typeof OcrNotesSchema>;
