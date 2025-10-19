import {
  Account,
  Payee,
  ReceiptTransactionData,
  ReceiptTransactionItem,
} from './types';
import { ILedgerService } from './ledger-service';
import { AccountsResponseSchema, PayeesResponseSchema } from './schemas';
import _, { groupBy } from 'lodash';

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

  mergeReceiptItemsByExpenseAccount(
    items: ReceiptTransactionData['items']
  ): ReceiptTransactionItem[] {
    return _(groupBy(items, 'expenseAccount'))
      .map((group, expenseAccount) => {
        const totalPrice = group.reduce((sum, item) => sum + item.price, 0);
        const mergedNames = group.map(i => i.name).join(', ');
        return {
          name: mergedNames,
          price: totalPrice,
          expenseAccount,
        };
      })
      .value();
  }

  async submitReceiptTransaction(receiptData: ReceiptTransactionData): Promise<{
    success: boolean;
    status?: number;
    message?: string;
  }> {
    const url = new URL('/transactions/receipt', this.baseUrl);
    const payload = {
      receipt_id: receiptData.receiptId,
      source_account: receiptData.sourceAccount,
      payee: receiptData.payee,
      date: receiptData.date,
      total: receiptData.total,
      items: this.mergeReceiptItemsByExpenseAccount(receiptData.items).map(
        i => ({
          ...i,
          expense_account: i.expenseAccount,
        })
      ),
    };

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
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
