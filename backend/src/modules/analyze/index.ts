import { FastifyPluginAsync } from 'fastify';
import { SQLiteReceiptRepository } from '../../repositories/receipt-repository';
import { SQLiteReceiptJoqbQueueRepository } from '../../repositories/receipt-job-repository.js';
import { processReceiptJobFromQueue } from './process.js';

/**
 * Analyze module plugin - handles receipt image analysis and storage
 */
export const analyzeModule: FastifyPluginAsync = async (fastify, _opts) => {
  // Create repositories with injected database
  const receiptRepository = new SQLiteReceiptRepository(fastify.db);
  const receiptJobQueueRepository = new SQLiteReceiptJoqbQueueRepository(
    fastify.db
  );

  // Store repositories in fastify instance for access in other parts of the module
  fastify.decorate('receiptRepository', receiptRepository);
  fastify.decorate('receiptJobQueueRepository', receiptJobQueueRepository);

  fastify.log.info('Analyze module registered');

  let intervalId: NodeJS.Timeout | null = null;

  // Start polling when server is ready
  fastify.addHook('onReady', async () => {
    fastify.log.info('Starting receipt job processor');
    intervalId = setInterval(async () => {
      try {
        await processReceiptJobFromQueue(
          fastify.log,
          receiptRepository,
          receiptJobQueueRepository
        );
      } catch (error) {
        fastify.log.error({ error }, 'Failed to process receipt job');
      }
    }, 1000);
  });

  // Cleanup on server shutdown
  fastify.addHook('onClose', async () => {
    if (intervalId) {
      fastify.log.info('Stopping receipt job processor');
      clearInterval(intervalId);
      intervalId = null;
    }
  });
};
