import { ReceiptAnalysisResult } from '../types/shared';
import { InsertObject, Kysely, Selectable } from 'kysely';
import { Database } from '../database/schema';
import { ReceiptJob } from './receipt-job-repository';

export type Receipt = Selectable<Database['receipts']>;
export type ReceiptItem = Selectable<Database['receipt_items']>;

/**
 * Repository for receipt data access operations
 */
export interface IReceiptRepository {
  saveReceipt(
    jobId: bigint,
    analysis: ReceiptAnalysisResult,
    parsedBy?: string
  ): Promise<void>;

  getReceiptById(receiptId: bigint): Promise<Receipt | undefined>;
  getReceipts(): Promise<(Receipt & Pick<ReceiptJob, 'filepath'>)[]>;

  getReceiptItems(receiptId: bigint): Promise<ReceiptItem[]>;
}

/**
 * SQLite implementation of receipt repository
 */
export class SQLiteReceiptRepository implements IReceiptRepository {
  constructor(private db: Kysely<Database>) {}

  async saveReceipt(
    jobId: bigint,
    analysis: ReceiptAnalysisResult,
    parsedBy?: string
  ): Promise<void> {
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

  async getReceiptById(receiptId: bigint): Promise<Receipt | undefined> {
    return await this.db
      .selectFrom('receipts')
      .selectAll()
      .where('id', '=', receiptId)
      .executeTakeFirst();
  }

  async getReceipts(): Promise<(Receipt & Pick<ReceiptJob, 'filepath'>)[]> {
    return this.db
      .selectFrom('receipts')
      .innerJoin('receipt_jobs as job', 'receipts.job_id', 'job.id')
      .selectAll('receipts')
      .select(['job.filepath'])
      .execute();
  }

  async getReceiptItems(receiptId: bigint): Promise<ReceiptItem[]> {
    return await this.db
      .selectFrom('receipt_items')
      .selectAll()
      .where('receipt_id', '=', receiptId)
      .execute();
  }
}
