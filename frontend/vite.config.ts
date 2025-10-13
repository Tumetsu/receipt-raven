import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import checker from 'vite-plugin-checker';
import tanstackRouter from '@tanstack/router-plugin/vite';

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
    checker({
      typescript: true,
    }),
  ],
  // Only apply build settings when building for production (Docker)
  // For local dev (vite serve), these are omitted for better live reload
  ...(command === 'build' && {
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false,
    },
    base: '/',
  }),
}));
