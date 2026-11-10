import type { QueryClient } from '@tanstack/react-query';
import { HeadContent, Scripts, createRootRouteWithContext } from '@tanstack/react-router';
import { NuqsAdapter } from 'nuqs/adapters/tanstack-router';

import ThemeProvider from '@/components/themes/theme-provider';
import { siteConfig } from '@/config/site';
import { currentUserQueryOptions } from '@/features/auth/api/queries';

import appCss from '@/styles/globals.css?url';

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  // Every route gets `context.user` (null when signed out). Cached in the query
  // client, so only the first load and sign in/out hit the server.
  beforeLoad: async ({ context }) => ({
    user: await context.queryClient.query({ ...currentUserQueryOptions(), staleTime: 'static' })
  }),
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: siteConfig.name },
      { name: 'description', content: siteConfig.description },
      { name: 'robots', content: 'noindex, nofollow' }
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
    ]
  }),
  // The shell renders the <html> document around every match, including
  // errors and not-found pages, so they keep the theme and styles.
  shellComponent: RootDocument
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang='th' suppressHydrationWarning data-theme='dms'>
      <head>
        <HeadContent />
      </head>
      <body className='overflow-x-hidden overscroll-none bg-background font-sans antialiased'>
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
          enableColorScheme
        >
          {/* URL state for nuqs hooks (DiceUI's useDataTable). */}
          <NuqsAdapter>{children}</NuqsAdapter>
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}
