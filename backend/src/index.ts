import Fastify from 'fastify';
import fs from 'fs/promises';
import path from 'path';
import { config } from './config/index.js';
import { registerPlugins } from './plugins/index.js';
import uploadRoutes from './routes/upload.js';
import { receiptDatabase } from './services/database.js';

const fastify = Fastify({
  logger: true,
});

const start = async () => {
  try {
    // Ensure uploads directory exists
    await fs.mkdir(config.storage.uploadsDir, { recursive: true });

    // Ensure database directory exists
    const dbDir = path.dirname(config.database.path);
    await fs.mkdir(dbDir, { recursive: true });

    // Initialize database
    receiptDatabase.initialize();

    // Register plugins
    await registerPlugins(fastify);

    // Register routes
    fastify.get('/health', async () => {
      return { status: 'ok' };
    });

    await fastify.register(uploadRoutes, { prefix: '/api' });

    // Start server
    await fastify.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`Server listening on port ${config.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
