import React, { type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import { SnackbarProvider } from 'notistack';
import { theme } from '../common/theme.js';
import { CURRENT_LOCALE } from '../common/locale.js';

/**
 * Custom render function that wraps components with all necessary providers
 * for testing: Theme, React Query, Router, Localization, and Snackbar.
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: RenderOptions & {
    // Allow custom query client for test isolation
    queryClient?: QueryClient;
    // Allow custom initial route for router tests
    initialRoute?: string;
  }
) {
  const queryClient =
    options?.queryClient ??
    new QueryClient({
      defaultOptions: {
        queries: {
          // Disable retries in tests for faster failures
          retry: false,
        },
      },
    });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ThemeProvider theme={theme}>
        <LocalizationProvider
          dateAdapter={AdapterLuxon}
          adapterLocale={CURRENT_LOCALE}
        >
          <SnackbarProvider maxSnack={3}>
            <QueryClientProvider client={queryClient}>
              {children}
            </QueryClientProvider>
          </SnackbarProvider>
        </LocalizationProvider>
      </ThemeProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...options }),
    queryClient,
  };
}

// Re-export everything from React Testing Library
// eslint-disable-next-line react-refresh/only-export-components
export * from '@testing-library/react';
export { renderWithProviders as render };
