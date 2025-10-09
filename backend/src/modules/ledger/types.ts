/**
 * Ledger domain types - abstracted from specific ledger implementation
 */

/**
 * Account in the ledger (e.g., Assets:Bank:Checking, Expenses:Groceries)
 */
export interface Account {
  name: string; // Full account name (e.g., "Expenses:Food:Groceries")
  type: AccountType; // Account type classification
  displayName?: string; // Optional human-readable name
}

/**
 * Account type classification
 */
export enum AccountType {
  Assets = 'Assets',
  Liabilities = 'Liabilities',
  Equity = 'Equity',
  Income = 'Income',
  Expenses = 'Expenses',
}

/**
 * Category for expense classification
 */
export interface Category {
  name: string; // Category name
  accountMapping?: string; // Optional associated expense account
}

/**
 * Payee (e.g., shop, vendor)
 */
export interface Payee {
  name: string;
}

/**
 * Transaction line item (posting in beancount terms)
 */
export interface TransactionPosting {
  account: string; // Account name
  amount: number; // Amount (positive or negative)
  currency?: string; // Currency code (default: EUR)
  comment?: string; // Optional comment for this posting
}

/**
 * Complete transaction to be submitted to ledger
 */
export interface Transaction {
  date: string; // ISO date format YYYY-MM-DD
  payee: string; // Payee/shop name
  narration: string; // Transaction description
  postings: TransactionPosting[]; // Array of postings (must balance)
  tags?: string[]; // Optional tags
  links?: string[]; // Optional links
  metadata?: Record<string, string>; // Optional metadata key-value pairs
}

/**
 * Receipt-specific transaction data for convenience
 */
export interface ReceiptTransactionData {
  receiptId: number; // Receipt ID from database
  shop: string; // Shop name
  date: string; // Receipt date
  items: ReceiptTransactionItem[]; // Receipt items
  total: number; // Total amount
  sourceAccount: string; // Source account (e.g., Assets:Bank:Checking)
  currency?: string; // Currency (default: EUR)
}

/**
 * Individual item in a receipt transaction
 */
export interface ReceiptTransactionItem {
  name: string; // Item name
  category: string; // Item category
  price: number; // Item price
  expenseAccount?: string; // Mapped expense account (optional)
}
