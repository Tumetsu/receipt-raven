import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import SQLite from 'better-sqlite3';
import { Kysely, SqliteDialect } from 'kysely';
import { config } from '../config/index.js';
import { Database } from '../database/schema.js';
import '../types/fastify.js';

/**
 * Database plugin that provides a singleton Kysely instance
 * to all modules via fastify.db
 */
const databasePlugin: FastifyPluginAsync = async fastify => {
  const dialect = new SqliteDialect({
    database: new SQLite(config.database.path),
  });

  const db = new Kysely<Database>({
    dialect,
  });

  fastify.decorate('db', db);

  // Clean up on server close
  fastify.addHook('onClose', async () => {
    await db.destroy();
    fastify.log.info('Database connection closed');
  });

  fastify.log.info('Database plugin registered');
};

// Use fastify-plugin to ensure the decorator is available to all plugins
export default fp(databasePlugin);
