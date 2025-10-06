import { ReceiptAnalysisResult } from '../../../types/shared.js';
import { InsertObject, Kysely, Selectable } from 'kysely';
import { Database } from '../../../database/schema.js';

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
}
