'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Query client for the signed-in areas.
 *
 * Created inside state rather than at module scope so each browser session gets its own
 * cache and nothing leaks between requests during server rendering.
 *
 * A contractor watching their own dashboard wants it current, so the cache is short-lived
 * and refetches when the tab regains focus. Public pages do not use this at all — they are
 * server rendered and cached by Next.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            refetchOnWindowFocus: true,
            retry: (failureCount, error) => {
              // Never retry an auth failure — the shell handles signing the user out.
              const status = (error as { status?: number }).status;
              if (status === 401 || status === 403) return false;
              return failureCount < 2;
            },
          },
          mutations: { retry: false },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
