import { Kysely, sql } from 'kysely';

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('receipts')
    .addColumn('id', 'integer', col => col.primaryKey())
    .addColumn('job_id', 'integer', col =>
      col.references('receipt_jobs.id').onDelete('cascade').notNull()
    )
    .addColumn('shop', 'text', col => col.notNull())
    .addColumn('receipt_date', 'text', col => col.notNull())
    .addColumn('total_sum', 'decimal', col => col.notNull())
    .addColumn('parsed_by', 'text', col => col.notNull())
    .addColumn('created_at', 'text', col =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .execute();

  await db.schema
    .createIndex('job_id_index')
    .on('receipts')
    .column('job_id')
    .execute()

  await db.schema
    .createTable('receipt_items')
    .addColumn('id', 'integer', col => col.primaryKey())
    .addColumn('receipt_id', 'integer', col =>
      col.references('receipts.id').onDelete('cascade').notNull()
    )
    .addColumn('name', 'text', col => col.notNull())
    .addColumn('category', 'text', col => col.notNull())
    .addColumn('price', 'decimal', col => col.notNull())
    .addColumn('parsed_by', 'text', col => col.notNull())
    .addColumn('created_at', 'text', col =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .execute();

  await db.schema
    .createIndex('receipt_id_index')
    .on('receipt_items')
    .column('receipt_id')
    .execute()
}

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<any>): Promise<void> {
  // down migration code goes here...
  // note: down migrations are optional. you can safely delete this function.
  // For more info, see: https://kysely.dev/docs/migrations
}
