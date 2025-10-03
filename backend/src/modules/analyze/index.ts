import { FastifyPluginAsync } from 'fastify';
import { receiptRepository } from './repositories/receipt-repository.js';
import analyzeRoutes from './routes.js';

/**
 * Analyze module plugin - handles receipt image analysis and storage
 */
export const analyzeModule: FastifyPluginAsync = async (fastify, _opts) => {
  // Initialize the repository
  receiptRepository.initialize();

  // Register routes with /api prefix
  await fastify.register(analyzeRoutes, { prefix: '/api' });

  fastify.log.info('Analyze module registered');
};
