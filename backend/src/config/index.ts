import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  analyze: {
    maxRetryCountForJob: 3,
    defaultSourceAccount: process.env.DEFAULT_SOURCE_ACCOUNT || null,
  },
  ai: {
    provider: (process.env.AI_PROVIDER || 'openai') as
      | 'openai'
      | 'anthropic'
      | 'mock',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022',
  },
  storage: {
    uploadsDir: process.env.UPLOADS_DIR || './uploads',
  },
  database: {
    path: process.env.DATABASE_PATH || './data/receipts.db',
  },
  ledger: {
    beancountServiceUrl:
      process.env.BEANCOUNT_SERVICE_URL || 'http://localhost:8000',
  },
};
