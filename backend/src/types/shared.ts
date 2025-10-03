/**
 * Shared interfaces used by both frontend and backend
 */

export interface Product {
  name: string;
  category: string;
  price: number;
}

export interface ReceiptAnalysisResult {
  shop: string;
  date: string;
  products: Product[];
  total: number;
}

export interface ReceiptAnalysisResponse {
  result: ReceiptAnalysisResult;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
