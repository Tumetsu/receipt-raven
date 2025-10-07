import { defineConfig } from 'orval';

export default defineConfig({
  'receipt-raven-api': {
    input: {
      target: '../backend/openapi.json',
    },
    output: {
      mode: 'split',
      target: './src/api/generated/api.ts',
      schemas: './src/api/generated/model',
      client: 'react-query',
      httpClient: 'axios',
      baseUrl: 'http://localhost:3001',
    },
  },
});
