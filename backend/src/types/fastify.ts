import { Kysely } from 'kysely';
import { Database } from '../database/schema.js';
import { IReceiptRepository } from '../modules/analyze/repositories/receipt-repository.js';
import { IReceiptJobQueueRepository } from '../repositories/receipt-job-repository.js';

/**
 * Extend Fastify types to include our custom decorators
 */
declare module 'fastify' {
  interface FastifyInstance {
    db: Kysely<Database>;
    receiptRepository: IReceiptRepository;
    receiptJobQueueRepository: IReceiptJobQueueRepository;
    uploadReceiptJobQueueRepository: IReceiptJobQueueRepository;
  }
}
