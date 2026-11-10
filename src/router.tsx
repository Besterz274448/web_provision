import { QueryCache, QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';
import { NotFound } from '@/components/not-found';
import { RouteError } from '@/components/route-error';
import { authKeys } from '@/features/auth/api/queries';
import { isSignedOutError } from '@/features/auth/utils';
import { routeTree } from './routeTree.gen';

export function getRouter() {
  // A fresh QueryClient per router (i.e. per server request). A module-level
  // client would share one visitor's cached data with every other visitor.
  const queryClient = new QueryClient({
    queryCache: new QueryCache({
      // The session ended while a page was open. Polling finds out first, so send the person to
      // sign in, come back to the same page afterwards, and drop data they may no longer see.
      onError: (error) => {
        if (!isSignedOutError(error) || typeof document === 'undefined') return;
        queryClient.setQueryData(authKeys.user, null);
        void router
          .navigate({
            to: '/auth/sign-in',
            search: { redirect: router.state.location.href }
          })
          .then(() =>
            queryClient.removeQueries({
              predicate: (query) => query.queryKey[0] !== authKeys.user[0]
            })
          );
      }
    })
  });

  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    context: { queryClient },
    defaultNotFoundComponent: () => <NotFound />,
    defaultErrorComponent: RouteError
  });

  // Provides QueryClientProvider and handles dehydration/hydration + streaming.
  setupRouterSsrQueryIntegration({ router, queryClient });

  return router;
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
