import type { Metadata } from 'next';
import Link from 'next/link';
import { BRAND } from '@rokdajob/shared';
import { Clock } from 'lucide-react';
import { SignOutButton } from '@/components/auth/sign-out';
import { Button } from '@/components/ui/button';
import { routes } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'Account under review',
  robots: { index: false, follow: false },
};

/**
 * Where a contractor lands between registering and being approved.
 *
 * They hold a valid session at this point — the account simply cannot post jobs or reach
 * workers yet — so this explains the wait rather than bouncing them back to a login form
 * that would accept their password and then refuse them again.
 */
export default function PendingApprovalPage() {
  return (
    <>
      <span className="bg-action-subtle text-action-hover flex size-11 items-center justify-center rounded-md">
        <Clock className="size-5" aria-hidden />
      </span>

      <h1 className="mt-4 text-2xl font-bold">Your account is under review</h1>
      <p className="text-muted-foreground mt-2">
        Contractor accounts are checked by our team before they can post jobs or contact workers.
        This usually takes less than a working day.
      </p>

      <div className="bg-muted mt-6 rounded-lg border p-4 text-sm">
        <p className="font-medium">What happens next</p>
        <ul className="text-muted-foreground mt-2 space-y-1.5">
          <li>We confirm your company details.</li>
          <li>You get an email the moment the account is approved.</li>
          <li>Sign in again and your dashboard will be waiting.</li>
        </ul>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href={routes.home}>Back to site</Link>
        </Button>
        <SignOutButton />
      </div>

      <p className="text-muted-foreground mt-6 text-sm">
        Waiting longer than expected? Email{' '}
        <a href={`mailto:${BRAND.supportEmail}`} className="text-primary font-medium underline">
          {BRAND.supportEmail}
        </a>
        .
      </p>
    </>
  );
}
