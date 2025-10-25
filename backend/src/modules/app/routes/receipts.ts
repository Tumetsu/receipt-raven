import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
  receiptSchema,
  receiptItemSchema,
  receiptSubmissionSchema,
} from '../schemas/receipts.js';
import { ReceiptStatus } from '../../../domain/types';

// Reusable schemas
const receiptIdParamSchema = z
  .object({
    receiptId: z.coerce.number().describe('ID of the receipt'),
  })
  .describe('Receipt ID parameter');

const errorResponseSchema = z
  .object({
    error: z.string().describe('Error type or title'),
    message: z.string().optional().describe('Detailed error message'),
  })
  .describe('Error response');

const successResponseSchema = z
  .object({
    success: z.boolean().describe('Whether the operation was successful'),
  })
  .describe('Success response');

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

const paginatedReceiptsResponseSchema = z
  .object({
    receipts: z.array(receiptSchema).describe('Array of receipts'),
    total: z.number().describe('Total number of receipts'),
    page: z.number().describe('Current page number'),
    pageSize: z.number().describe('Number of items per page'),
    totalPages: z.number().describe('Total number of pages'),
  })
  .describe('Paginated receipts response');

const receiptRoutes: FastifyPluginAsync = async fastify => {
  fastify.withTypeProvider<ZodTypeProvider>().get('/receipts', {
    schema: {
      tags: ['receipts'],
      description: 'Get paginated receipts',
      querystring: paginationQuerySchema,
      response: {
        200: paginatedReceiptsResponseSchema,
      },
    },
    handler: async (request, _reply) => {
      const { page, pageSize } = request.query;
      const result = await fastify.receiptRepository.getReceipts(
        page,
        pageSize
      );

      return {
        receipts: result.receipts.map(r => {
          return {
            id: r.id,
            description: r.description,
            payee: r.payee,
            sourceAccount: r.source_account,
            date: r.receipt_date,
            totalSum: r.total_sum,
            status: r.status,
            filename: `${r.filepath}`,
            fileUrl: `uploads/${r.filepath}`,
          };
        }),
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
      };
    },
  });

  fastify.withTypeProvider<ZodTypeProvider>().post('/receipts/:receiptId', {
    schema: {
      tags: ['receipts'],
      description: 'Save receipt and its items to the ledger',
      params: receiptIdParamSchema,
      body: receiptSubmissionSchema,
      response: {
        200: successResponseSchema,
        400: errorResponseSchema,
        404: errorResponseSchema,
        500: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const receiptId = request.params.receiptId;
      const { payee, date, totalSum, sourceAccount, items, description } =
        request.body;

      const receiptToUpdate =
        await fastify.receiptRepository.getReceiptById(receiptId);

      if (receiptToUpdate?.status === ReceiptStatus.APPROVED) {
        return reply.code(400).send({ error: 'Receipt is already approved' });
      }

      await fastify.receiptRepository.updateReceipt(receiptId, {
        payee,
        source_account: sourceAccount,
        receipt_date: date,
        total_sum: totalSum,
      });

      await fastify.receiptRepository.setReceiptItems(receiptId, items);

      const result = await fastify.ledgerService.submitReceiptTransaction({
        receiptId,
        payee,
        date,
        sourceAccount,
        description,
        items,
        total: totalSum,
      });

      if (!result.success) {
        return reply.code(400).send({
          error: 'Failed to submit receipt to ledger',
          message: result.message,
        });
      }

      await fastify.receiptRepository.updateReceipt(receiptId, {
        status: ReceiptStatus.APPROVED,
      });

      return {
        success: true,
      };
    },
  });

  fastify
    .withTypeProvider<ZodTypeProvider>()
    .get('/receipts/:receiptId/items', {
      schema: {
        tags: ['receipts'],
        description: 'Get receipt items',
        params: receiptIdParamSchema,
        response: {
          200: z.array(receiptItemSchema),
        },
      },
      handler: async (request, _reply) => {
        const receiptItems = await fastify.receiptRepository.getReceiptItems(
          request.params.receiptId
        );

        return receiptItems.map(r => {
          return {
            id: r.id,
            receiptId: r.receipt_id,
            name: r.name,
            price: r.price,
            expenseAccount: r.expense_account,
          };
        });
      },
    });

  fastify.withTypeProvider<ZodTypeProvider>().delete('/receipts/:receiptId', {
    schema: {
      tags: ['receipts'],
      description: 'Delete receipt',
      params: receiptIdParamSchema,
    },
    handler: async (request, _reply) => {
      await fastify.receiptRepository.deleteReceiptById(
        request.params.receiptId
      );
    },
  });
};

export default receiptRoutes;
