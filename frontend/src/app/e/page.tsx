import type { Metadata } from 'next';
import Link from 'next/link';
import { PIPELINE_STAGES, APPLICATION_STAGE_LABEL, pluralize } from '@rokdajob/shared';
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Percent,
  Plus,
  UserCheck,
  UsersRound,
} from 'lucide-react';
import { JobStatusBadge, StageBadge, STAGE_ACCENT } from '@/components/domain/badges';
import { StatCard } from '@/components/domain/stat-card';
import { UserAvatar } from '@/components/domain/user-avatar';
import { WorkerCard } from '@/components/domain/worker-card';
import { EmptyState } from '@/components/feedback/empty-state';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { demoAgo } from '@/data/time';
import {
  getCurrentEmployer,
  getEmployerActivity,
  getEmployerApplications,
  getEmployerDashboard,
  getEmployerJobs,
  getPipeline,
} from '@/lib/data/employer';
import { searchWorkers } from '@/lib/data/workers';
import { routes } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
};

export default async function EmployerDashboardPage() {
  const [employer, stats, jobs, applications, pipeline, activity, availableNearby] =
    await Promise.all([
      getCurrentEmployer(),
      getEmployerDashboard(),
      getEmployerJobs(),
      getEmployerApplications(),
      getPipeline(),
      getEmployerActivity(),
      searchWorkers({
        city: 'mumbai',
        availability: ['AVAILABLE_NOW'],
        sort: 'nearest',
        limit: 3,
      }),
    ]);

  const activeJobs = jobs.filter((job) => job.status === 'HIRING' || job.status === 'PUBLISHED');
  const recentApplicants = applications.slice(0, 5);
  const firstName = employer.user.name.split(' ')[0];

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Good morning, {firstName}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {employer.company.name} ·{' '}
            {stats.openPositions > 0
              ? `${pluralize(stats.openPositions, 'position')} still to fill`
              : 'All positions filled'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={routes.e.workers}>Search workers</Link>
          </Button>
          <Button asChild variant="action" size="sm">
            <Link href={routes.e.newJob}>
              <Plus aria-hidden />
              Post a job
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active jobs" value={stats.activeJobs} icon={Briefcase} />
        <StatCard
          label="Open positions"
          value={stats.openPositions}
          icon={UsersRound}
          hint="Across all live jobs"
        />
        <StatCard label="Applicants" value={stats.totalApplicants} icon={UserCheck} delta={18} />
        <StatCard
          label="Hire rate"
          value={stats.hiringConversionRate}
          suffix="%"
          icon={Percent}
          hint="Applicants who became hires"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <section aria-labelledby="pipeline-summary">
            <div className="flex items-end justify-between gap-3">
              <h2 id="pipeline-summary" className="text-lg font-semibold">
                Hiring pipeline
              </h2>
              <Link
                href={routes.e.applicants}
                className="text-primary inline-flex items-center gap-1 text-sm font-semibold"
              >
                Open board
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>

            <div className="bg-card mt-3 grid gap-px overflow-hidden rounded-lg border sm:grid-cols-4 xl:grid-cols-8">
              {PIPELINE_STAGES.map((stage) => {
                const count = pipeline[stage]?.length ?? 0;
                return (
                  <Link
                    key={stage}
                    href={`${routes.e.applicants}?stage=${stage}`}
                    className="hover:bg-accent/60 group p-3 transition-colors"
                  >
                    <span
                      aria-hidden
                      className={`block h-1 w-8 rounded-full ${STAGE_ACCENT[stage]}`}
                    />
                    <p className="text-muted-foreground mt-2 text-xs">
                      {APPLICATION_STAGE_LABEL[stage]}
                    </p>
                    <p className="text-xl font-bold" data-numeric>
                      {count}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>

          <section aria-labelledby="active-jobs">
            <div className="flex items-end justify-between gap-3">
              <h2 id="active-jobs" className="text-lg font-semibold">
                Active jobs
              </h2>
              <Link
                href={routes.e.jobs}
                className="text-primary inline-flex items-center gap-1 text-sm font-semibold"
              >
                All jobs
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>

            {activeJobs.length === 0 ? (
              <EmptyState
                className="mt-3"
                icon={Briefcase}
                title="No active jobs"
                description="Post a job and workers within travel distance will see it in their nearby feed the same day."
                actions={[{ label: 'Post a job', href: routes.e.newJob, variant: 'action' }]}
              />
            ) : (
              <ul className="mt-3 space-y-2">
                {activeJobs.slice(0, 4).map((job) => {
                  const percent = Math.round((job.hiredCount / job.workersRequired) * 100);
                  return (
                    <li key={job.id} className="bg-card rounded-lg border p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-medium">
                            <Link href={routes.e.job(job.slug)} className="hover:text-primary">
                              {job.title}
                            </Link>
                          </h3>
                          <p className="text-muted-foreground mt-0.5 text-sm">
                            {job.location.locality ?? job.location.city} ·{' '}
                            <span data-numeric>{job.applicationCount} applications</span>
                          </p>
                        </div>
                        <JobStatusBadge status={job.status} />
                      </div>

                      <div className="mt-3">
                        <div className="text-muted-foreground mb-1 flex items-center justify-between text-xs">
                          <span>
                            <span className="text-foreground font-medium" data-numeric>
                              {job.hiredCount}
                            </span>{' '}
                            of {job.workersRequired} hired
                          </span>
                          <span data-numeric>{job.vacanciesLeft} still open</span>
                        </div>
                        <Progress value={percent} />
                      </div>

                      <div className="mt-3 flex gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={routes.e.jobApplicants(job.slug)}>View applicants</Link>
                        </Button>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={routes.e.job(job.slug)}>Manage</Link>
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section aria-labelledby="available-nearby">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 id="available-nearby" className="text-lg font-semibold">
                  Available near your sites
                </h2>
                <p className="text-muted-foreground mt-0.5 text-sm">
                  {stats.availableWorkersNearby} workers marked available right now
                </p>
              </div>
              <Link
                href={routes.e.workers}
                className="text-primary inline-flex items-center gap-1 text-sm font-semibold"
              >
                Search
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {availableNearby.items.map((worker) => (
                <WorkerCard key={worker.id} worker={worker} variant="employer" />
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section aria-labelledby="recent-applicants" className="bg-card rounded-lg border">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 id="recent-applicants" className="font-semibold">
                Recent applicants
              </h2>
              <Link href={routes.e.applicants} className="text-primary text-sm font-semibold">
                All
              </Link>
            </div>

            {recentApplicants.length === 0 ? (
              <p className="text-muted-foreground px-4 py-8 text-center text-sm">
                No applications yet.
              </p>
            ) : (
              <ul className="divide-y">
                {recentApplicants.map((application) => (
                  <li key={application.id} className="flex items-center gap-3 px-4 py-3">
                    <UserAvatar user={application.worker} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{application.worker.name}</p>
                      <p className="text-muted-foreground truncate text-xs">
                        {application.job.title}
                      </p>
                    </div>
                    <StageBadge stage={application.stage} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="activity" className="bg-card rounded-lg border">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 id="activity" className="font-semibold">
                Recent activity
              </h2>
              <Link href={routes.e.activity} className="text-primary text-sm font-semibold">
                All
              </Link>
            </div>
            <ol className="divide-y">
              {activity.slice(0, 6).map((event) => (
                <li key={event.id} className="px-4 py-3">
                  <p className="text-sm">
                    <span className="font-medium">{event.actor}</span> {event.summary}{' '}
                    <span className="text-muted-foreground">{event.context}</span>
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-xs">{demoAgo(event.at)}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="bg-card rounded-lg border p-4">
            <h2 className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="text-success size-4" aria-hidden />
              Jobs completed
            </h2>
            <p className="mt-2 text-3xl font-bold" data-numeric>
              {stats.jobsCompleted}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {stats.hired} workers hired across all your posts so far.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
