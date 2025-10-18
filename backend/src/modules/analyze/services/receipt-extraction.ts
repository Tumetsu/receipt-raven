import { z } from 'zod';
import { DateTime } from 'luxon';
import { aiClient } from './ai-client.js';
import { ReceiptAnalysisResponse } from '../../../types/shared.js';
import { ILedgerService } from '../../../plugins/ledger/ledger-service';

const ProductSchema = z.object({
  name: z.string(),
  expenseAccount: z.string(),
  price: z.number(),
});

const ReceiptAnalysisSchema = z.object({
  payee: z.string(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .catch(DateTime.now().toFormat('yyyy-MM-dd')),
  products: z.array(ProductSchema),
  total: z.number(),
});

function getPrompt(expenseAccounts: string) {
  return `
Please read the details of the provided receipt and list the following properties in a structured way in a json format:
{
    "payee": "Name of the shop, restaurant or service provider in the receipt",
    "date": "Date of the purchase in format YYYY-MM-DD",
    "products": [
    {
        "name": "product name",
        "expenseAccount": "expense account for the product, choose from the following list entry which you think most likely suits the item in question. Take in account also payee when deciding the account: ${expenseAccounts}",
        "price": "price of the product in euros for example 12.50",
    }],
    "total": "Total sum of the receipt in euros for example 12.50"
}

The response should be in json format containing nothing else. If you cannot find the information, just return null for that property.

Here is an example output:
{
    "payee": "K-Market",
    "date": "2025-04-09",
    "products": [
        {
            "name": "Banaani",
            "expenseAccount": "Expenses:Consumables:Food",
            "price": 0.80,
        }
        {
            "name": "T-paita",
            "expenseAccount": "Expenses:Clothes",
            "price": 14.99,
        }
    ],
    "total": 15.79
}

RESPOND ONLY IN JSON *NOT* ANY OTHER TEXT OR MARKDOWN!!!
`;
}

/**
 * Analyze a receipt image using OpenAI's Vision API
 * @param imageBuffer Buffer containing the receipt image
 * @returns Validated receipt analysis result
 */
export const analyzeReceipt = async (
  imageBuffer: Buffer,
  ledgerService: ILedgerService
): Promise<ReceiptAnalysisResponse> => {
  try {
    // Fetch expense accounts for AI prompt
    const expenseAccounts = await ledgerService.getAccounts('Expenses');
    const accountsForPrompt = expenseAccounts.map(a => a.name).join(',');

    // Submit image to OpenAI
    const aiResponse = await aiClient.submitImage(
      imageBuffer,
      getPrompt(accountsForPrompt)
    );

    const jsonResult = JSON.parse(aiResponse.content);
    console.log('OpenAI raw response from photo analysis:', jsonResult);

    // Validate the response against our schema
    const validatedResult = ReceiptAnalysisSchema.parse(jsonResult);

    return {
      result: validatedResult,
      model: aiResponse.model,
      usage: aiResponse.usage,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid receipt analysis result: ${error.message}`);
    }
    if (error instanceof SyntaxError) {
      throw new Error('Failed to parse OpenAI response as JSON');
    }
    throw error;
  }
};
