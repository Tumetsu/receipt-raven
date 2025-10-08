import { FastifyPluginAsync } from 'fastify';
import { receiptDtoSchema } from '../dto/receipts';

const receiptRoutes: FastifyPluginAsync = async fastify => {
  fastify.get('/receipts', {
    schema: {
      tags: ['receipts'],
      description: 'Get receipts',
      response: {
        200: {
          description: 'List of receipts',
          type: 'array',
          items: receiptDtoSchema,
        },
      },
    },
    handler: async (_request, _reply) => {
      const receipts = await fastify.receiptRepository.getReceipts();

      return receipts.map(r => {
        return {
          id: r.id,
          jobId: r.job_id,
          payeeName: r.shop,
          date: r.receipt_date,
          totalSum: r.total_sum,
          status: 'waiting', // TODO: ...
          filepath: r.filepath,
        };
      });
    },
  });
};

export default receiptRoutes;
