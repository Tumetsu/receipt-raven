import { DateTime } from 'luxon';

export function formatCurrency(amount: number, currency: string = '€'): string {
  return amount.toFixed(2) + ' ' + currency;
}

export function formatDate(
  dateString: string,
  format = DateTime.DATE_SHORT
): string {
  const date = DateTime.fromISO(dateString);
  if (!date.isValid) {
    return DateTime.fromSQL(dateString).toLocaleString(format);
  }
  return date.toLocaleString(format);
}
