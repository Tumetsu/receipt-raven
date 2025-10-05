import SQLite from 'better-sqlite3';
import { Kysely, Selectable, SqliteDialect } from 'kysely';
import { ColumnType, Generated } from 'kysely';
import { config } from '../config';

export interface Database {
  receipt_jobs: ReceiptJobsTable;
}

export interface ReceiptJobsTable {
  id: Generated<bigint>;
  filepath: string;

  created_at: ColumnType<Date, string | undefined, never>;
  updated_at: ColumnType<Date, string | undefined, string>;
  processed_at: ColumnType<Date | undefined, string | undefined, string>;
}

export type ReceiptJob = Selectable<ReceiptJobsTable>;

/**
 * Repository for receipt job queue operations
 */
export interface IReceiptJobQueueRepository {
  /**
   * Initialize database schema
   */
  initialize(): void;

  /**
   * Saves uploaded receipt to the database to wait for processing.
   * @param filepath
   */
  saveReceiptToBeProcessed(filepath: string): Promise<void>;

  getUnprocessedJob(): Promise<ReceiptJob | undefined>;

  markJobProcessed(jobId: bigint): Promise<void>;

  /**
   * Close database connection
   */
  close(): void;
}

/**
 * SQLite implementation of receipt repository
 */
export class SQLiteReceiptJoqbQueueRepository
  implements IReceiptJobQueueRepository
{
  private db: Kysely<Database> | null = null;
  private dbPath: string;

  constructor(dbPath: string = config.database.path) {
    this.dbPath = dbPath;
  }

  initialize(): void {
    if (this.db) {
      return;
    }
    // Create database connection when initializing
    const dialect = new SqliteDialect({
      database: new SQLite(this.dbPath),
    });
    this.db = new Kysely<Database>({
      dialect,
    });
  }

  async saveReceiptToBeProcessed(filepath: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    await this.db
      .insertInto('receipt_jobs')
      .values({ filepath })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async getUnprocessedJob(): Promise<ReceiptJob | undefined> {
    return this.db
      ?.selectFrom('receipt_jobs')
      .selectAll()
      .where('processed_at', 'is', null)
      .orderBy('created_at asc')
      .executeTakeFirst();
  }

  async markJobProcessed(jobId: bigint): Promise<void> {
    await this.db
      ?.updateTable('receipt_jobs')
      .set({ processed_at: new Date().toISOString() })
      .where('id', '=', jobId)
      .executeTakeFirstOrThrow();
  }

  close(): void {
    if (this.db) {
      this.db.destroy();
    }
  }
}

export const receiptJobQueueRepository = new SQLiteReceiptJoqbQueueRepository();
