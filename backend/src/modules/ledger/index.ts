import { FastifyPluginAsync } from 'fastify';
import { BeancountAdapter } from './services/beancount-adapter.js';
import { config } from '../../config/index.js';
import ledgerRoutes from './routes.js';
import { SQLiteReceiptRepository } from '../../repositories/receipt-repository';

/**
 * Ledger module plugin - handles ledger integration and master data
 */
export const ledgerModule: FastifyPluginAsync = async (fastify, _opts) => {
  // Create ledger service (Beancount adapter)
  const ledgerService = new BeancountAdapter(config.ledger.beancountServiceUrl);
  const receiptRepository = new SQLiteReceiptRepository(fastify.db);

  fastify.decorate('receiptRepository', receiptRepository);
  fastify.decorate('ledgerService', ledgerService);

  // Register routes with /api prefix
  await fastify.register(ledgerRoutes, { prefix: '/api' });

  fastify.log.info('Ledger module registered');
};
