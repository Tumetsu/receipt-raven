import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import checker from 'vite-plugin-checker';
import tanstackRouter from '@tanstack/router-plugin/vite';
import { execSync } from 'child_process';

// Get git commit hash and build timestamp
const getGitCommitHash = () => {
  try {
    return execSync('git rev-parse HEAD').toString().trim().substring(0, 8);
  } catch (error) {
    return 'unknown';
  }
};

const getBuildTimestamp = () => {
  return new Date().toISOString();
};

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
  define: {
    __GIT_COMMIT_HASH__: JSON.stringify(getGitCommitHash()),
    __BUILD_TIMESTAMP__: JSON.stringify(getBuildTimestamp()),
  },
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
  server: {
    host: '0.0.0.0',
    allowedHosts: ['keisaripingviini.home.arpa'],
  },
}));
