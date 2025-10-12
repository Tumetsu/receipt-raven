import { type ReactElement, StrictMode } from 'react';
import { routeTree } from './routeTree.gen';
import Container from '@mui/material/Container';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { SnackbarProvider } from 'notistack';

const queryClient = new QueryClient();

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
      <SnackbarProvider maxSnack={3}>
        <QueryClientProvider client={queryClient}>
          <Container>
            <RouterProvider router={router} />
          </Container>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </SnackbarProvider>
    </StrictMode>
  );
}

export default App;
