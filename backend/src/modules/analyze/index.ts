import { FastifyPluginAsync } from 'fastify';
import { receiptRepository } from './repositories/receipt-repository.js';
import { receiptJobQueueRepository } from '../../repositories/receipt-job-repository';
import { processReceiptJobFromQueue } from './process';

/**
 * Analyze module plugin - handles receipt image analysis and storage
 */
export const analyzeModule: FastifyPluginAsync = async (fastify, _opts) => {
  // Initialize the repository
  receiptRepository.initialize();
  receiptJobQueueRepository.initialize();

  fastify.log.info('Analyze module registered');

  // Start polling jobs to process
  setInterval(() => processReceiptJobFromQueue(fastify.log), 1000);
};
