import Fastify from 'fastify';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config';
import { registerPlugins } from '../plugins';
import { uploadModule } from '../modules/upload';
import { analyzeModule } from '../modules/analyze';
import { ledgerModule } from '../modules/ledger';
import { appModule } from '../modules/app';

async function exportOpenAPI() {
  const fastify = Fastify({
    logger: false,
  });

  try {
    // Ensure required directories exist
    await fs.mkdir(config.storage.uploadsDir, { recursive: true });
    const dbDir = path.dirname(config.database.path);
    await fs.mkdir(dbDir, { recursive: true });

    // Register plugins and modules
    await registerPlugins(fastify);
    await fastify.register(uploadModule);
    await fastify.register(analyzeModule);
    await fastify.register(ledgerModule);
    await fastify.register(appModule);

    // Register health check route
    fastify.get('/health', {
      schema: {
        tags: ['health'],
        description: 'Health check endpoint',
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['ok'] },
            },
            required: ['status'],
          },
        },
      },
      handler: async () => {
        return { status: 'ok' };
      },
    });

    // Wait for Fastify to be ready
    await fastify.ready();

    // Get OpenAPI spec
    const openapiSpec = fastify.swagger();

    // Write to file
    const outputPath = path.resolve(__dirname, '../../openapi.json');
    await fs.writeFile(outputPath, JSON.stringify(openapiSpec, null, 2));

    console.log(`OpenAPI spec exported to: ${outputPath}`);
    process.exit(0);
  } catch (err) {
    console.error('Failed to export OpenAPI spec:', err);
    process.exit(1);
  }
}

exportOpenAPI();
