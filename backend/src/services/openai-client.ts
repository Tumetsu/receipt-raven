import OpenAI from 'openai';
import { config } from '../config/index.js';

export interface OpenAIResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface OpenAIClient {
  submitImage(imageBuffer: Buffer, prompt: string): Promise<OpenAIResponse>;
}

/**
 * Real implementation of the OpenAI API client
 */
export class RealOpenAIClient implements OpenAIClient {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }

  async submitImage(
    imageBuffer: Buffer,
    prompt: string
  ): Promise<OpenAIResponse> {
    try {
      // Convert buffer to base64
      const base64Image = imageBuffer.toString('base64');
      const dataUrl = `data:image/jpeg;base64,${base64Image}`;

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
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
        max_tokens: 1000,
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
 * Mock implementation of the OpenAI API client for development
 */
export class MockOpenAIClient implements OpenAIClient {
  async submitImage(
    _imageBuffer: Buffer,
    _prompt: string
  ): Promise<OpenAIResponse> {
    console.log('Using mock OpenAI client');
    // Return a mock response
    return {
      content: JSON.stringify({
        shop: 'K-Market',
        date: '2025-04-09',
        products: [
          {
            name: 'Banaani',
            category: 'food',
            price: 0.8,
          },
          {
            name: 'T-paita',
            category: 'clothes',
            price: 14.99,
          },
        ],
        total: 15.79,
      }),
      model: 'gpt-4o',
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
export const getOpenAIClient = (): OpenAIClient => {
  return config.openai.useMock
    ? new MockOpenAIClient()
    : new RealOpenAIClient();
};

/**
 * Export a singleton instance for convenience
 */
export const openAIClient = getOpenAIClient();
