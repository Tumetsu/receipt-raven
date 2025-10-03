import { FastifyPluginAsync } from 'fastify';
import { createWriteStream } from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';
import { pipeline } from 'stream/promises';
import { config } from '../config/index.js';
import { analyzeReceipt } from '../services/receipt-extraction.js';

const uploadRoutes: FastifyPluginAsync = async fastify => {
  fastify.post('/upload', async (request, reply) => {
    const data = await request.file();

    if (!data) {
      return reply.code(400).send({ error: 'No file uploaded' });
    }

    // Generate a unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}-${data.filename}`;
    const filepath = path.join(config.storage.uploadsDir, filename);

    // Save the file
    await pipeline(data.file, createWriteStream(filepath));

    // Read the saved file as a buffer
    const imageBuffer = await readFile(filepath);

    // Analyze the receipt using OpenAI
    const analysisResult = await analyzeReceipt(imageBuffer);

    return {
      success: true,
      filename,
      originalName: data.filename,
      mimetype: data.mimetype,
      size: data.file.bytesRead,
      analysis: analysisResult,
    };
  });
};

export default uploadRoutes;
