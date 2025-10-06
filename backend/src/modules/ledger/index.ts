import { FastifyPluginAsync } from 'fastify';
import { BeancountAdapter } from './services/beancount-adapter.js';
import { config } from '../../config/index.js';
import ledgerRoutes from './routes.js';

/**
 * Ledger module plugin - handles ledger integration and master data
 */
export const ledgerModule: FastifyPluginAsync = async (fastify, _opts) => {
  // Create ledger service (Beancount adapter)
  const ledgerService = new BeancountAdapter(config.ledger.beancountServiceUrl);

  // Store service in fastify instance for access in routes
  fastify.decorate('ledgerService', ledgerService);

  // Register routes with /api prefix
  await fastify.register(ledgerRoutes, { prefix: '/api' });

  // Health check on module registration
  const isHealthy = await ledgerService.healthCheck();
  if (isHealthy) {
    fastify.log.info('Ledger service connection successful');
  } else {
    fastify.log.warn(
      'Ledger service is not available - ledger endpoints will fail'
    );
  }

  fastify.log.info('Ledger module registered');
};
