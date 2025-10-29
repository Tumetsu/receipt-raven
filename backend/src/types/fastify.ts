import { Kysely } from 'kysely';
import { Database } from '../plugins/database/schema.js';
import { IReceiptRepository } from '../plugins/repositories/receipt-repository.js';
import { IReceiptJobQueueRepository } from '../plugins/repositories/receipt-job-repository.js';
import { ILedgerService } from '../plugins/ledger/ledger-service.js';

/**
 * Extend Fastify types to include our custom decorators
 */
declare module 'fastify' {
  interface FastifyInstance {
    db: Kysely<Database>;
    receiptRepository: IReceiptRepository;
    receiptJobQueueRepository: IReceiptJobQueueRepository;
    uploadReceiptJobQueueRepository: IReceiptJobQueueRepository;
    ledgerService: ILedgerService;
  }
}
