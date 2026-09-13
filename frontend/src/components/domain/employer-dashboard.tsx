'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import type { Company, Job } from '@rokdajob/shared';
import { pluralize } from '@rokdajob/shared';
import { AlertCircle, ArrowRight, Briefcase, Clock, Loader2, Plus, UsersRound } from 'lucide-react';
import { JobStatusBadge } from '@/components/domain/badges';
import { StatCard } from '@/components/domain/stat-card';
import { EmptyState } from '@/components/feedback/empty-state';
import { Button } from '@/components/ui/button';
import { ApiClientError, api } from '@/lib/api/client';
import { routes } from '@/lib/routes';

/**
 * The contractor's home screen, reading their real jobs.
 *
 * Client-rendered because the access token lives in the browser — `/e/*` is a noindex
 * dashboard, so there is nothing to gain from server rendering it and a good deal of
 * auth plumbing to avoid.
 *
 * Application figures are deliberately absent rather than zeroed-out placeholders: the
 * applications module does not exist, and a dashboard that invents numbers is worse than
 * one that says what it does not know.
 */
interface Dashboard {
  company: Company;
  jobs: { open: number; draft: number; filled: number; total: number };
  workersRequired: number;
  hiredCount: number;
}

export function EmployerDashboard() {
  const dashboard = useQuery({
    queryKey: ['employer-dashboard'],
    queryFn: () => api.get<Dashboard>('/employer/dashboard'),
  });

  const jobs = useQuery({
    queryKey: ['employer-jobs', 'recent'],
    queryFn: () => api.list<Job>('/jobs/mine', { query: { limit: 5 } }),
  });

  if (dashboard.isPending) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-10 text-sm">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Loading your dashboard…
      </div>
    );
  }

  if (dashboard.error) {
    const pending =
      dashboard.error instanceof ApiClientError &&
      dashboard.error.code === 'ACCOUNT_PENDING_APPROVAL';

    return (
      <div className="bg-card rounded-lg border p-6">
        <AlertCircle className="text-muted-foreground size-6" aria-hidden />
        <h2 className="mt-3 font-semibold">
          {pending ? 'Your account is still under review' : 'Could not load your dashboard'}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {dashboard.error instanceof ApiClientError
            ? dashboard.error.message
            : 'Please try again in a moment.'}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => void dashboard.refetch()}
        >
          Try again
        </Button>
      </div>
    );
  }

  const stats = dashboard.data;
  const recent = jobs.data?.items ?? [];

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">{stats.company.name}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {stats.jobs.open > 0
              ? `${pluralize(stats.jobs.open, 'job')} open right now.`
              : 'Nothing is open right now. Post a job to start hiring.'}
          </p>
        </div>
        <Button asChild variant="action">
          <Link href={routes.e.newJob}>
            <Plus aria-hidden />
            Post a job
          </Link>
        </Button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Open jobs" value={stats.jobs.open} icon={Briefcase} />
        <StatCard label="Drafts" value={stats.jobs.draft} icon={Clock} />
        <StatCard label="Workers needed" value={stats.workersRequired} icon={UsersRound} />
        <StatCard label="Hired" value={stats.hiredCount} icon={UsersRound} />
      </div>

      <section className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">Your jobs</h2>
          {recent.length > 0 ? (
            <Button asChild variant="ghost" size="sm">
              <Link href={routes.e.jobs}>
                See all
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          ) : null}
        </div>

        {jobs.isPending ? (
          <div className="text-muted-foreground mt-4 flex items-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Loading…
          </div>
        ) : recent.length === 0 ? (
          <EmptyState
            className="mt-4"
            icon={Briefcase}
            title="No jobs yet"
            description="Post your first job and workers nearby will see it straight away."
            actions={[{ label: 'Post a job', href: routes.e.newJob, variant: 'action' }]}
          />
        ) : (
          <ul className="mt-4 space-y-3">
            {recent.map((job) => (
              <li key={job.id} className="bg-card rounded-lg border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={routes.e.job(job.slug)} className="font-semibold hover:underline">
                        {job.title}
                      </Link>
                      <JobStatusBadge status={job.status} />
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {job.location.locality ? `${job.location.locality}, ` : ''}
                      {job.location.city} · {job.vacanciesLeft} of{' '}
                      {pluralize(job.workersRequired, 'opening')} left
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold" data-numeric>
                    ₹{job.salary.amount}
                    <span className="text-muted-foreground text-xs font-normal">
                      /{job.salary.type.replace('PER_', '').toLowerCase()}
                    </span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-muted/40 mt-8 rounded-lg border p-5">
        <h2 className="font-semibold">Applications</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Workers cannot apply yet — the applications module is still being built. Your jobs are
          live and visible in search in the meantime.
        </p>
      </section>
    </>
  );
}
