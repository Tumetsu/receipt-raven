import { z } from 'zod';
import { ReceiptJobStatus } from '../../../domain/types';

export const jobSchema = z
  .object({
    id: z.number().describe('Unique identifier for the job'),
    filename: z.string().describe('Filename of the uploaded receipt image'),
    fileUrl: z.string().describe('URL to access the receipt image'),
    retryCount: z.number().describe('Number of times the job has been retried'),
    processedAt: z
      .string()
      .optional()
      .describe('Timestamp when the job was processed (ISO 8601 format)'),
    createdAt: z
      .string()
      .describe('Timestamp when the job was created (ISO 8601 format)'),
    status: z
      .enum(Object.values(ReceiptJobStatus))
      .describe(
        'Status of the job (pending, processing, completed, or failed)'
      ),
    analysisError: z
      .string()
      .optional()
      .describe('Error message if the analysis failed'),
  })
  .describe('A job representing an uploaded receipt to be processed');

// Export inferred TypeScript type
export type Job = z.infer<typeof jobSchema>;
