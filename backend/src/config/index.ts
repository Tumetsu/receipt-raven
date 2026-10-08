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
      | 'openrouter'
      | 'mock',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  },
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY || '',
    model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
    baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  },
  storage: {
    uploadsDir: process.env.UPLOADS_DIR || './uploads',
    maxUploadsDiskSize: process.env.MAX_UPLOADS_DISK_SIZE || null, // e.g., "1GB", "500MB"
    cleanupIntervalHours: parseInt(
      process.env.CLEANUP_INTERVAL_HOURS || '24',
      10
    ), // Default: run daily
  },
  database: {
    path: process.env.DATABASE_PATH || './data/receipts.db',
  },
  ledger: {
    beancountServiceUrl:
      process.env.BEANCOUNT_SERVICE_URL || 'http://localhost:8000',
  },
};
