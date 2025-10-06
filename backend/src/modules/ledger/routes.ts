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
  }>('/ledger/accounts', async (request, reply) => {
    try {
      const { type } = request.query;
      const accounts = await fastify.ledgerService.getAccounts(type);
      return { accounts };
    } catch (error) {
      fastify.log.error({ error }, 'Failed to fetch accounts from ledger');
      return reply.code(500).send({
        error: 'Failed to fetch accounts',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/ledger/categories
   * Get expense categories from the ledger
   */
  fastify.get('/ledger/categories', async (request, reply) => {
    try {
      const categories = await fastify.ledgerService.getCategories();
      return { categories };
    } catch (error) {
      fastify.log.error({ error }, 'Failed to fetch categories from ledger');
      return reply.code(500).send({
        error: 'Failed to fetch categories',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/ledger/payees
   * Get list of payees (shops, vendors) from the ledger
   */
  fastify.get('/ledger/payees', async (request, reply) => {
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
  });

  /**
   * POST /api/ledger/submit-receipt/:receiptId
   * Submit a receipt to the ledger as a transaction
   * Body should contain source account and any additional transaction details
   */
  fastify.post<{
    Params: { receiptId: string };
    Body: {
      sourceAccount: string;
      currency?: string;
      itemAccountMappings?: Record<string, string>; // Map item names to expense accounts
    };
  }>('/ledger/submit-receipt/:receiptId', async (request, reply) => {
    try {
      const receiptId = BigInt(request.params.receiptId);
      const { sourceAccount, currency, itemAccountMappings } = request.body;

      // Fetch receipt data from database
      const receipt = await fastify.receiptRepository.getReceiptById(receiptId);
      if (!receipt) {
        return reply.code(404).send({
          error: 'Receipt not found',
        });
      }

      const receiptItems =
        await fastify.receiptRepository.getReceiptItems(receiptId);

      // Map items to include expense account mappings if provided
      const items = receiptItems.map(item => ({
        name: item.name,
        category: item.category,
        price: item.price,
        expenseAccount: itemAccountMappings
          ? itemAccountMappings[item.name]
          : undefined,
      }));

      // Submit to ledger service
      const result = await fastify.ledgerService.submitReceiptTransaction({
        receiptId,
        shop: receipt.shop,
        date: receipt.receipt_date,
        items,
        total: receipt.total_sum,
        sourceAccount,
        currency,
      });

      return result;
    } catch (error) {
      fastify.log.error({ error }, 'Failed to submit receipt to ledger');
      return reply.code(500).send({
        error: 'Failed to submit receipt',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/ledger/health
   * Health check for the ledger service connection
   */
  fastify.get('/ledger/health', async (request, reply) => {
    try {
      const isHealthy = await fastify.ledgerService.healthCheck();
      if (isHealthy) {
        return { status: 'ok' };
      } else {
        return reply.code(503).send({ status: 'unavailable' });
      }
    } catch (error) {
      fastify.log.error({ error }, 'Ledger health check failed');
      return reply.code(503).send({ status: 'error' });
    }
  });
};

export default ledgerRoutes;
