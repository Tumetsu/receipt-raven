import { config } from '../../../config/index.js';
import { ReceiptAnalysisResult } from '../../../types/shared.js';
import {
  ColumnType,
  Generated,
  InsertObject,
  Kysely,
  Selectable,
  SqliteDialect,
} from 'kysely';
import SQLite from 'better-sqlite3';

export interface Database {
  receipts: ReceiptsTable;
  receipt_items: ReceiptItemsTable;
}

interface ReceiptsTable {
  id: Generated<bigint>;
  job_id: bigint;
  shop: string;
  receipt_date: string;
  total_sum: number;
  parsed_by: string;
  created_at: ColumnType<Date, string | undefined, never>;
}

interface ReceiptItemsTable {
  id: Generated<bigint>;
  receipt_id: bigint;
  name: string;
  category: string;
  price: number;
  parsed_by: string;
  created_at: ColumnType<Date, string | undefined, never>;
}

export type Receipt = Selectable<ReceiptsTable>;
export type ReceiptItem = Selectable<ReceiptItemsTable>;

/**
 * Repository for receipt data access operations
 */
export interface IReceiptRepository {
  /**
   * Initialize database schema
   */
  initialize(): void;

  saveReceipt(
    jobId: bigint,
    analysis: ReceiptAnalysisResult,
    parsedBy?: string
  ): Promise<void>;

  /**
   * Close database connection
   */
  close(): void;
}

/**
 * SQLite implementation of receipt repository
 */
export class SQLiteReceiptRepository implements IReceiptRepository {
  private db: Kysely<Database> | null = null;
  private dbPath: string;

  constructor(dbPath: string = config.database.path) {
    this.dbPath = dbPath;
  }

  initialize(): void {
    // TODO: Use single kysely instance!
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

  async saveReceipt(
    jobId: bigint,
    analysis: ReceiptAnalysisResult,
    parsedBy?: string
  ): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    const receipt = await this.db
      .insertInto('receipts')
      .values({
        job_id: jobId,
        shop: analysis.shop,
        receipt_date: analysis.date,
        total_sum: analysis.total,
        parsed_by: parsedBy ?? 'unknown',
      })
      .executeTakeFirstOrThrow();

    if (!receipt.insertId) {
      throw new Error('Insert failed');
    }
    const insertedId = receipt.insertId;

    const items: InsertObject<Database, 'receipt_items'>[] =
      analysis.products.map(p => ({
        receipt_id: insertedId,
        name: p.name,
        category: p.category,
        price: p.price,
        parsed_by: parsedBy ?? 'unknown',
      }));

    await this.db.insertInto('receipt_items').values(items).execute();
  }

  close(): void {
    if (this.db) {
      this.db.destroy();
    }
  }
}

// Export singleton instance for the analyze module
export const receiptRepository = new SQLiteReceiptRepository();
