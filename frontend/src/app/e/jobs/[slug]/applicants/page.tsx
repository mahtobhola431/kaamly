import type { Metadata } from 'next';
import { JobApplicants } from '@/components/domain/job-applicants';

export const metadata: Metadata = {
  title: 'Job applicants',
  robots: { index: false, follow: false },
};

/**
 * Applicants on one job.
 *
 * No `generateStaticParams`: these are one contractor's own posts, so there is nothing to
 * prerender and nothing that should be cached between accounts.
 */
export default async function JobApplicantsPage(props: PageProps<'/e/jobs/[slug]/applicants'>) {
  const { slug } = await props.params;
  return <JobApplicants slug={slug} />;
}
