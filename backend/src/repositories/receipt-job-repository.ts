import { Kysely, Selectable } from 'kysely';
import { Database, ReceiptJobStatus } from '../database/schema.js';
import { config } from '../config/index.js';

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

  markJobProcessed(jobId: number): Promise<void>;

  increaseJobRetryCount(jobId: number): Promise<void>;
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
      .where('status', '=', ReceiptJobStatus.WAITING)
      .orderBy('created_at', 'asc')
      .executeTakeFirst();
  }

  async increaseJobRetryCount(jobId: number): Promise<void> {
    const job = await this.db
      .selectFrom('receipt_jobs')
      .select('retry_count')
      .where('id', '=', jobId)
      .executeTakeFirstOrThrow();

    const currentRetryCount = job.retry_count + 1;
    await this.db
      .updateTable('receipt_jobs')
      .set({
        retry_count: currentRetryCount,
        status:
          currentRetryCount < config.analyze.maxRetryCountForJob
            ? ReceiptJobStatus.WAITING
            : ReceiptJobStatus.FAILED,
      })
      .where('id', '=', jobId)
      .execute();
  }

  async markJobProcessed(jobId: number): Promise<void> {
    await this.db
      .updateTable('receipt_jobs')
      .set({
        processed_at: new Date().toISOString(),
        status: ReceiptJobStatus.PROCESSED,
      })
      .where('id', '=', jobId)
      .executeTakeFirstOrThrow();
  }
}
