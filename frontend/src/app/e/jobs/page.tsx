import type { Metadata } from 'next';
import { EmployerJobsList } from '@/components/domain/employer-jobs-list';

export const metadata: Metadata = {
  title: 'Jobs',
  robots: { index: false, follow: false },
};

/**
 * A thin server shell: the list reads the contractor's own jobs, drafts included, and the
 * token that authorises that read lives in the browser.
 */
export default function EmployerJobsPage() {
  return <EmployerJobsList />;
}
