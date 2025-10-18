import { FastifyPluginAsync } from 'fastify';
import { createWriteStream } from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { config } from '../../config';
import {
  uploadSuccessResponseSchema,
  uploadErrorResponseSchema,
} from './schemas.js';

const analyzeRoutes: FastifyPluginAsync = async fastify => {
  fastify.withTypeProvider<ZodTypeProvider>().post('/upload', {
    schema: {
      tags: ['upload'],
      description: 'Upload a receipt image for processing',
      consumes: ['multipart/form-data'],
      response: {
        200: uploadSuccessResponseSchema,
        400: uploadErrorResponseSchema,
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
