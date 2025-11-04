import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { jobSchema } from '../schemas/jobs.js';

const paginationQuerySchema = z
  .object({
    page: z.coerce
      .number()
      .min(1)
      .optional()
      .default(1)
      .describe('Page number (starting from 1)'),
    pageSize: z.coerce
      .number()
      .min(1)
      .max(100)
      .optional()
      .default(30)
      .describe('Number of items per page (max 100)'),
  })
  .describe('Pagination parameters');

const paginatedJobsResponseSchema = z
  .object({
    jobs: z.array(jobSchema).describe('Array of jobs'),
    total: z.number().describe('Total number of jobs'),
    page: z.number().describe('Current page number'),
    pageSize: z.number().describe('Number of items per page'),
    totalPages: z.number().describe('Total number of pages'),
  })
  .describe('Paginated jobs response');

const jobRoutes: FastifyPluginAsync = async fastify => {
  fastify.withTypeProvider<ZodTypeProvider>().get('/jobs', {
    schema: {
      tags: ['jobs'],
      description: 'Get paginated jobs',
      querystring: paginationQuerySchema,
      response: {
        200: paginatedJobsResponseSchema,
      },
    },
    handler: async (request, _reply) => {
      const { page, pageSize } = request.query;
      const result = await fastify.receiptJobQueueRepository.getJobs(
        page,
        pageSize
      );

      return {
        jobs: result.jobs.map(r => {
          return {
            id: r.id,
            filename: r.filepath,
            fileUrl: `uploads/${r.filepath}`,
            retryCount: r.retry_count,
            processedAt: r.processed_at ?? undefined,
            createdAt: r.created_at ?? undefined,
            status: r.status,
            analysisError: r.analysis_error ?? undefined,
          };
        }),
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
      };
    },
  });

  fastify.withTypeProvider<ZodTypeProvider>().post('/jobs/:jobId/retry', {
    schema: {
      tags: ['jobs'],
      description: 'Retry a failed job by resetting its status to waiting',
      params: z.object({
        jobId: z.coerce.number().describe('ID of the job to retry'),
      }),
      response: {
        200: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { jobId } = request.params;

      try {
        await fastify.receiptJobQueueRepository.retryJob(jobId);
        return { message: 'Job queued for retry' };
      } catch (_error) {
        reply.code(404);
        return { message: 'Job not found or not in failed status' };
      }
    },
  });
};

export default jobRoutes;
