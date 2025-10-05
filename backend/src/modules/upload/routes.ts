import { FastifyPluginAsync } from 'fastify';
import { createWriteStream } from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { config } from '../../config';
import { receiptJobQueueRepository } from '../../repositories/receipt-job-repository';

const analyzeRoutes: FastifyPluginAsync = async fastify => {
  fastify.post('/upload', async (request, reply) => {
    const data = await request.file();

    if (!data) {
      return reply.code(400).send({ error: 'No file uploaded' });
    }

    const timestamp = Date.now();
    const filename = `${timestamp}-${data.filename}`;
    const filepath = path.join(config.storage.uploadsDir, filename);

    await pipeline(data.file, createWriteStream(filepath));
    await receiptJobQueueRepository.saveReceiptToBeProcessed(filepath);

    return {
      success: true,
      filename,
    };
  });
};

export default analyzeRoutes;
