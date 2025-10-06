import { Kysely, Selectable } from 'kysely';
import { Database } from '../database/schema.js';

export type ReceiptJob = Selectable<Database['receipt_jobs']>;

/**
 * Repository for receipt job queue operations
 */
export interface IReceiptJobQueueRepository {
  /**
   * Saves uploaded receipt to the database to wait for processing.
   * @param filepath
   */
  saveReceiptToBeProcessed(filepath: string): Promise<void>;

  getUnprocessedJob(): Promise<ReceiptJob | undefined>;

  markJobProcessed(jobId: bigint): Promise<void>;
}

/**
 * SQLite implementation of receipt repository
 */
export class SQLiteReceiptJoqbQueueRepository
  implements IReceiptJobQueueRepository
{
  constructor(private readonly db: Kysely<Database>) {}

  async saveReceiptToBeProcessed(filepath: string): Promise<void> {
    await this.db
      .insertInto('receipt_jobs')
      .values({ filepath })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async getUnprocessedJob(): Promise<ReceiptJob | undefined> {
    return this.db
      .selectFrom('receipt_jobs')
      .selectAll()
      .where('processed_at', 'is', null)
      .orderBy('created_at', 'asc')
      .executeTakeFirst();
  }

  async markJobProcessed(jobId: bigint): Promise<void> {
    await this.db
      .updateTable('receipt_jobs')
      .set({ processed_at: new Date().toISOString() })
      .where('id', '=', jobId)
      .executeTakeFirstOrThrow();
  }
}
