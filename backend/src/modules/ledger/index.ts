import { FastifyPluginAsync } from 'fastify';
import ledgerRoutes from './routes.js';
import { SQLiteReceiptRepository } from '../../repositories/receipt-repository';
/**
 * Ledger module plugin - handles ledger integration and master data
 */
export const ledgerModule: FastifyPluginAsync = async (fastify, _opts) => {
  const receiptRepository = new SQLiteReceiptRepository(fastify.db);
  fastify.decorate('receiptRepository', receiptRepository);

  // Register routes with /api prefix
  await fastify.register(ledgerRoutes, { prefix: '/api' });

  fastify.log.info('Ledger module registered');
};
