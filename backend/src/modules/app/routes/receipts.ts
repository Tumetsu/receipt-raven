import { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { config } from '../../../config/index.js';
import { ReceiptStatus } from '../../../database/schema';

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
          status: r.status,
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
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
          },
          required: ['success'],
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
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

      const receiptToUpdate =
        await fastify.receiptRepository.getReceiptById(receiptId);

      if (receiptToUpdate?.status === ReceiptStatus.APPROVED) {
        return reply.code(400).send({ error: 'Receipt is already approved' });
      }

      await fastify.receiptRepository.updateReceipt(receiptId, {
        payee,
        expense_account: expenseAccount,
        receipt_date: date,
        total_sum: totalSum,
      });

      await fastify.receiptRepository.setReceiptItems(receiptId, items);

      // Submit receipt to ledger via HTTP request to the ledger module
      const ledgerResponse = await fetch(
        `http://localhost:${config.port}/api/ledger/submit-receipt/${receiptId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sourceAccount: expenseAccount,
          }),
        }
      );

      if (!ledgerResponse.ok) {
        const error = await ledgerResponse.json();
        fastify.log.error(
          { error, receiptId },
          'Failed to submit receipt to ledger'
        );
        const statusCode = ledgerResponse.status as 400 | 404 | 500;
        return reply.code(statusCode).send(error);
      }

      await fastify.receiptRepository.updateReceipt(receiptId, {
        status: ReceiptStatus.APPROVED,
      });

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
