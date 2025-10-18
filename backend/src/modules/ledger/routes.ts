import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
  accountsQuerystringSchema,
  accountsApiResponseSchema,
  payeesApiResponseSchema,
  errorResponseSchema,
} from './schemas';

const ledgerRoutes: FastifyPluginAsync = async fastify => {
  /**
   * GET /api/ledger/accounts
   * Get all accounts from the ledger
   * Query params:
   *  - type: optional filter by account type (e.g., "Expenses")
   */
  fastify.withTypeProvider<ZodTypeProvider>().get('/ledger/accounts', {
    schema: {
      tags: ['ledger'],
      description: 'Get all accounts from the ledger',
      querystring: accountsQuerystringSchema,
      response: {
        200: accountsApiResponseSchema,
        500: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        const { type } = request.query;
        const accounts = await fastify.ledgerService.getAccounts(type);
        return accounts.map(a => a.name);
      } catch (error) {
        fastify.log.error({ error }, 'Failed to fetch accounts from ledger');
        return reply.code(500).send({
          error: 'Failed to fetch accounts',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
  });

  /**
   * GET /api/ledger/payees
   * Get list of payees (shops, vendors) from the ledger
   */
  fastify.withTypeProvider<ZodTypeProvider>().get('/ledger/payees', {
    schema: {
      tags: ['ledger'],
      description: 'Get list of payees (shops, vendors) from the ledger',
      response: {
        200: payeesApiResponseSchema,
        500: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        const payees = await fastify.ledgerService.getPayees();
        return { payees: payees.map(p => p.name) };
      } catch (error) {
        fastify.log.error({ error }, 'Failed to fetch payees from ledger');
        return reply.code(500).send({
          error: 'Failed to fetch payees',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
  });
};

export default ledgerRoutes;
