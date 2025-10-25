import { ColumnType, Generated } from 'kysely';
import { ReceiptJobStatus, ReceiptStatus } from '../../domain/types';

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
  description: string | null;
  total_sum: number;
  parsed_by: string;
  source_account: string | null;
  status: ReceiptStatus;
  created_at: ColumnType<string, string | undefined, never>;
}

export interface ReceiptItemsTable {
  id: Generated<number>;
  receipt_id: number;
  name: string;
  expense_account: string;
  price: number;
  parsed_by: string;
  created_at: ColumnType<string, string | undefined, never>;
}

export interface ReceiptJobsTable {
  id: Generated<number>;
  status: ColumnType<ReceiptJobStatus, undefined, ReceiptJobStatus>;
  retry_count: ColumnType<number, undefined, number>;
  analysis_error: string | null;
  filepath: string;
  mime_type: ColumnType<string, string | undefined, string>;
  created_at: ColumnType<string, string | undefined, never>;
  updated_at: ColumnType<string, string | undefined, string>;
  processed_at: ColumnType<string | undefined, string | undefined, string>;
}
