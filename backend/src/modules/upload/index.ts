import { FastifyPluginAsync } from 'fastify';
import { SQLiteReceiptJoqbQueueRepository } from '../../plugins/repositories/receipt-job-repository.js';
import uploadRoutes from './routes.js';

/**
 * Upload module plugin - handles receipt image upload and storage
 */
export const uploadModule: FastifyPluginAsync = async (fastify, _opts) => {
  // Create repository with injected database
  const receiptJobQueueRepository = new SQLiteReceiptJoqbQueueRepository(
    fastify.db
  );

  // Store repository in fastify instance for access in routes
  fastify.decorate(
    'uploadReceiptJobQueueRepository',
    receiptJobQueueRepository
  );

  // Register routes with /api prefix
  await fastify.register(uploadRoutes, { prefix: '/api' });

  fastify.log.info('Upload module registered');
};
