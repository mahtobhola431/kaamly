import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, UserCheck } from 'lucide-react';
import { ApplicationPipeline } from '@/components/domain/application-pipeline';
import { EmptyState } from '@/components/feedback/empty-state';
import { Button } from '@/components/ui/button';
import { getEmployerApplications, getEmployerJob, getEmployerJobs } from '@/lib/data/employer';
import { routes } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'Job applicants',
  robots: { index: false, follow: false },
};

export async function generateStaticParams() {
  const jobs = await getEmployerJobs();
  return jobs.map((job) => ({ slug: job.slug }));
}

export default async function JobApplicantsPage(props: PageProps<'/e/jobs/[slug]/applicants'>) {
  const { slug } = await props.params;
  const job = await getEmployerJob(slug);
  if (!job) notFound();

  const applications = await getEmployerApplications({ jobSlug: slug });

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href={routes.e.job(slug)}>
          <ArrowLeft aria-hidden />
          Back to job
        </Link>
      </Button>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Applicants</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {job.title} · <span data-numeric>{applications.length} applications</span> ·{' '}
            <span data-numeric>{job.vacanciesLeft} positions left</span>
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={routes.e.workers}>Invite more workers</Link>
        </Button>
      </div>

      <div className="mt-5">
        {applications.length === 0 ? (
          <EmptyState
            icon={UserCheck}
            title="No applications for this job yet"
            description="Invite workers whose skills match — invited workers apply about three times more often than those who find the post themselves."
            actions={[
              { label: 'Search workers to invite', href: routes.e.workers, variant: 'action' },
              { label: 'Edit the job post', href: routes.e.editJob(slug) },
            ]}
          />
        ) : (
          <ApplicationPipeline applications={applications} />
        )}
      </div>
    </>
  );
}
