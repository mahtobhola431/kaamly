'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { ApiClientError, api } from '@/lib/api/client';
import { clearSession } from '@/lib/auth/session';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { routes } from '@/lib/routes';

/**
 * Sign out.
 *
 * `POST /auth/logout` revokes the refresh token server-side and clears the `rj_rt` cookie.
 * The cookie is httpOnly, so the browser cannot clear it on its own — the request is the
 * only thing that actually ends the session.
 *
 * The user is sent to the login page whichever way the request goes. A failed logout that
 * leaves someone sitting on a signed-in screen is worse than one that navigates away: the
 * refresh token expires on its own, and they can sign out again from anywhere.
 */
function useSignOut() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isCalling, setCalling] = useState(false);

  async function signOut(): Promise<void> {
    setCalling(true);
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // A 401 means the session was already gone, which is the desired end state anyway.
      if (!(error instanceof ApiClientError) || error.status !== 401) {
        toast.error('Could not reach the server', {
          description: 'You have been signed out on this device.',
        });
      }
    } finally {
      // Always drop the local token, even if the server call failed: the session is over
      // as far as this device is concerned.
      clearSession();
      setCalling(false);
      startTransition(() => {
        router.push(routes.login);
        // Drops any cached server-rendered view of the signed-in pages.
        router.refresh();
      });
    }
  }

  return { signOut, pending: isCalling || isPending };
}

export function SignOutButton({ className }: { className?: string }) {
  const { signOut, pending } = useSignOut();

  return (
    <Button variant="ghost" className={className} onClick={() => void signOut()} disabled={pending}>
      <LogOut aria-hidden />
      {pending ? 'Signing out…' : 'Sign out'}
    </Button>
  );
}

export function SignOutMenuItem() {
  const { signOut, pending } = useSignOut();

  return (
    <DropdownMenuItem
      className="text-destructive"
      disabled={pending}
      // Radix closes the menu on select, which would unmount this before the request
      // resolves; keeping it open until the navigation starts avoids a dropped fetch.
      onSelect={(event) => {
        event.preventDefault();
        void signOut();
      }}
    >
      <LogOut aria-hidden />
      {pending ? 'Signing out…' : 'Sign out'}
    </DropdownMenuItem>
  );
}
