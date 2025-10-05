import { receiptJobQueueRepository } from '../../repositories/receipt-job-repository';
import { readFile } from 'fs/promises';
import { analyzeReceipt } from './services/receipt-extraction';
import { FastifyBaseLogger } from 'fastify';
import { receiptRepository } from './repositories/receipt-repository';

let isProcessing = false;
export const processReceiptJobFromQueue = async (
  logger: FastifyBaseLogger
): Promise<void> => {
  if (isProcessing) return; // Prevent concurrent processing
  isProcessing = true;

  const job = await receiptJobQueueRepository.getUnprocessedJob();
  if (!job) {
    isProcessing = false;
    return;
  }

  logger.info(`Analyzing receipt ${job.id}`);

  // Read the saved file as a buffer
  const imageBuffer = await readFile(job.filepath);

  logger.info(`Sending ${job.id} to OpenAI`);
  // Analyze the receipt using OpenAI
  const analysisResult = await analyzeReceipt(imageBuffer);

  logger.info(`Saving ${job.id} to receipt database`);
  // Save analysis results to database
  await receiptRepository.saveReceipt(
    job.id,
    analysisResult.result,
    analysisResult.model
  );
  logger.info(`Saved analyzed results of ${job.id} to receipt database.`);
  await receiptJobQueueRepository.markJobProcessed(job.id);

  isProcessing = false;
};
