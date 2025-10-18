import { FastifyPluginAsync } from 'fastify';

const ledgerRoutes: FastifyPluginAsync = async fastify => {
  /**
   * GET /api/ledger/accounts
   * Get all accounts from the ledger
   * Query params:
   *  - type: optional filter by account type (e.g., "Expenses")
   */
  fastify.get<{
    Querystring: { type?: string };
  }>('/ledger/accounts', {
    schema: {
      tags: ['ledger'],
      description: 'Get all accounts from the ledger',
      querystring: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            description: 'Filter by account type (e.g., "Expenses")',
          },
        },
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
          required: ['error', 'message'],
        },
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
  fastify.get('/ledger/payees', {
    schema: {
      tags: ['ledger'],
      description: 'Get list of payees (shops, vendors) from the ledger',
      response: {
        200: {
          type: 'object',
          properties: {
            payees: {
              type: 'array',
              items: { type: 'string' },
            },
          },
          required: ['payees'],
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
          required: ['error', 'message'],
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const payees = await fastify.ledgerService.getPayees();
        return { payees };
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
