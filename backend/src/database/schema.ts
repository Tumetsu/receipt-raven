import { ColumnType, Generated } from 'kysely';

export enum ReceiptStatus {
  APPROVED = 'approved',
  UNAPPROVED = 'unapproved',
}

export enum ReceiptJobStatus {
  WAITING = 'waiting',
  PROCESSED = 'processed',
  FAILED = 'failed',
}
/**
 * Combined database schema for all tables
 */
export interface Database {
  receipts: ReceiptsTable;
  receipt_items: ReceiptItemsTable;
  receipt_jobs: ReceiptJobsTable;
}

export interface ReceiptsTable {
  id: Generated<number>;
  job_id: number;
  payee: string;
  receipt_date: string;
  total_sum: number;
  parsed_by: string;
  expense_account: string | null;
  status: ReceiptStatus;
  created_at: ColumnType<Date, string | undefined, never>;
}

export interface ReceiptItemsTable {
  id: Generated<number>;
  receipt_id: number;
  name: string;
  category: string;
  price: number;
  parsed_by: string;
  created_at: ColumnType<Date, string | undefined, never>;
}

export interface ReceiptJobsTable {
  id: Generated<number>;
  status: ColumnType<ReceiptJobStatus, undefined, ReceiptJobStatus>;
  retry_count: ColumnType<number, undefined, number>;
  filepath: string;
  created_at: ColumnType<Date, string | undefined, never>;
  updated_at: ColumnType<Date, string | undefined, string>;
  processed_at: ColumnType<Date | undefined, string | undefined, string>;
}
