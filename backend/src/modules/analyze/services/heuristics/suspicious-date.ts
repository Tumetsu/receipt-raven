import { DateTime } from 'luxon';
import { HeuristicLevel } from '../../../../domain/types.js';
import { HeuristicResult } from './types.js';

/**
 * Check if receipt date is suspicious (not today or current month/year)
 * Returns issue only if date is suspicious, null otherwise
 */
export function checkSuspiciousDate(dateString: string): HeuristicResult {
  if (!dateString) return null;

  const receiptDate = DateTime.fromISO(dateString);
  const today = DateTime.now();

  if (!receiptDate.isValid) return null;

  // Check if date is in a different year
  if (receiptDate.year !== today.year) {
    return {
      level: HeuristicLevel.SEVERE,
      message:
        receiptDate.year < today.year
          ? `Date is in previous year (${receiptDate.year})`
          : `Date is in future year (${receiptDate.year})`,
    };
  }

  // Check if date is in a different month
  if (receiptDate.month !== today.month) {
    return {
      level: HeuristicLevel.SEVERE,
      message: `Date is from ${receiptDate.toFormat('MMMM')} (current month: ${today.toFormat('MMMM')})`,
    };
  }

  // Check if date is not today (but same month/year)
  if (!receiptDate.hasSame(today, 'day')) {
    return {
      level: HeuristicLevel.WARN,
      message: `Date is ${receiptDate.toFormat('MMMM d')} (today is ${today.toFormat('MMMM d')})`,
    };
  }

  return null; // Date is today - no issue
}
