'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatWage, type Job, type JobStatus } from '@rokdajob/shared';
import { Briefcase, Loader2, MoreHorizontal, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { JobStatusBadge } from '@/components/domain/badges';
import { EmptyState } from '@/components/feedback/empty-state';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ApiClientError, api } from '@/lib/api/client';
import { routes } from '@/lib/routes';
import { cn } from '@/lib/utils';

/**
 * The contractor's own jobs, drafts included.
 *
 * `/jobs/mine` rather than the public search: an employer needs to see their drafts and
 * paused listings, which never appear publicly.
 */
const TABS: { value: JobStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'DRAFT', label: 'Drafts' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'FILLED', label: 'Filled' },
];

export function EmployerJobsList() {
  const [tab, setTab] = useState<JobStatus | 'ALL'>('ALL');
  const queryClient = useQueryClient();

  const jobs = useQuery({
    queryKey: ['employer-jobs', tab],
    queryFn: () =>
      api.list<Job>('/jobs/mine', {
        query: { limit: 50, ...(tab === 'ALL' ? {} : { status: tab }) },
      }),
  });

  const setStatus = useMutation({
    mutationFn: ({ job, status }: { job: Job; status: JobStatus }) =>
      api.patch<Job>(`/jobs/${job.id}/status`, { status }),
    onSuccess: (_data, { job, status }) => {
      toast.success(
        status === 'PUBLISHED'
          ? `${job.title} is live`
          : `${job.title} moved to ${status.toLowerCase()}`,
      );
      void queryClient.invalidateQueries({ queryKey: ['employer-jobs'] });
      void queryClient.invalidateQueries({ queryKey: ['employer-dashboard'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof ApiClientError ? error.message : 'Could not update the job.');
    },
  });

  const rows = jobs.data?.items ?? [];

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Jobs</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Everything you have posted, drafts included.
          </p>
        </div>
        <Button asChild variant="action">
          <Link href={routes.e.newJob}>
            <Plus aria-hidden />
            Post a job
          </Link>
        </Button>
      </div>

      <div
        role="tablist"
        aria-label="Job status"
        className="bg-muted mt-5 inline-flex rounded-md p-1"
      >
        {TABS.map((item) => (
          <button
            key={item.value}
            role="tab"
            aria-selected={tab === item.value}
            onClick={() => setTab(item.value)}
            className={cn(
              'rounded px-3 py-1.5 text-sm font-medium transition-colors',
              tab === item.value
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {jobs.isPending ? (
        <div className="text-muted-foreground mt-6 flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Loading your jobs…
        </div>
      ) : jobs.error ? (
        <div className="bg-destructive-subtle border-destructive/30 text-destructive mt-5 rounded-md border p-4 text-sm">
          {jobs.error instanceof ApiClientError ? jobs.error.message : 'Could not load your jobs.'}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          className="mt-5"
          icon={Briefcase}
          title={
            tab === 'ALL'
              ? 'No jobs yet'
              : `Nothing ${TABS.find((t) => t.value === tab)?.label.toLowerCase()}`
          }
          description="Post a job and workers within travel distance will see it in their nearby feed."
          actions={[{ label: 'Post a job', href: routes.e.newJob, variant: 'action' }]}
        />
      ) : (
        <div className="mt-5 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Filled</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((job) => {
                const filledPercent =
                  job.workersRequired > 0 ? (job.hiredCount / job.workersRequired) * 100 : 0;
                const busy = setStatus.isPending && setStatus.variables?.job.id === job.id;

                return (
                  <TableRow key={job.id}>
                    <TableCell>
                      <Link href={routes.e.job(job.slug)} className="font-medium hover:underline">
                        {job.title}
                      </Link>
                      <p className="text-muted-foreground text-xs">
                        {job.location.locality ? `${job.location.locality}, ` : ''}
                        {job.location.city}
                      </p>
                    </TableCell>
                    <TableCell>
                      <JobStatusBadge status={job.status} />
                    </TableCell>
                    <TableCell>
                      <span data-numeric className="text-sm">
                        {job.hiredCount} / {job.workersRequired}
                      </span>
                      <Progress value={filledPercent} className="mt-1 w-24" />
                    </TableCell>
                    <TableCell data-numeric>
                      {formatWage(job.salary.amount, job.salary.type)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Actions for ${job.title}`}
                            disabled={busy}
                          >
                            {busy ? (
                              <Loader2 className="animate-spin" aria-hidden />
                            ) : (
                              <MoreHorizontal aria-hidden />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={routes.job(job.slug)}>View public page</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={routes.e.editJob(job.slug)}>Edit</Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {job.status === 'PUBLISHED' || job.status === 'HIRING' ? (
                            <DropdownMenuItem
                              onSelect={() => setStatus.mutate({ job, status: 'PAUSED' })}
                            >
                              Pause
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onSelect={() => setStatus.mutate({ job, status: 'PUBLISHED' })}
                            >
                              Publish
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onSelect={() => setStatus.mutate({ job, status: 'FILLED' })}
                          >
                            Mark as filled
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
