import type { Metadata } from 'next';
import { MyApplications } from '@/components/domain/my-applications';

export const metadata: Metadata = {
  title: 'My applications',
  robots: { index: false, follow: false },
};

/**
 * The worker's own view of the pipeline.
 *
 * The list itself is a client component: it reads `/me/applications`, which needs the
 * access token, and that lives in the browser.
 */
export default function ApplicationsPage() {
  return (
    <>
      <h1 className="text-xl font-bold sm:text-2xl">My applications</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Every job you have applied to, and where it has reached.
      </p>

      <MyApplications />
    </>
  );
}
