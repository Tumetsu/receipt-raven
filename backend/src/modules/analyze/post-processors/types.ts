import { FastifyBaseLogger } from 'fastify';
import { ILedgerService } from '../../../plugins/ledger/ledger-service.js';
import { ReceiptAnalysis } from '../services/receipt-extraction.js';

/**
 * Context provided to post-processors for accessing services
 */
export interface ProcessorContext {
  ledgerService: ILedgerService;
  logger: FastifyBaseLogger;
}

/**
 * Extended receipt analysis with additional fields that can be
 * enriched by post-processors
 */
export interface EnrichedReceiptAnalysis extends ReceiptAnalysis {
  sourceAccount: string | null;
}

/**
 * Interface for receipt post-processors
 *
 * Post-processors run after AI analysis but before saving to database.
 * They can enrich the receipt data with additional information based on
 * rules, external services, or other non-AI logic.
 *
 * To create a new processor:
 * 1. Create a class implementing IReceiptPostProcessor
 * 2. Register it in processor-runner.ts
 */
export interface IReceiptPostProcessor {
  /**
   * Unique name for this processor (used in logging)
   */
  readonly name: string;

  /**
   * Process a receipt and return the enriched result
   *
   * @param receipt The receipt analysis to process
   * @param context Services and utilities available to the processor
   * @returns The enriched receipt analysis
   */
  process(
    receipt: EnrichedReceiptAnalysis,
    context: ProcessorContext
  ): Promise<EnrichedReceiptAnalysis>;
}
