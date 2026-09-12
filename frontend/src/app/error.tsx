'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { routes } from '@/lib/routes';

/**
 * Route-level error boundary. Shows the digest rather than the raw message so nothing
 * internal leaks, and always offers a way out of the dead end.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Replaced by the error reporter once one is configured.
    console.error(error);
  }, [error]);

  return (
    <div className="container-marketing flex min-h-[60svh] flex-col items-center justify-center py-16 text-center">
      <span className="bg-destructive-subtle text-destructive flex size-14 items-center justify-center rounded-full">
        <AlertTriangle className="size-6" aria-hidden />
      </span>

      <h1 className="mt-5 text-2xl font-bold">Something went wrong</h1>
      <p className="text-muted-foreground mt-2 max-w-md">
        This page failed to load. Trying again usually works — if it does not, the rest of the site
        is still fine.
      </p>

      {error.digest ? (
        <p className="text-muted-foreground mt-3 font-mono text-xs">Reference: {error.digest}</p>
      ) : null}

      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Button variant="action" onClick={reset}>
          <RotateCw aria-hidden />
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href={routes.home}>Go home</Link>
        </Button>
      </div>
    </div>
  );
}
