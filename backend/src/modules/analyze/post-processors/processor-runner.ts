import { ReceiptAnalysis } from '../services/receipt-extraction.js';
import {
  IReceiptPostProcessor,
  EnrichedReceiptAnalysis,
  ProcessorContext,
} from './types.js';
import { PayeeAccountMapperProcessor } from './processors/payee-account-mapper.js';

/**
 * Registry of all post-processors to run after AI analysis.
 * Processors are executed in the order they are registered.
 *
 * To add a new processor:
 * 1. Create a class implementing IReceiptPostProcessor
 * 2. Add an instance to this array
 */
const processors: IReceiptPostProcessor[] = [new PayeeAccountMapperProcessor()];

/**
 * Convert a raw ReceiptAnalysis to an EnrichedReceiptAnalysis
 * by adding default values for enrichment fields
 */
function toEnrichedAnalysis(
  analysis: ReceiptAnalysis
): EnrichedReceiptAnalysis {
  return {
    ...analysis,
    sourceAccount: null,
  };
}

/**
 * Run all registered post-processors on the receipt analysis.
 *
 * Processors are run sequentially in registration order.
 * Each processor receives the result of the previous processor,
 * allowing processors to build on each other's enrichments.
 *
 * @param analysis The raw receipt analysis from AI
 * @param context Services and utilities for processors
 * @returns The enriched receipt analysis
 */
export async function runPostProcessors(
  analysis: ReceiptAnalysis,
  context: ProcessorContext
): Promise<EnrichedReceiptAnalysis> {
  let enriched = toEnrichedAnalysis(analysis);

  for (const processor of processors) {
    try {
      enriched = await processor.process(enriched, context);
    } catch (error) {
      context.logger.error(
        `Post-processor "${processor.name}" failed: ${error}`
      );
      // Continue with other processors even if one fails
    }
  }

  return enriched;
}

/**
 * Get list of registered processor names (for debugging/logging)
 */
export function getRegisteredProcessors(): string[] {
  return processors.map(p => p.name);
}
