import {
  Account,
  Payee,
  ReceiptTransactionData,
} from '../../modules/ledger/types.js';
import { ILedgerService } from './ledger-service.js';
import {
  AccountsResponseSchema,
  PayeesResponseSchema,
} from '../../modules/ledger/schemas/index.js';

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

  async submitReceiptTransaction(receiptData: ReceiptTransactionData): Promise<{
    success: boolean;
    status?: number;
    message?: string;
  }> {
    const url = new URL('/transactions/receipt', this.baseUrl);
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...receiptData,
      }),
    });

    const responseData = (await response.json()) as {
      success: boolean;
      message?: string;
    };

    if (!response.ok || !responseData.success) {
      return {
        success: false,
        status: response.status,
        message: responseData.message,
      };
    }

    return {
      success: true,
      status: response.status,
      message: response.statusText,
    };
  }
}
