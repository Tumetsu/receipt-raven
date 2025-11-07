import { OcrNotes } from '../../../../domain/types.js';
import { ReceiptAnalysis } from '../receipt-extraction.js';
import { checkSuspiciousDate } from './suspicious-date.js';

/**
 * Run all heuristics on analyzed receipt data
 * Only includes properties for checks that found issues
 */
export function runHeuristics(analysis: ReceiptAnalysis): OcrNotes {
  const notes: OcrNotes = {};

  // Run suspicious date check
  const dateIssue = checkSuspiciousDate(analysis.date);
  if (dateIssue) {
    notes.suspiciousDate = dateIssue;
  }

  // Future heuristics can be added here:
  // const totalIssue = checkSuspiciousTotal(analysis);
  // if (totalIssue) notes.suspiciousTotal = totalIssue;

  return notes;
}
