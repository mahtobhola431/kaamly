import type { Metadata } from 'next';
import { Suspense } from 'react';
import { OAuthCallback } from '@/components/auth/oauth-callback';

export const metadata: Metadata = {
  title: 'Signing you in',
  robots: { index: false, follow: false },
};

/**
 * Where Google sends the browser back to.
 *
 * The access token arrives in the URL *fragment*, which the server never receives — so
 * the whole of this page's work has to happen on the client.
 */
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Signing you in…</p>}>
      <OAuthCallback />
    </Suspense>
  );
}
