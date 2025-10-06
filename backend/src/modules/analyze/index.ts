import { FastifyPluginAsync } from 'fastify';
import { SQLiteReceiptRepository } from './repositories/receipt-repository.js';
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

  // Start polling jobs to process
  setInterval(
    () =>
      processReceiptJobFromQueue(
        fastify.log,
        receiptRepository,
        receiptJobQueueRepository
      ),
    1000
  );
};
