import { Account, Payee, ReceiptTransactionData } from './types';

/**
 * Abstract interface for ledger operations
 * This interface abstracts the underlying ledger system (e.g., Beancount)
 */
export interface ILedgerService {
  /**
   * Get all accounts from the ledger
   * @param type Optional filter by account type (e.g., "Expenses")
   * @returns Array of accounts
   */
  getAccounts(type?: string): Promise<Account[]>;

  /**
   * Get list of payees (shops, vendors) from the ledger
   * @returns Array of payees
   */
  getPayees(): Promise<Payee[]>;

  /**
   * Convert receipt data to a ledger transaction and submit it
   * This is a convenience method that handles the mapping
   * @param receiptData Receipt transaction data
   * @returns Success status and optional transaction ID
   */
  submitReceiptTransaction(receiptData: ReceiptTransactionData): Promise<{
    success: boolean;
    message?: string;
    transactionId?: string;
  }>;
}
