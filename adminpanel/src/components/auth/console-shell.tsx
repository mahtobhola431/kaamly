'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthUser } from '@rokdajob/shared';
import { BRAND } from '@rokdajob/shared';
import { Loader2, LogOut, ShieldCheck } from 'lucide-react';
import { ApiClientError, api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { clearSession, getStoredAdmin, isAdmin, updateStoredAdmin } from '@/lib/auth/session';

/**
 * Gate and chrome for every console screen.
 *
 * The stored user is only a cache, so the shell re-checks identity against `/auth/me`
 * before rendering anything: a token that has expired, been revoked, or belongs to a
 * demoted account is caught here rather than surfacing as a wall of failed requests.
 * The API enforces the same rules on every call regardless.
 */
export function ConsoleShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [admin, setAdmin] = useState<AuthUser | undefined>();
  const [state, setState] = useState<'checking' | 'ready'>('checking');

  useEffect(() => {
    let active = true;

    async function verify(): Promise<void> {
      const cached = getStoredAdmin();
      if (!isAdmin(cached)) {
        router.replace('/login');
        return;
      }

      // Show the cached identity immediately, then confirm it.
      if (active) setAdmin(cached);

      try {
        const fresh = await api.get<AuthUser>('/auth/me');
        if (!active) return;

        if (fresh.role !== 'ADMIN') {
          clearSession();
          router.replace('/login');
          return;
        }

        updateStoredAdmin(fresh);
        setAdmin(fresh);
        setState('ready');
      } catch (error) {
        if (!active) return;
        // 401 means the token is gone or expired; anything else is a transport problem
        // and should not throw away a session that may still be valid.
        if (error instanceof ApiClientError && error.status === 401) {
          clearSession();
          router.replace('/login');
          return;
        }
        setState('ready');
      }
    }

    void verify();
    return () => {
      active = false;
    };
  }, [router]);

  async function signOut(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch {
      // The session ends on this device either way.
    }
    clearSession();
    router.replace('/login');
  }

  if (state === 'checking' && !admin) {
    return (
      <div className="text-muted-foreground flex min-h-svh items-center justify-center gap-2 text-sm">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Checking your session…
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="bg-primary text-primary-foreground sticky top-0 z-10">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-3 px-5 py-3">
          <span className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="text-action size-5" aria-hidden />
            {BRAND.name} Admin
          </span>

          <div className="ml-auto flex items-center gap-3">
            {admin ? (
              <span className="hidden text-right text-xs leading-tight sm:block">
                <span className="block font-medium">{admin.name}</span>
                <span className="text-primary-foreground/60">
                  {admin.adminLevel ?? 'ADMIN'} · {admin.email}
                </span>
              </span>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void signOut()}
              className="text-primary-foreground hover:text-primary-foreground hover:bg-white/10"
            >
              <LogOut aria-hidden />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-5 py-6">
        {admin?.adminLevel === 'SUPPORT' ? (
          <Badge tone="pending" className="mb-4">
            Read-only access — approving and rejecting needs MODERATOR or SUPER
          </Badge>
        ) : null}
        {children}
      </main>
    </div>
  );
}
