'use client';

import Link from 'next/link';
import type { Application, Job, PaginationMeta } from '@rokdajob/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, UserCheck } from 'lucide-react';
import { ApplicationPipeline } from '@/components/domain/application-pipeline';
import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api/client';
import { routes } from '@/lib/routes';

/**
 * The `/e/applicants` board narrowed to one post. The job is fetched separately because
 * the applicants endpoint is keyed by id, not slug.
 */
export function JobApplicants({ slug }: { slug: string }) {
  const queryClient = useQueryClient();

  const job = useQuery({
    queryKey: ['job', slug],
    queryFn: () => api.get<Job>(`/jobs/${encodeURIComponent(slug)}`),
  });

  const applications = useQuery({
    queryKey: ['job-applications', job.data?.id],
    queryFn: () =>
      api.list<Application>(`/jobs/${job.data!.id}/applications`, { query: { limit: 50 } }) as
        Promise<{ items: Application[]; meta: PaginationMeta }>,
    enabled: Boolean(job.data?.id),
  });

  const refresh = (): void => {
    void queryClient.invalidateQueries({ queryKey: ['job-applications'] });
    void queryClient.invalidateQueries({ queryKey: ['job', slug] });
  };

  if (job.isPending) return <Skeleton className="h-72 w-full rounded-lg" />;

  if (job.isError) {
    return (
      <ErrorState
        title="Could not load this job"
        description="It may have been removed, or it may belong to another account."
        onRetry={() => void job.refetch()}
      />
    );
  }

  const total = applications.data?.meta.total ?? 0;

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
            {job.data.title} · <span data-numeric>{total} applications</span> ·{' '}
            <span data-numeric>{job.data.vacanciesLeft} positions left</span>
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={routes.e.workers}>Invite more workers</Link>
        </Button>
      </div>

      <div className="mt-5">
        {applications.isPending ? (
          <div className="flex gap-3 overflow-hidden">
            {[0, 1, 2, 3].map((column) => (
              <Skeleton key={column} className="h-72 w-72 shrink-0 rounded-lg" />
            ))}
          </div>
        ) : applications.isError ? (
          <ErrorState
            title="Could not load the applicants"
            onRetry={() => void applications.refetch()}
          />
        ) : applications.data.items.length === 0 ? (
          <EmptyState
            icon={UserCheck}
            title="No applications for this job yet"
            description="A clear title, an honest wage and a nearby location are what bring workers in. Inviting workers whose skills match works even faster."
            actions={[
              { label: 'Search workers to invite', href: routes.e.workers, variant: 'action' },
              { label: 'Edit the job post', href: routes.e.editJob(slug) },
            ]}
          />
        ) : (
          <ApplicationPipeline applications={applications.data.items} onChanged={refresh} />
        )}
      </div>
    </>
  );
}
