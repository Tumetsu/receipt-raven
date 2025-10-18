import orderBy from 'lodash/orderBy.js';
import { FastifyPluginAsync } from 'fastify';

const jobRoutes: FastifyPluginAsync = async fastify => {
  fastify.get('/jobs', {
    schema: {
      tags: ['jobs'],
      description: 'Get jobs',
      response: {
        200: {
          description: 'List of jobs',
          type: 'array',
          items: { $ref: 'job' },
        },
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
            processedAt: r.processed_at,
            createdAt: r.created_at,
            status: r.status,
            analysisError: r.analysis_error,
          };
        }),
        'createdAt',
        'desc'
      );
    },
  });
};

export default jobRoutes;
