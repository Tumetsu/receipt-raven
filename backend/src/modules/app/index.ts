import { FastifyPluginAsync } from 'fastify';
import { SQLiteReceiptJoqbQueueRepository } from '../../plugins/repositories/receipt-job-repository.js';
import { SQLiteReceiptRepository } from '../../plugins/repositories/receipt-repository.js';
import receiptRoutes from './routes/receipts.js';
import jobRoutes from './routes/job';

/**
 * Frontend app module plugin - handles frontend UI endpoints
 */
export const appModule: FastifyPluginAsync = async (fastify, _opts) => {
  // Create repositories with injected database
  const receiptRepository = new SQLiteReceiptRepository(fastify.db);
  const receiptJobQueueRepository = new SQLiteReceiptJoqbQueueRepository(
    fastify.db
  );

  // Store repositories in fastify instance for access in other parts of the module
  fastify.decorate('receiptRepository', receiptRepository);
  fastify.decorate('receiptJobQueueRepository', receiptJobQueueRepository);

  // Register routes with /api prefix
  await fastify.register(receiptRoutes, { prefix: '/api/' });
  await fastify.register(jobRoutes, { prefix: '/api/' });

  fastify.log.info('App module registered');
};
