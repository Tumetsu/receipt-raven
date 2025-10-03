import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    useMock: process.env.USE_MOCK_OPENAI === 'true'
  },
  storage: {
    uploadsDir: process.env.UPLOADS_DIR || './uploads'
  },
  database: {
    path: process.env.DATABASE_PATH || './data/receipts.db'
  }
};
