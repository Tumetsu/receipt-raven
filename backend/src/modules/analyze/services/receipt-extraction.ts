import { z, toJSONSchema } from 'zod';
import { DateTime } from 'luxon';
import { aiClient } from './ai-client.js';
import { ILedgerService } from '../../../plugins/ledger/ledger-service.js';
import { OcrNotes } from '../../../domain/types.js';
import { runHeuristics } from './heuristics/index.js';

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
  ocrNotes: OcrNotes;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

function getPrompt(expenseAccounts: string) {
  return `
Please read the details of the provided receipt and extract the following:
- payee: Name of the shop, restaurant or service provider
- description: Short summary of the receipt content, prefer Finnish if possible
- date: Date of purchase in YYYY-MM-DD format
- products: Each line item with name, expenseAccount, and price in euros
- total: Total sum in euros

For expenseAccount, choose the most suitable from this list (consider both the item and the payee): ${expenseAccounts}

If you cannot find information for a property, return null for it.
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

    const jsonSchema = toJSONSchema(ReceiptAnalysisSchema) as Record<
      string,
      unknown
    >;

    const aiResponse = await aiClient.submitDocument(
      documentBuffer,
      getPrompt(accountsForPrompt),
      mimeType,
      jsonSchema
    );

    const jsonResult = JSON.parse(aiResponse.content);

    // Validate with Zod (applies defaults like date fallback)
    const validatedResult = ReceiptAnalysisSchema.parse(jsonResult);

    // Run heuristics on the validated result
    const ocrNotes = runHeuristics(validatedResult);

    return {
      result: validatedResult,
      ocrNotes,
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
