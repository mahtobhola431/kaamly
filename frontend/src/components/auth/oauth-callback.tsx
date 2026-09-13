'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { AuthUser } from '@rokdajob/shared';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { postAuthRoute } from '@/lib/auth/session';
import { sessionStarted, store, tokenRefreshed } from '@/lib/store';
import { routes } from '@/lib/routes';

/**
 * Lands the Google sign-in.
 *
 * The token arrives in the URL fragment, not the query string, so it never reaches a
 * server, an access log or a `Referer` header — and only the browser can read it. The
 * fragment is stripped once read, so it does not sit in history.
 */
export function OAuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  // Effects run twice in development's strict mode; the exchange must not.
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const token = fragment.get('access_token');
    const next = searchParams.get('next');

    if (token) {
      // Clear the fragment before anything can navigate away with it still attached.
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      // Must be in the store before `/auth/me` runs — that is where the client reads it.
      store.dispatch(tokenRefreshed(token));
    }

    void (async () => {
      if (!token) {
        setError('That sign-in link is incomplete. Please try signing in again.');
        return;
      }

      try {
        // The redirect carries a token but no profile.
        const user = await api.get<AuthUser>('/auth/me');
        store.dispatch(sessionStarted({ user, accessToken: token }));
        router.replace(
          fragment.get('needs_role') === '1' ? routes.chooseRole : postAuthRoute(user, next),
        );
        router.refresh();
      } catch {
        setError('We could not finish signing you in. Please try again.');
      }
    })();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="bg-muted rounded-lg border p-5 text-sm">
        <p className="font-medium">Sign-in did not complete</p>
        <p className="text-muted-foreground mt-2">{error}</p>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link href={routes.login}>Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="text-muted-foreground flex items-center gap-2 text-sm">
      <Loader2 className="size-4 animate-spin" aria-hidden />
      Signing you in…
    </div>
  );
}
