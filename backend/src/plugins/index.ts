import { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import compress from '@fastify/compress';
import multipart from '@fastify/multipart';
import staticFiles from '@fastify/static';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod';
import path from 'path';
import { config } from '../config/index.js';
import databasePlugin from './database/database';
import { ledgerPlugin } from './ledger/index.js';
import { cleanupPlugin } from './cleanup.js';
import cleanupSchedulerPlugin from './cleanup-scheduler.js';

export async function registerPlugins(fastify: FastifyInstance): Promise<void> {
  // Set up Zod validators and serializers
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  // Database (must be first so it's available to other plugins/modules)
  await fastify.register(databasePlugin);

  // Cleanup service for uploads directory
  await fastify.register(cleanupPlugin);

  // Cleanup scheduler for uploads directory (depends on cleanupPlugin)
  await fastify.register(cleanupSchedulerPlugin);

  // Swagger/OpenAPI documentation
  await fastify.withTypeProvider<ZodTypeProvider>().register(swagger, {
    openapi: {
      openapi: '3.1.0',
      info: {
        title: 'Receipt Raven API',
        description: 'API for processing and managing receipts',
        version: '1.0.0',
      },
      servers: [
        {
          url: 'http://localhost:3001',
          description: 'Development server',
        },
      ],
      tags: [
        { name: 'health', description: 'Health check endpoints' },
        { name: 'upload', description: 'Receipt upload endpoints' },
        { name: 'ledger', description: 'Ledger integration endpoints' },
      ],
    },
    transform: jsonSchemaTransform,
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });

  // CORS
  await fastify.register(cors, {
    origin: true, // Allow all origins in development
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Security headers
  await fastify.register(helmet, {
    contentSecurityPolicy: false, // Disable CSP for API
  });

  // Compression
  await fastify.register(compress, {
    global: true,
  });

  // Multipart/form-data support
  await fastify.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max file size
      files: 1, // Max 1 file per request
    },
  });

  // Static file serving for uploads
  await fastify.register(staticFiles, {
    root: path.resolve(config.storage.uploadsDir),
    prefix: '/uploads/',
  });

  // Static file serving for frontend (SPA)
  // Register this separately to serve the frontend build
  const frontendPath = path.resolve('./dist/public');
  try {
    // Only register if the frontend build exists
    await import('fs/promises').then(fs => fs.access(frontendPath));
    await fastify.register(staticFiles, {
      root: frontendPath,
      prefix: '/',
      decorateReply: false, // Don't override the reply decorator from uploads static
    });
    fastify.log.info(`Serving frontend from ${frontendPath}`);
  } catch {
    fastify.log.warn(
      `Frontend build not found at ${frontendPath}, skipping frontend static serving`
    );
  }

  // Plug-in for ledger functionalities
  await fastify.register(ledgerPlugin);
}
