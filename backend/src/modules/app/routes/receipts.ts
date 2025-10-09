import { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { receiptDtoSchema, receiptItemDtoSchema } from '../dto/receipts';

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

  fastify.get('/receipts/:receiptId/items', {
    schema: {
      tags: ['receipts'],
      description: 'Get receipt items',
      request: {
        params: {
          receiptId: 'number',
        },
      },
      response: {
        200: {
          description: 'List of receipt items in a receipt',
          type: 'array',
          items: receiptItemDtoSchema,
        },
      },
    },
    handler: async (
      request: FastifyRequest<{ Params: { receiptId: string } }>,
      _reply
    ) => {
      const receiptItems = await fastify.receiptRepository.getReceiptItems(
        parseInt(request.params.receiptId, 10)
      );

      return receiptItems.map(r => {
        return {
          id: r.id,
          receiptId: r.receipt_id,
          name: r.name,
          price: r.price,
          totalSum: r.category,
        };
      });
    },
  });
};

export default receiptRoutes;
