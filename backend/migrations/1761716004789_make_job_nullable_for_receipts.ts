import { Kysely, sql } from 'kysely';

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
  // Disable foreign key constraints temporarily
  await sql`PRAGMA foreign_keys = OFF`.execute(db);
  try {
    // Create new table with explicit schema (job_id without NOT NULL)
    await db.schema
      .createTable('receipts_new')
      .addColumn('id', 'integer', col => col.primaryKey())
      .addColumn('job_id', 'integer', col => {
        col.references('receipt_jobs.id').onDelete('cascade');
        return col.defaultTo(null);
      })
      .addColumn('payee', 'text')
      .addColumn('source_account', 'text')
      .addColumn('receipt_date', 'text', col => col.notNull())
      .addColumn('total_sum', 'decimal', col => col.notNull())
      .addColumn('status', 'text', col => col.defaultTo('unapproved'))
      .addColumn('description', 'text', col => col.defaultTo(null))
      .addColumn('parsed_by', 'text', col => col.notNull())
      .addColumn('created_at', 'text', col =>
        col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
      )
      .execute();

    // Copy data
    await sql`INSERT INTO receipts_new 
      SELECT 
        id,
        job_id,
        payee,
        source_account,
        receipt_date,
        total_sum,
        status,
        description,
        parsed_by,
        created_at
      FROM receipts`.execute(db);

    // Drop old table
    await db.schema.dropTable('receipts').execute();

    // Rename
    await sql`ALTER TABLE receipts_new RENAME TO receipts`.execute(db);

    // Recreate indexes
    await db.schema
      .createIndex('job_id_index')
      .on('receipts')
      .column('job_id')
      .execute();
  } finally {
    // Re-enable foreign key constraints
    await sql`PRAGMA foreign_keys = ON`.execute(db);
  }
}

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<any>): Promise<void> {
  // down migration code goes here...
  // note: down migrations are optional. you can safely delete this function.
  // For more info, see: https://kysely.dev/docs/migrations
}
