import { z } from 'zod';

export const uploadSuccessResponseSchema = z
  .object({
    success: z.boolean().describe('Whether the upload was successful'),
    filename: z.string().describe('Name of the uploaded file'),
  })
  .describe('Successful upload response');

export const uploadErrorResponseSchema = z
  .object({
    error: z.string().describe('Error message describing what went wrong'),
  })
  .describe('Error response for failed upload');
