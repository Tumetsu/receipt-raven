import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { BeancountAdapter } from './beancount-adapter';
import { config } from '../../config';

const ledgerService: FastifyPluginAsync = async (fastify, _opts) => {
  const ledgerService = new BeancountAdapter(config.ledger.beancountServiceUrl);
  fastify.decorate('ledgerService', ledgerService);
};

// Wrap with fastify-plugin to break encapsulation
export const ledgerPlugin = fp(ledgerService, {
  name: 'ledgerService',
});
