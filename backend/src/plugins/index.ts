import { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import compress from '@fastify/compress';
import multipart from '@fastify/multipart';
import staticFiles from '@fastify/static';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import path from 'path';
import { config } from '../config/index.js';
import databasePlugin from './database.js';

export async function registerPlugins(fastify: FastifyInstance): Promise<void> {
  // Database (must be first so it's available to other plugins/modules)
  await fastify.register(databasePlugin);

  // Swagger/OpenAPI documentation
  await fastify.register(swagger, {
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
}
