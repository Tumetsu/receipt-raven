import { Kysely, sql } from 'kysely';

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('receipt_jobs')
    .addColumn('id', 'integer', col => col.primaryKey())
    .addColumn('filepath', 'text', col => col.notNull())
    .addColumn('created_at', 'text', col =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .addColumn('processed_at', 'text', col => col.defaultTo(null))
    .execute();
}

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('receipt_jobs').execute()
}
