import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { QueryClient } from '@tanstack/react-query';
import Container from '@mui/material/Container';
import TopBar from '../common/components/TopBar.tsx';

interface MyRouterContext {
  queryClient: QueryClient;
}

const RootLayout = () => (
  <>
    <TopBar />
    <Container>
      <Outlet />
      <TanStackRouterDevtools />
    </Container>
  </>
);

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootLayout,
});
