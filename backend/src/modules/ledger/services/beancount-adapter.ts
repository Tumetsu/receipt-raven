import {
  Account,
  Category,
  Payee,
  Transaction,
  ReceiptTransactionData,
} from '../types.js';
import { ILedgerService } from './ledger-service.js';
import {
  AccountsResponseSchema,
  CategoriesResponseSchema,
  PayeesResponseSchema,
  TransactionSubmitResponseSchema,
} from '../schemas/index.js';

/**
 * Beancount adapter implementation
 * Communicates with Python FastAPI service that uses beancount SDK
 */
export class BeancountAdapter implements ILedgerService {
  private baseUrl: string;

  constructor(beancountServiceUrl: string) {
    this.baseUrl = beancountServiceUrl;
  }

  async getAccounts(type?: string): Promise<Account[]> {
    const url = new URL('/accounts', this.baseUrl);
    if (type) {
      url.searchParams.set('type', type);
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(
        `Failed to fetch accounts: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const validated = AccountsResponseSchema.parse(data);
    return validated.accounts;
  }

  async getCategories(): Promise<Category[]> {
    const url = new URL('/categories', this.baseUrl);
    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(
        `Failed to fetch categories: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const validated = CategoriesResponseSchema.parse(data);
    return validated.categories;
  }

  async getPayees(): Promise<Payee[]> {
    const url = new URL('/payees', this.baseUrl);
    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(
        `Failed to fetch payees: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const validated = PayeesResponseSchema.parse(data);
    return validated.payees;
  }

  async submitTransaction(transaction: Transaction): Promise<{
    success: boolean;
    message?: string;
    transactionId?: string;
  }> {
    const url = new URL('/transactions', this.baseUrl);
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transaction),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to submit transaction: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const validated = TransactionSubmitResponseSchema.parse(data);
    return validated;
  }

  async submitReceiptTransaction(receiptData: ReceiptTransactionData): Promise<{
    success: boolean;
    message?: string;
    transactionId?: string;
  }> {
    const url = new URL('/transactions/receipt', this.baseUrl);
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...receiptData,
        receiptId: receiptData.receiptId.toString(), // Convert bigint to string for JSON
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to submit receipt transaction: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const validated = TransactionSubmitResponseSchema.parse(data);
    return validated;
  }
}
