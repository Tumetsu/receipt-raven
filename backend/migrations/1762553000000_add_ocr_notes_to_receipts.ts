import type { Kysely } from 'kysely';

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('receipts')
    .addColumn('ocr_notes', 'text', col => col.defaultTo(null))
    .execute();
}
