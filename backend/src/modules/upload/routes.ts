import { FastifyPluginAsync } from 'fastify';
import { createWriteStream } from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { config } from '../../config/index.js';

const analyzeRoutes: FastifyPluginAsync = async fastify => {
  fastify.post('/upload', {
    schema: {
      tags: ['upload'],
      description: 'Upload a receipt image for processing',
      consumes: ['multipart/form-data'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            filename: { type: 'string' },
          },
          required: ['success', 'filename'],
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
          required: ['error'],
        },
      },
    },
    handler: async (request, reply) => {
      const data = await request.file();

      if (!data) {
        return reply.code(400).send({ error: 'No file uploaded' });
      }

      const timestamp = Date.now();
      const filename = `${timestamp}-${data.filename}`;
      const filepath = path.join(config.storage.uploadsDir, filename);

      await pipeline(data.file, createWriteStream(filepath));
      fastify.log.info(`File uploaded successfully: ${filepath}`);
      await fastify.uploadReceiptJobQueueRepository.saveReceiptToBeProcessed(
        filename
      );

      return {
        success: true,
        filename,
      };
    },
  });
};

export default analyzeRoutes;
