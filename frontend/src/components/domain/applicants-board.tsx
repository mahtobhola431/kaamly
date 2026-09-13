'use client';

import { useState } from 'react';
import { APPLICATION_STAGE_LABEL, PIPELINE_STAGES } from '@rokdajob/shared';
import type { Job } from '@rokdajob/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UserCheck } from 'lucide-react';
import { ApplicationPipeline } from '@/components/domain/application-pipeline';
import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api/client';
import { getEmployerApplications } from '@/lib/data/applications';
import { routes } from '@/lib/routes';

/**
 * The applicant pipeline, read from `/employer/applications`. The per-job filter is local
 * state, so switching jobs swaps the cards without losing scroll on a wide board.
 */
export function ApplicantsBoard() {
  const queryClient = useQueryClient();
  const [jobId, setJobId] = useState<string | null>(null);

  const applications = useQuery({
    queryKey: ['employer-applications', jobId],
    queryFn: () => getEmployerApplications({ ...(jobId ? { job: jobId } : {}), limit: 50 }),
  });

  // Only jobs with applications are worth a filter button.
  const jobs = useQuery({
    queryKey: ['employer-jobs', 'for-filter'],
    queryFn: () => api.list<Job>('/jobs/mine', { query: { limit: 50 } }),
  });

  const refresh = (): void => {
    void queryClient.invalidateQueries({ queryKey: ['employer-applications'] });
    void queryClient.invalidateQueries({ queryKey: ['employer-jobs'] });
  };

  const filterable = (jobs.data?.items ?? []).filter((job) => job.applicationCount > 0);

  return (
    <>
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">Applicants</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Drag a card to move someone forward, or use the menu on the card. Hiring updates the
          job&apos;s vacancy count automatically.
        </p>
      </div>

      {filterable.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant={jobId === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setJobId(null)}
          >
            All jobs
          </Button>
          {filterable.slice(0, 6).map((job) => (
            <Button
              key={job.id}
              variant={jobId === job.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setJobId(job.id)}
            >
              <span className="max-w-40 truncate">{job.title}</span>
              <span className="text-muted-foreground ml-1" data-numeric>
                {job.applicationCount}
              </span>
            </Button>
          ))}
        </div>
      ) : null}

      <div className="mt-5">
        {applications.isPending ? (
          <div className="flex gap-3 overflow-hidden">
            {[0, 1, 2, 3].map((column) => (
              <Skeleton key={column} className="h-72 w-72 shrink-0 rounded-lg" />
            ))}
          </div>
        ) : applications.isError ? (
          <ErrorState
            title="Could not load your applicants"
            onRetry={() => void applications.refetch()}
          />
        ) : applications.data.items.length === 0 ? (
          <EmptyState
            icon={UserCheck}
            title="No applicants yet"
            description="Applications appear here as soon as workers apply to your jobs. A clear title and an honest wage bring them in fastest."
            actions={[
              { label: 'Post a job', href: routes.e.newJob, variant: 'action' },
              { label: 'Search workers', href: routes.e.workers },
            ]}
          />
        ) : (
          <ApplicationPipeline applications={applications.data.items} onChanged={refresh} />
        )}
      </div>

      <p className="text-muted-foreground mt-4 text-xs">
        Board columns follow the pipeline defined in the shared package:{' '}
        {PIPELINE_STAGES.map((stage) => APPLICATION_STAGE_LABEL[stage]).join(' → ')}.
      </p>
    </>
  );
}
