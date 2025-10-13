import { IReceiptJobQueueRepository } from '../../repositories/receipt-job-repository.js';
import { readFile } from 'fs/promises';
import { analyzeReceipt } from './services/receipt-extraction.js';
import { FastifyInstance } from 'fastify';
import { IReceiptRepository } from '../../repositories/receipt-repository.js';
import path from 'path';
import { config } from '../../config/index.js';

let isProcessing = false;
export const processReceiptJobFromQueue = async (
  fastify: FastifyInstance,
  receiptRepository: IReceiptRepository,
  receiptJobQueueRepository: IReceiptJobQueueRepository
): Promise<void> => {
  if (isProcessing) return; // Prevent concurrent processing
  isProcessing = true;

  const job = await receiptJobQueueRepository.getUnprocessedJob();
  if (!job) {
    isProcessing = false;
    return;
  }

  fastify.log.info(`Analyzing receipt ${job.id}`);

  try {
    // Read the saved file as a buffer
    const imageBuffer = await readFile(
      path.join(config.storage.uploadsDir, job.filepath)
    );

    fastify.log.info(`Sending ${job.id} to OpenAI`);
    // Analyze the receipt using OpenAI
    const analysisResult = await analyzeReceipt(
      imageBuffer,
      fastify.ledgerService
    );

    fastify.log.info(`Saving ${job.id} to receipt database`);
    // Save analysis results to database
    await receiptRepository.saveReceipt(
      job.id,
      analysisResult.result,
      analysisResult.model
    );
    fastify.log.info(
      `Saved analyzed results of ${job.id} to receipt database.`
    );
    await receiptJobQueueRepository.markJobProcessed(job.id);
  } catch (err) {
    fastify.log.error(`Photo analysis failed for ${job.id}: ${err}`);
    await receiptJobQueueRepository.increaseJobRetryCount(job.id);
    isProcessing = false;
  }

  isProcessing = false;
};
