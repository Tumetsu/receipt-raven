import { IReceiptJobQueueRepository } from '../../plugins/repositories/receipt-job-repository.js';
import { readFile } from 'fs/promises';
import { analyzeReceipt } from './services/receipt-extraction.js';
import { FastifyInstance } from 'fastify';
import { IReceiptRepository } from '../../plugins/repositories/receipt-repository.js';
import path from 'path';
import { config } from '../../config/index.js';
import { runPostProcessors } from './post-processors/index.js';

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
    const documentBuffer = await readFile(
      path.join(config.storage.uploadsDir, job.filepath)
    );

    fastify.log.info(`Sending ${job.id} to AI`);
    // Analyze the receipt using AI
    const analysisResult = await analyzeReceipt(
      documentBuffer,
      fastify.ledgerService,
      job.mime_type
    );

    // Run post-processors to enrich the analysis result
    fastify.log.info(`Running post-processors for ${job.id}`);
    const enrichedResult = await runPostProcessors(analysisResult.result, {
      ledgerService: fastify.ledgerService,
      logger: fastify.log,
    });

    fastify.log.info(`Saving ${job.id} to receipt database`);
    // Save analysis results to database
    await receiptRepository.saveReceipt(
      job.id,
      enrichedResult,
      analysisResult.ocrNotes,
      analysisResult.model
    );
    fastify.log.info(
      `Saved analyzed results of ${job.id} to receipt database.`
    );
    await receiptJobQueueRepository.markJobProcessed(job.id);
  } catch (err) {
    const message = `Photo analysis failed for ${job.id}: ${err}b`;
    fastify.log.error(message);
    await receiptJobQueueRepository.increaseJobRetryCount(job.id, message);
    isProcessing = false;
  }

  isProcessing = false;
};
