import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App.tsx';
import { theme } from './common/theme.ts';
import { AXIOS_INSTANCE } from './api/axiosInstance';
import config from './config';

// Configure axios baseURL from environment variables
AXIOS_INSTANCE.defaults.baseURL = config.api.baseUrl;

// Register service worker for Web Share Target
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(registration => {
        console.log('✅ Service Worker registered successfully');
        console.log('SW scope:', registration.scope);
        console.log('SW active:', registration.active);
        console.log('SW installing:', registration.installing);
        console.log('SW waiting:', registration.waiting);

        // Listen for state changes
        if (registration.installing) {
          registration.installing.addEventListener('statechange', () => {
            console.log('SW state changed to:', registration.installing?.state);
          });
        }

        // Check controller
        console.log('SW controller:', navigator.serviceWorker.controller);
      })
      .catch(error => {
        console.error('❌ Service Worker registration failed:', error);
        if (error && typeof error === 'object') {
          console.error('Error details:', {
            message: error.message || 'No message',
            name: error.name || 'No name',
          });
        }
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>
);
