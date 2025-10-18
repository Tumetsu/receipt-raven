import orderBy from 'lodash/orderBy.js';
import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { jobSchema } from '../schemas/jobs.js';

const jobRoutes: FastifyPluginAsync = async fastify => {
  fastify.withTypeProvider<ZodTypeProvider>().get('/jobs', {
    schema: {
      tags: ['jobs'],
      description: 'Get jobs',
      response: {
        200: z.array(jobSchema),
      },
    },
    handler: async (_request, _reply) => {
      const jobs = await fastify.receiptJobQueueRepository.getJobs();

      return orderBy(
        jobs.map(r => {
          return {
            id: r.id,
            filename: r.filepath,
            fileUrl: `uploads/${r.filepath}`,
            retryCount: r.retry_count,
            processedAt: r.processed_at?.toISOString(),
            createdAt: r.created_at.toISOString(),
            status: r.status,
            analysisError: r.analysis_error ?? undefined,
          };
        }),
        'createdAt',
        'desc'
      );
    },
  });
};

export default jobRoutes;
