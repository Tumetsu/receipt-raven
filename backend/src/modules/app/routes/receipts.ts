import { FastifyPluginAsync, FastifyRequest } from 'fastify';

const receiptRoutes: FastifyPluginAsync = async fastify => {
  fastify.get('/receipts', {
    schema: {
      tags: ['receipts'],
      description: 'Get receipts',
      response: {
        200: {
          description: 'List of receipts',
          type: 'array',
          items: { $ref: 'receipt' },
        },
      },
    },
    handler: async (_request, _reply) => {
      const receipts = await fastify.receiptRepository.getReceipts();

      return receipts.map(r => {
        return {
          id: r.id,
          payee: r.payee,
          expenseAccount: r.expense_account,
          date: r.receipt_date,
          totalSum: r.total_sum,
          status: 'waiting', // TODO: ...
          filepath: r.filepath,
        };
      });
    },
  });

  fastify.post('/receipts/:receiptId', {
    schema: {
      tags: ['receipts'],
      description: 'Save receipt and its items to the ledger',
      params: {
        type: 'object',
        properties: {
          receiptId: { type: 'number' },
        },
        required: ['receiptId'],
      },
      body: { $ref: 'receiptSubmission' },
      response: {
        200: { success: 'boolean' },
        404: { error: 'string' },
      },
    },
    handler: async (
      request: FastifyRequest<{
        Params: { receiptId: string };
        Body: {
          expenseAccount: string;
          payee: string;
          date: string;
          totalSum: number;
          items: Array<{ name: string; price: number; category: string }>;
        };
      }>,
      reply
    ) => {
      const receiptId = parseInt(request.params.receiptId, 10);
      const { payee, date, totalSum, expenseAccount, items } = request.body;

      await fastify.receiptRepository.updateReceipt(receiptId, {
        payee,
        expense_account: expenseAccount,
        receipt_date: date,
        total_sum: totalSum,
      });

      await fastify.receiptRepository.setReceiptItems(receiptId, items);

      // TODO: save to ledger
      // TODO: combine items to single expense categories?

      // Return updated receipt
      const updatedReceipt =
        await fastify.receiptRepository.getReceiptById(receiptId);
      if (!updatedReceipt) {
        return reply.status(404).send({ error: 'Receipt not found' });
      }

      return {
        success: true,
      };
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
          items: { $ref: 'receiptItem' },
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
          category: r.category,
        };
      });
    },
  });
};

export default receiptRoutes;
