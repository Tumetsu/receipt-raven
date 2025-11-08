import {
  Account,
  Payee,
  ReceiptTransactionData,
  ReceiptTransactionItem,
} from './types.js';
import { ILedgerService } from './ledger-service.js';
import _, { groupBy } from 'lodash';

// Import generated API client functions
import {
  getAccountsEndpointAccountsGet,
  getPayeesEndpointPayeesGet,
  submitReceiptTransactionEndpointTransactionsReceiptPost,
} from './beancount-adapter/generated/api.js';

/**
 * Beancount adapter implementation using generated API client
 * Communicates with Python FastAPI service that uses beancount SDK
 */
export class BeancountAdapter implements ILedgerService {
  constructor(beancountServiceUrl?: string) {
    // The service URL is configured via environment variable in axios-instance.ts
    // This parameter is kept for backward compatibility but is no longer used
    if (beancountServiceUrl) {
      console.warn(
        'BeancountAdapter: beancountServiceUrl parameter is deprecated. ' +
          'Use BEANCOUNT_SERVICE_URL environment variable instead.'
      );
    }
  }

  async getAccounts(type?: string): Promise<Account[]> {
    const response = await getAccountsEndpointAccountsGet(
      type ? { type } : undefined
    );
    return response.accounts;
  }

  async getPayees(): Promise<Payee[]> {
    const response = await getPayeesEndpointPayeesGet();
    return response.payees;
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
    try {
      const result =
        await submitReceiptTransactionEndpointTransactionsReceiptPost(
          {
            receipt_id: receiptData.receiptId,
            source_account: receiptData.sourceAccount,
            payee: receiptData.payee,
            description: receiptData.description,
            date: receiptData.date,
            total: receiptData.total,
            items: this.mergeReceiptItemsByExpenseAccount(receiptData.items).map(
              i => ({
                ...i,
                expense_account: i.expenseAccount,
              })
            ),
          },
          undefined // no query params
        );

      return {
        success: result.success,
        status: 200, // Successful response from API
        message: result.message || 'Transaction submitted successfully',
      };
    } catch (error) {
      // Error handling is done in axios-instance.ts
      // Re-throw with more context if needed
      if (error instanceof Error) {
        return {
          success: false,
          status: 500,
          message: error.message,
        };
      }

      return {
        success: false,
        status: 500,
        message: 'Unknown error occurred',
      };
    }
  }
}
