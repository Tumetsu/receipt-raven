import { z } from 'zod';

export const jobSchema = z.object({
  id: z.number(),
  filename: z.string(),
  fileUrl: z.string(),
  retryCount: z.number(),
  processedAt: z.string().optional(),
  createdAt: z.string(),
  status: z.string(),
  analysisError: z.string().optional(),
});

// Export inferred TypeScript type
export type Job = z.infer<typeof jobSchema>;
