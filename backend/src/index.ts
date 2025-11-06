import Fastify from 'fastify';
import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { config } from './config/index.js';
import { registerPlugins } from './plugins/index.js';
import { uploadModule } from './modules/upload/index.js';
import { analyzeModule } from './modules/analyze/index.js';
import { ledgerModule } from './modules/ledger/index.js';
import { appModule } from './modules/app/index.js';

const fastify = Fastify({
  logger: {
    level: config.nodeEnv === 'production' ? 'info' : 'debug',
    ...(config.nodeEnv === 'production'
      ? {} // Raw JSON output in production
      : {
          transport: {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
              colorize: true,
              singleLine: false,
            },
          },
        }),
  },
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
    await fastify.register(uploadModule);
    await fastify.register(analyzeModule);
    await fastify.register(ledgerModule);
    await fastify.register(appModule);

    // Register health check route
    fastify.withTypeProvider<ZodTypeProvider>().get('/health', {
      schema: {
        tags: ['health'],
        description: 'Health check endpoint',
        response: {
          200: z.object({
            status: z.literal('ok'),
          }),
        },
      },
      handler: async () => {
        return { status: 'ok' as const };
      },
    });

    // SPA fallback handler for client-side routing
    // This must be registered AFTER all API routes
    fastify.setNotFoundHandler(async (request, reply) => {
      // If request is for API routes, return 404 JSON
      if (
        request.url.startsWith('/api') ||
        request.url.startsWith('/health') ||
        request.url.startsWith('/docs') ||
        request.url.startsWith('/uploads')
      ) {
        reply.code(404).send({ error: 'Not Found' });
        return;
      }

      // Otherwise, serve index.html for SPA routing
      // This allows TanStack Router to handle the route on the client side
      try {
        return reply.sendFile('index.html', path.resolve('./dist/public'));
      } catch (_err) {
        // If frontend build doesn't exist, return 404
        reply.code(404).send({
          error: 'Frontend not built. Run `npm run build:full` first.',
        });
      }
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
