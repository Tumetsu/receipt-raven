import { ColumnType, Generated } from 'kysely';

/**
 * Combined database schema for all tables
 */
export interface Database {
  receipts: ReceiptsTable;
  receipt_items: ReceiptItemsTable;
  receipt_jobs: ReceiptJobsTable;
}

export interface ReceiptsTable {
  id: Generated<bigint>;
  job_id: bigint;
  shop: string;
  receipt_date: string;
  total_sum: number;
  parsed_by: string;
  created_at: ColumnType<Date, string | undefined, never>;
}

export interface ReceiptItemsTable {
  id: Generated<bigint>;
  receipt_id: bigint;
  name: string;
  category: string;
  price: number;
  parsed_by: string;
  created_at: ColumnType<Date, string | undefined, never>;
}

export interface ReceiptJobsTable {
  id: Generated<bigint>;
  filepath: string;
  created_at: ColumnType<Date, string | undefined, never>;
  updated_at: ColumnType<Date, string | undefined, string>;
  processed_at: ColumnType<Date | undefined, string | undefined, string>;
}
