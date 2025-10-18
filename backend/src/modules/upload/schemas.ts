import { z } from 'zod';

export const uploadSuccessResponseSchema = z.object({
  success: z.boolean(),
  filename: z.string(),
});

export const uploadErrorResponseSchema = z.object({
  error: z.string(),
});
