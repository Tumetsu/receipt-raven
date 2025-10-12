export interface Product {
  name: string;
  expenseAccount: string;
  price: number;
}

export interface ReceiptAnalysisResult {
  payee: string;
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
