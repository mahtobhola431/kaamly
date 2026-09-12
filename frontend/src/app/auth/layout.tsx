import Link from 'next/link';
import { BRAND } from '@rokdajob/shared';
import { ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/layout/logo';
import { Toaster } from '@/components/ui/sonner';
import { routes } from '@/lib/routes';

/**
 * Split auth layout: the form on the left where the thumb is, a short trust panel on the
 * right that collapses away on mobile so the form is the only thing on a small screen.
 */
export default function AuthLayout({ children }: LayoutProps<'/auth'>) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col px-5 py-8 sm:px-10">
        <Logo />
        <main
          id="main"
          className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10"
        >
          {children}
        </main>
        <footer className="text-muted-foreground text-xs">
          By continuing you agree to our{' '}
          <Link href={routes.terms} className="underline">
            terms
          </Link>{' '}
          and{' '}
          <Link href={routes.privacy} className="underline">
            privacy policy
          </Link>
          .
        </footer>
      </div>

      <aside className="bg-primary text-primary-foreground hidden flex-col justify-center px-12 lg:flex">
        <p className="text-action text-xs font-semibold uppercase tracking-widest">{BRAND.name}</p>
        <h2 className="mt-3 text-3xl font-bold leading-tight">{BRAND.tagline}</h2>
        <p className="mt-4 max-w-md text-white/70">{BRAND.subline}</p>

        <ul className="mt-8 space-y-4">
          {[
            'Workers: free forever, no fee to find work.',
            'Employers: post a job in two minutes and see applications the same day.',
            'Both: email-verified accounts and ratings after every job.',
          ].map((line) => (
            <li key={line} className="flex items-start gap-3 text-sm text-white/80">
              <ShieldCheck className="text-action mt-0.5 size-4 shrink-0" aria-hidden />
              {line}
            </li>
          ))}
        </ul>
      </aside>

      <Toaster />
    </div>
  );
}
