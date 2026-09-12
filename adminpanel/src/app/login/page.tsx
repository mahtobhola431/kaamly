import type { Metadata } from 'next';
import { BRAND } from '@rokdajob/shared';
import { Lock } from 'lucide-react';
import { AdminLoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLoginPage() {
  return (
    <main id="main" className="flex min-h-svh items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2">
          <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-md">
            <Lock className="size-4" aria-hidden />
          </span>
          <div>
            <p className="font-semibold leading-tight">{BRAND.name} Admin</p>
            <p className="text-muted-foreground text-xs">Internal operations console</p>
          </div>
        </div>

        <h1 className="mt-8 text-2xl font-bold">Sign in</h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          Admin accounts only. They are created by the seed script, never by signing up.
        </p>

        <div className="bg-card mt-6 rounded-lg border p-5">
          <AdminLoginForm />
        </div>

        <p className="text-muted-foreground mt-6 text-xs">
          This console is not indexed and is not intended to be reachable from the public internet.
          Every action you take here is recorded against your account.
        </p>
      </div>
    </main>
  );
}
