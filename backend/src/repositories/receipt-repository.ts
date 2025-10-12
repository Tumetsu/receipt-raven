import { ReceiptAnalysisResult } from '../types/shared.js';
import { InsertObject, Kysely, Selectable } from 'kysely';
import { Database, ReceiptStatus } from '../database/schema.js';
import { ReceiptJob } from './receipt-job-repository.js';

export type Receipt = Selectable<Database['receipts']>;
export type ReceiptItem = Selectable<Database['receipt_items']>;

/**
 * Repository for receipt data access operations
 */
export interface IReceiptRepository {
  saveReceipt(
    jobId: number,
    analysis: ReceiptAnalysisResult,
    parsedBy?: string
  ): Promise<void>;

  updateReceipt(
    receiptId: number,
    data: Omit<Partial<Receipt>, 'created_at' | 'id' | 'job_id'>
  ): Promise<void>;

  getReceiptById(receiptId: number): Promise<Receipt | undefined>;
  getReceipts(): Promise<(Receipt & Pick<ReceiptJob, 'filepath'>)[]>;

  getReceiptItems(receiptId: number): Promise<ReceiptItem[]>;

  setReceiptItems(
    receiptId: number,
    items: Array<{
      id?: number;
      name: string;
      category: string;
      price: number;
    }>
  ): Promise<void>;
}

/**
 * SQLite implementation of receipt repository
 */
export class SQLiteReceiptRepository implements IReceiptRepository {
  constructor(private db: Kysely<Database>) {}

  async saveReceipt(
    jobId: number,
    analysis: ReceiptAnalysisResult,
    parsedBy?: string
  ): Promise<void> {
    const receipt = await this.db
      .insertInto('receipts')
      .values({
        job_id: jobId,
        payee: analysis.shop,
        receipt_date: analysis.date,
        total_sum: analysis.total,
        parsed_by: parsedBy ?? 'unknown',
        status: ReceiptStatus.UNAPPROVED,
        expense_account: null, // TODO: set this based on AI analysis
      })
      .executeTakeFirstOrThrow();

    if (!receipt.insertId) {
      throw new Error('Insert failed');
    }
    const insertedId = receipt.insertId;

    const items: InsertObject<Database, 'receipt_items'>[] =
      analysis.products.map(p => ({
        receipt_id: Number(insertedId),
        name: p.name,
        category: p.category,
        price: p.price,
        parsed_by: parsedBy ?? 'unknown',
      }));

    await this.db.insertInto('receipt_items').values(items).execute();
  }

  async updateReceipt(
    receiptId: number,
    data: Omit<Partial<Receipt>, 'created_at' | 'id' | 'job_id'>
  ): Promise<void> {
    await this.db
      .updateTable('receipts')
      .set(data)
      .where('id', '=', receiptId)
      .execute();
  }

  async getReceiptById(receiptId: number): Promise<Receipt | undefined> {
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

  async getReceiptItems(receiptId: number): Promise<ReceiptItem[]> {
    return await this.db
      .selectFrom('receipt_items')
      .selectAll()
      .where('receipt_id', '=', receiptId)
      .execute();
  }

  async setReceiptItems(
    receiptId: number,
    items: Array<{
      id?: number;
      name: string;
      category: string;
      price: number;
    }>
  ): Promise<void> {
    await this.db.transaction().execute(async trx => {
      // Fetch existing items for this receipt
      const existingItems = await trx
        .selectFrom('receipt_items')
        .selectAll()
        .where('receipt_id', '=', receiptId)
        .execute();

      const existingItemIds = new Set(existingItems.map(item => item.id));
      const incomingItemIds = new Set(
        items.filter(item => item.id !== undefined).map(item => item.id!)
      );

      // Find items to delete (exist in DB but not in incoming list)
      const itemsToDelete = existingItems.filter(
        item => !incomingItemIds.has(item.id)
      );

      // Delete removed items
      if (itemsToDelete.length > 0) {
        await trx
          .deleteFrom('receipt_items')
          .where(
            'id',
            'in',
            itemsToDelete.map(item => item.id)
          )
          .execute();
      }

      // Process each incoming item
      for (const item of items) {
        if (item.id !== undefined && existingItemIds.has(item.id)) {
          // Update existing item
          await trx
            .updateTable('receipt_items')
            .set({
              name: item.name,
              category: item.category,
              price: item.price,
            })
            .where('id', '=', item.id)
            .execute();
        } else if (item.id === undefined) {
          // Insert new item (no id provided)
          await trx
            .insertInto('receipt_items')
            .values({
              receipt_id: receiptId,
              name: item.name,
              category: item.category,
              price: item.price,
              parsed_by: 'user', // Items edited by user
            })
            .execute();
        }
        // If item.id is provided but doesn't exist in DB, we skip it (invalid id)
      }
    });
  }
}
