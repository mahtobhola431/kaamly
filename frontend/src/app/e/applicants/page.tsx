import type { Metadata } from 'next';
import Link from 'next/link';
import { PIPELINE_STAGES, APPLICATION_STAGE_LABEL } from '@rokdajob/shared';
import type { ApplicationStage } from '@rokdajob/shared';
import { UserCheck } from 'lucide-react';
import { ApplicationPipeline } from '@/components/domain/application-pipeline';
import { EmptyState } from '@/components/feedback/empty-state';
import { Button } from '@/components/ui/button';
import { getEmployerApplications, getEmployerJobs } from '@/lib/data/employer';
import { routes } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'Applicants',
  robots: { index: false, follow: false },
};

export default async function ApplicantsPage(props: PageProps<'/e/applicants'>) {
  const raw = await props.searchParams;
  const jobFilter = typeof raw.job === 'string' ? raw.job : undefined;
  const stageFilter = typeof raw.stage === 'string' ? (raw.stage as ApplicationStage) : undefined;

  const [applications, jobs] = await Promise.all([
    getEmployerApplications(jobFilter ? { jobSlug: jobFilter } : {}),
    getEmployerJobs(),
  ]);

  const visible = stageFilter
    ? applications.filter((application) => application.stage === stageFilter)
    : applications;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Applicants</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Drag a card to move someone forward, or use the menu on the card. Hiring updates the
            job&apos;s vacancy count automatically.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild variant={jobFilter ? 'outline' : 'default'} size="sm">
          <Link href={routes.e.applicants}>All jobs ({applications.length})</Link>
        </Button>
        {jobs
          .filter((job) => job.applicationCount > 0)
          .slice(0, 5)
          .map((job) => (
            <Button
              key={job.id}
              asChild
              variant={jobFilter === job.slug ? 'default' : 'outline'}
              size="sm"
            >
              <Link href={`${routes.e.applicants}?job=${job.slug}`}>
                <span className="max-w-40 truncate">{job.title}</span>
              </Link>
            </Button>
          ))}
      </div>

      {stageFilter ? (
        <div className="text-muted-foreground mt-3 flex items-center gap-2 text-sm">
          Filtered to {APPLICATION_STAGE_LABEL[stageFilter]}
          <Button asChild variant="ghost" size="xs">
            <Link
              href={jobFilter ? `${routes.e.applicants}?job=${jobFilter}` : routes.e.applicants}
            >
              Clear
            </Link>
          </Button>
        </div>
      ) : null}

      <div className="mt-5">
        {visible.length === 0 ? (
          <EmptyState
            icon={UserCheck}
            title="No applicants here yet"
            description={
              stageFilter
                ? `Nobody is at the ${APPLICATION_STAGE_LABEL[stageFilter].toLowerCase()} stage right now.`
                : 'Applications appear here as soon as workers apply to your jobs. Inviting workers directly usually speeds this up.'
            }
            actions={[
              { label: 'Search workers to invite', href: routes.e.workers, variant: 'action' },
              { label: 'Post a job', href: routes.e.newJob },
            ]}
          />
        ) : (
          <ApplicationPipeline applications={visible} />
        )}
      </div>

      <p className="text-muted-foreground mt-4 text-xs">
        Board columns follow the pipeline defined in the shared package:{' '}
        {PIPELINE_STAGES.map((stage) => APPLICATION_STAGE_LABEL[stage]).join(' → ')}.
      </p>
    </>
  );
}
