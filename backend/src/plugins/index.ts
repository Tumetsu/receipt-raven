import { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import compress from '@fastify/compress';
import multipart from '@fastify/multipart';
import staticFiles from '@fastify/static';
import path from 'path';
import { config } from '../config/index.js';

export async function registerPlugins(fastify: FastifyInstance): Promise<void> {
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
