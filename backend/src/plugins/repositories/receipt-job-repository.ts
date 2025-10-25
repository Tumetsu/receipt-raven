import { Kysely, Selectable } from 'kysely';
import { Database } from '../database/schema';
import { config } from '../../config';
import { ReceiptJobStatus } from '../../domain/types';

export type ReceiptJob = Selectable<Database['receipt_jobs']>;

export interface PaginatedJobs {
  jobs: ReceiptJob[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

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

  getJobs(page?: number, pageSize?: number): Promise<PaginatedJobs>;

  markJobProcessed(jobId: number): Promise<void>;

  increaseJobRetryCount(jobId: number, error?: string): Promise<void>;
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

  async getJobs(
    page: number = 1,
    pageSize: number = 30
  ): Promise<PaginatedJobs> {
    // Get total count
    const countResult = await this.db
      .selectFrom('receipt_jobs')
      .select(({ fn }) => fn.countAll<number>().as('count'))
      .executeTakeFirstOrThrow();

    const total = Number(countResult.count);
    const totalPages = Math.ceil(total / pageSize);
    const offset = (page - 1) * pageSize;

    // Get paginated jobs
    const jobs = await this.db
      .selectFrom('receipt_jobs')
      .selectAll()
      .orderBy('created_at', 'desc')
      .limit(pageSize)
      .offset(offset)
      .execute();

    return {
      jobs,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async increaseJobRetryCount(jobId: number, error?: string): Promise<void> {
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
        analysis_error: error,
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
        analysis_error: null,
      })
      .where('id', '=', jobId)
      .executeTakeFirstOrThrow();
  }
}
