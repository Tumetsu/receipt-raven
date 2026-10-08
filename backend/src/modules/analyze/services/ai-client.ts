import OpenAI from 'openai';
import { config } from '../../../config/index.js';

export interface OpenAIResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AiClient {
  submitDocument(
    documentBuffer: Buffer,
    prompt: string,
    mimeType: string,
    jsonSchema?: Record<string, unknown>
  ): Promise<OpenAIResponse>;
}

/**
 * Real implementation of the OpenAI API client
 */
export class OpenAIClient implements AiClient {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }

  async submitDocument(
    documentBuffer: Buffer,
    prompt: string,
    mimeType: string
  ): Promise<OpenAIResponse> {
    try {
      // Convert buffer to base64
      const base64Document = documentBuffer.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64Document}`;

      const response = await this.client.chat.completions.create({
        model: config.openai.model,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: dataUrl,
                },
              },
            ],
          },
        ],
        max_completion_tokens: 4000,
      });

      const result = response.choices[0];
      if (!result?.message?.content) {
        throw new Error('No content in OpenAI response');
      }

      return {
        content: result.message.content,
        model: response.model,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error(
        error instanceof Error
          ? `OpenAI API error: ${error.message}`
          : 'Unknown error occurred while calling OpenAI API'
      );
    }
  }
}

/**
 * OpenRouter implementation of the AI client (OpenAI-compatible API)
 */
export class OpenRouterClient implements AiClient {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.openrouter.apiKey,
      baseURL: config.openrouter.baseUrl,
    });
  }

  async submitDocument(
    documentBuffer: Buffer,
    prompt: string,
    mimeType: string,
    jsonSchema?: Record<string, unknown>
  ): Promise<OpenAIResponse> {
    try {
      // Convert buffer to base64
      const base64Document = documentBuffer.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64Document}`;

      // PDFs are sent as file parts, images as image_url parts
      const documentPart: OpenAI.Chat.ChatCompletionContentPart =
        mimeType === 'application/pdf'
          ? {
              type: 'file',
              file: { filename: 'receipt.pdf', file_data: dataUrl },
            }
          : { type: 'image_url', image_url: { url: dataUrl } };

      const response = await this.client.chat.completions.create({
        model: config.openrouter.model,
        max_completion_tokens: 4000,
        response_format: jsonSchema
          ? {
              type: 'json_schema',
              json_schema: {
                name: 'receipt',
                strict: true,
                schema: jsonSchema,
              },
            }
          : { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: [documentPart, { type: 'text', text: prompt }],
          },
        ],
      });

      const result = response.choices[0];
      if (!result?.message?.content) {
        throw new Error('No content in OpenRouter response');
      }

      return {
        content: result.message.content,
        model: response.model,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      console.error('OpenRouter API error:', error);
      throw new Error(
        error instanceof Error
          ? `OpenRouter API error: ${error.message}`
          : 'Unknown error occurred while calling OpenRouter API'
      );
    }
  }
}

/**
 * Mock implementation of the API client for development
 */
export class MockAIClient implements AiClient {
  async submitDocument(
    _documentBuffer: Buffer,
    _prompt: string,
    _mimeType: string
  ): Promise<OpenAIResponse> {
    console.log('Using mock AI client');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Return a mock response
    return {
      content: JSON.stringify({
        payee: 'K-Market',
        description: 'Ruokaa ja paita',
        date: new Date().toISOString().substring(0, 10),
        products: [
          {
            name: 'Banaani',
            expenseAccount: 'Expenses:Consumables:Food',
            price: 0.8,
          },
          {
            name: 'T-paita',
            expenseAccount: 'Expenses:Clothes',
            price: 14.99,
          },
        ],
        total: 15.79,
      }),
      model: 'mock',
      usage: {
        promptTokens: 150,
        completionTokens: 200,
        totalTokens: 350,
      },
    };
  }
}

/**
 * Factory function to get the appropriate client based on environment
 */
export const getAIClient = (): AiClient => {
  switch (config.ai.provider) {
    case 'openrouter':
      return new OpenRouterClient();
    case 'openai':
      return new OpenAIClient();
    case 'mock':
      return new MockAIClient();
    default:
      throw new Error(`Unsupported AI provider: ${config.ai.provider}`);
  }
};

/**
 * Export a singleton instance for convenience
 */
export const aiClient = getAIClient();
