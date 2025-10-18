import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  analyze: {
    maxRetryCountForJob: 3,
    defaultSourceAccount: process.env.DEFAULT_SOURCE_ACCOUNT || null,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    useMock: process.env.USE_MOCK_OPENAI === 'true',
    model: process.env.OPENAI_MODEL || 'gpt-5-mini',
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
