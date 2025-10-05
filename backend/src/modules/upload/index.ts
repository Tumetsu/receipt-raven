import { FastifyPluginAsync } from 'fastify';
import { receiptJobQueueRepository } from '../../repositories/receipt-job-repository';
import uploadRoutes from './routes';

/**
 * Upload module plugin - handles receipt image upload and storage
 */
export const uploadModule: FastifyPluginAsync = async (fastify, _opts) => {
  // Initialize the repository
  receiptJobQueueRepository.initialize();

  // Register routes with /api prefix
  await fastify.register(uploadRoutes, { prefix: '/api' });

  fastify.log.info('Upload module registered');
};
