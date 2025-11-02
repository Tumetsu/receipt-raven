import { type ReactElement, StrictMode } from 'react';
import { routeTree } from './routeTree.gen';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { SnackbarProvider } from 'notistack';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import { CURRENT_LOCALE } from './common/locale.ts';
import { Settings } from 'luxon';
const queryClient = new QueryClient();

// Set the default locale for Luxon globally
Settings.defaultLocale = CURRENT_LOCALE;

const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function App(): ReactElement {
  return (
    <StrictMode>
      <LocalizationProvider
        dateAdapter={AdapterLuxon}
        adapterLocale={CURRENT_LOCALE}
      >
        <SnackbarProvider maxSnack={3}>
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
            <ReactQueryDevtools initialIsOpen={false} />
          </QueryClientProvider>
        </SnackbarProvider>
      </LocalizationProvider>
    </StrictMode>
  );
}

export default App;
