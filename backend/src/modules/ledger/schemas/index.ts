import { z } from 'zod';

// API Route schemas for REST endpoints
export const accountsQuerystringSchema = z.object({
  type: z.string().optional(),
});

export const accountsApiResponseSchema = z.array(z.string());

export const payeesApiResponseSchema = z.object({
  payees: z.array(z.string()),
});

export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
});
