import { z } from 'zod';
import { aiClient } from './ai-client';
import { ReceiptAnalysisResponse } from '../../../types/shared.js';

const ProductSchema = z.object({
  name: z.string(),
  category: z.string(),
  price: z.number(),
});

const ReceiptAnalysisSchema = z.object({
  shop: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  products: z.array(ProductSchema),
  total: z.number(),
});

const RECEIPT_PROMPT = `
Please read the details of the provided receipt and list the following properties in a structured way in a json format:
{
    "shop": "Name of the shop",
    "date": "Date of the purchase in format YYYY-MM-DD",
    "products": [
    {
        "name": "product name",
        "category": "product's type/category for example food, electronics, clothes etc.",
        "price": "price of the product in euros for example 12.50",
    }],
    "total": "Total sum of the receipt in euros for example 12.50"
}

The response should be in json format containing nothing else. If you cannot find the information, just return null for that property.

Here is an example output:
{
    "shop": "K-Market",
    "date": "2025-04-09",
    "products": [
        {
            "name": "Banaani",
            "category": "food",
            "price": 0.80,
        }
        {
            "name": "T-paita",
            "category": "clothes",
            "price": 14.99,
        }
    ],
    "total": 15.79
}

RESPOND ONLY IN JSON *NOT* ANY OTHER TEXT OR MARKDOWN!!!
`;

/**
 * Analyze a receipt image using OpenAI's Vision API
 * @param imageBuffer Buffer containing the receipt image
 * @returns Validated receipt analysis result
 */
export const analyzeReceipt = async (
  imageBuffer: Buffer
): Promise<ReceiptAnalysisResponse> => {
  try {
    // Submit image to OpenAI
    const aiResponse = await aiClient.submitImage(imageBuffer, RECEIPT_PROMPT);

    // Parse the JSON response
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
