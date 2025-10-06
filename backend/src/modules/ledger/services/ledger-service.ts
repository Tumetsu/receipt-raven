import {
  Account,
  Category,
  Payee,
  Transaction,
  ReceiptTransactionData,
} from '../types.js';

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
   * Get expense categories from the ledger
   * These can be derived from expense account names or commodities
   * @returns Array of categories
   */
  getCategories(): Promise<Category[]>;

  /**
   * Get list of payees (shops, vendors) from the ledger
   * @returns Array of payees
   */
  getPayees(): Promise<Payee[]>;

  /**
   * Submit a transaction to the ledger
   * @param transaction Transaction to submit
   * @returns Success status and optional transaction ID
   */
  submitTransaction(transaction: Transaction): Promise<{
    success: boolean;
    message?: string;
    transactionId?: string;
  }>;

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

  /**
   * Health check for the ledger service
   * @returns True if service is available
   */
  healthCheck(): Promise<boolean>;
}
