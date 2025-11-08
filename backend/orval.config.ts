import { defineConfig } from 'orval';

export default defineConfig({
  'beancount-service': {
    input: {
      target: './beancount-openapi.json',
    },
    output: {
      mode: 'split',
      target: './src/plugins/ledger/beancount-adapter/generated/api.ts',
      schemas: './src/plugins/ledger/beancount-adapter/generated/model',
      client: 'axios-functions',
      override: {
        mutator: {
          path: './src/plugins/ledger/beancount-adapter/axios-instance.ts',
          name: 'beancountClient',
        },
      },
      clean: true,
    },
  },
});
