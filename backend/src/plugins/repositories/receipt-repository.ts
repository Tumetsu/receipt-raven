import { ReceiptAnalysisResult } from '../../types/shared';
import { InsertObject, Kysely, Selectable } from 'kysely';
import { Database } from '../../database/schema';
import { ReceiptJob } from './receipt-job-repository';
import { config } from '../../config';
import { ReceiptStatus } from '../../domain/types';

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

  deleteReceiptById(receiptId: number): Promise<void>;

  setReceiptItems(
    receiptId: number,
    items: Array<{
      id?: number;
      name: string;
      expenseAccount: string;
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
        payee: analysis.payee,
        receipt_date: analysis.date,
        total_sum: analysis.total,
        parsed_by: parsedBy ?? 'unknown',
        status: ReceiptStatus.UNAPPROVED,
        source_account: config.analyze.defaultSourceAccount,
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
        expense_account: p.expenseAccount,
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

  async deleteReceiptById(receiptId: number): Promise<void> {
    await this.db.deleteFrom('receipts').where('id', '=', receiptId).execute();
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
      expenseAccount: string;
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
              expense_account: item.expenseAccount,
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
              expense_account: item.expenseAccount,
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
