import { z } from 'zod';
import { DateTime } from 'luxon';
import { aiClient } from './ai-client.js';
import { ILedgerService } from '../../../plugins/ledger/ledger-service';

const ProductSchema = z.object({
  name: z.string(),
  expenseAccount: z.string(),
  price: z.number(),
});

const ReceiptAnalysisSchema = z.object({
  payee: z.string(),
  description: z.string().nullable(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .catch(DateTime.now().toFormat('yyyy-MM-dd')),
  products: z.array(ProductSchema),
  total: z.number(),
});

export type ReceiptAnalysis = z.infer<typeof ReceiptAnalysisSchema>;
export interface ReceiptAnalysisResponse {
  result: ReceiptAnalysis;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

function getPrompt(expenseAccounts: string) {
  return `
You are tasked with extracting structured information from the given receipt content image and returning it in JSON format. This information will be used for expense tracking and categorization.

Your task is to extract the following information from the receipt:

1. **Payee**: Name of the shop, restaurant, or service provider
2. **Description**: Brief summary of the purchase contents (preferably in Finnish if possible)
3. **Date**: Purchase date in YYYY-MM-DD format
4. **Products**: List of individual items with names, expense accounts, and prices
5. **Total**: Total amount of the receipt

**Important Instructions for Product Analysis**:
- When a receipt shows multiple quantities of the same item with both unit price and total price listed, use the total price for all quantities combined, not the single unit price
- For each product, you must assign an expense account from this predefined list: ${expenseAccounts}

**Analysis Process**:
Before providing your final JSON output, wrap your analysis in <analysis> tags and work through the receipt systematically:

1. Quote the key parts of the receipt content verbatim (merchant name, date, product lines, total)
2. Identify the merchant/payee name from the quoted content
3. Extract the date and convert to YYYY-MM-DD format
4. List each product/item found on the receipt with its price as shown
5. For each item, explicitly state your reasoning for choosing the expense account, considering both the item type and the merchant context
6. Double-check quantity/price calculations - if multiple quantities are shown, confirm you're using the total price for those quantities, not the unit price
7. Calculate or verify the total amount
8. Create a brief description of the purchase contents, preferably in Finnish

It's OK for this section to be quite long if there are many products to analyze.

**Output Format**:
Return your response as pure JSON with no additional text, markdown formatting, or code blocks. Use this structure:
{
    "payee": "merchant name or null",
    "date": "YYYY-MM-DD or null", 
    "description": "brief description or null",
    "products": [
        {
            "name": "product name",
            "expenseAccount": "account from predefined list",
            "price": 0.00
        }
    ],
    "total": 0.00
}

If you cannot find specific information, use null for that property. Ensure all prices are formatted as decimal numbers (e.g., 12.50, not "12.50").
`;
}

/**
 * Analyze a receipt image or PDF using AI provider
 * @param documentBuffer Buffer containing the receipt image or PDF
 * @param ledgerService Ledger service for fetching expense accounts
 * @param mimeType MIME type of the document
 * @returns Validated receipt analysis result
 */
export const analyzeReceipt = async (
  documentBuffer: Buffer,
  ledgerService: ILedgerService,
  mimeType: string
): Promise<ReceiptAnalysisResponse> => {
  try {
    // Fetch expense accounts for AI prompt
    const expenseAccounts = await ledgerService.getAccounts('Expenses');
    const accountsForPrompt = expenseAccounts.map(a => a.name).join(',');

    const aiResponse = await aiClient.submitDocument(
      documentBuffer,
      getPrompt(accountsForPrompt),
      mimeType
    );

    const jsonResult = JSON.parse(aiResponse.content);
    console.log('Raw response from photo analysis:', jsonResult);

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
      throw new Error('Failed to parse AI response as JSON');
    }
    throw error;
  }
};
