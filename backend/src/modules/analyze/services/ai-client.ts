import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
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
  submitImage(imageBuffer: Buffer, prompt: string): Promise<OpenAIResponse>;
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

  async submitImage(
    imageBuffer: Buffer,
    prompt: string
  ): Promise<OpenAIResponse> {
    try {
      // Convert buffer to base64
      const base64Image = imageBuffer.toString('base64');
      const dataUrl = `data:image/jpeg;base64,${base64Image}`;

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
 * Claude (Anthropic) implementation of the AI client
 */
export class ClaudeClient implements AiClient {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: config.anthropic.apiKey,
    });
  }

  async submitImage(
    imageBuffer: Buffer,
    prompt: string
  ): Promise<OpenAIResponse> {
    try {
      // Convert buffer to base64
      const base64Image = imageBuffer.toString('base64');

      const response = await this.client.messages.create({
        model: config.anthropic.model,
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: base64Image,
                },
              },
              {
                type: 'text',
                text: prompt + '\n\nRespond with valid JSON only.',
              },
            ],
          },
        ],
      });

      // Extract text content from Claude's response
      const textContent = response.content.find(
        block => block.type === 'text'
      );
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text content in Claude response');
      }

      return {
        content: textContent.text,
        model: response.model,
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
      };
    } catch (error) {
      console.error('Claude API error:', error);
      throw new Error(
        error instanceof Error
          ? `Claude API error: ${error.message}`
          : 'Unknown error occurred while calling Claude API'
      );
    }
  }
}

/**
 * Mock implementation of the API client for development
 */
export class MockAIClient implements AiClient {
  async submitImage(
    _imageBuffer: Buffer,
    _prompt: string
  ): Promise<OpenAIResponse> {
    console.log('Using mock AI client');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Return a mock response
    return {
      content: JSON.stringify({
        payee: 'K-Market',
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
    case 'anthropic':
      return new ClaudeClient();
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
