import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { QueryClient } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import TopBar from '../common/components/TopBar.tsx';

interface MyRouterContext {
  queryClient: QueryClient;
}

const RootLayout = () => (
  <Box>
    <TopBar />
    <Box>
      <Outlet />
      <TanStackRouterDevtools />
    </Box>
  </Box>
);

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootLayout,
});
