import Fastify from 'fastify';
import fs from 'fs/promises';
import path from 'path';
import { config } from './config/index.js';
import { registerPlugins } from './plugins/index.js';
import { analyzeModule } from './modules/analyze/index.js';

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

    // Register plugins
    await registerPlugins(fastify);

    // Register modules
    await fastify.register(analyzeModule);

    // Register health check route
    fastify.get('/health', async () => {
      return { status: 'ok' };
    });

    // Start server
    await fastify.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`Server listening on port ${config.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
