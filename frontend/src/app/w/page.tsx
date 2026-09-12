import type { Metadata } from 'next';
import Link from 'next/link';
import { formatDistance, pluralize } from '@rokdajob/shared';
import { ArrowRight, Bookmark, CircleCheck, FileText, MapPin, Sparkles, Zap } from 'lucide-react';
import { JobCard } from '@/components/domain/job-card';
import { StageBadge } from '@/components/domain/badges';
import { EmptyState } from '@/components/feedback/empty-state';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { demoAgo } from '@/data/time';
import { getNearbyJobs, getRecommendedJobs, getUrgentJobs } from '@/lib/data/jobs';
import {
  getCurrentWorker,
  getMyApplications,
  getProfileTasks,
  getWorkerDashboard,
} from '@/lib/data/worker-area';
import { routes } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'Home',
  robots: { index: false, follow: false },
};

function Rail({
  title,
  description,
  href,
  jobs,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  jobs: Awaited<ReturnType<typeof getNearbyJobs>>;
  icon: typeof Zap;
}) {
  if (jobs.length === 0) return null;

  return (
    <section className="mt-8" aria-labelledby={`rail-${title.replace(/\s+/g, '-')}`}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2
            id={`rail-${title.replace(/\s+/g, '-')}`}
            className="flex items-center gap-2 text-lg font-semibold"
          >
            <Icon className="text-action size-4.5" aria-hidden />
            {title}
          </h2>
          <p className="text-muted-foreground mt-0.5 text-sm">{description}</p>
        </div>
        <Link
          href={href}
          className="text-primary inline-flex shrink-0 items-center gap-1 rounded-md text-sm font-semibold"
        >
          See all
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {jobs.slice(0, 3).map((job) => (
          <JobCard key={job.id} job={job} compact />
        ))}
      </div>
    </section>
  );
}

export default async function WorkerHomePage() {
  const [worker, stats, recommended, nearby, urgent, applications, tasks] = await Promise.all([
    getCurrentWorker(),
    getWorkerDashboard(),
    getRecommendedJobs(6),
    getNearbyJobs(undefined, 6),
    getUrgentJobs(6),
    getMyApplications(),
    getProfileTasks(),
  ]);

  const firstName = worker.user.name.split(' ')[0];
  const activeApplications = applications
    .filter((application) => !['REJECTED', 'WITHDRAWN'].includes(application.stage))
    .slice(0, 3);
  const pendingTasks = tasks.filter((task) => !task.done);

  return (
    <>
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">Namaste, {firstName}</h1>
        <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 text-sm">
          <MapPin className="size-4" aria-hidden />
          {worker.location.formatted}
          <span aria-hidden>·</span>
          <span data-numeric>within {worker.workRadiusKm} km</span>
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Jobs near you', value: nearby.length, href: routes.w.jobs, icon: MapPin },
          {
            label: 'Matching your skills',
            value: recommended.length,
            href: routes.w.jobs,
            icon: Sparkles,
          },
          {
            label: 'Active applications',
            value: stats.activeApplications,
            href: routes.w.applications,
            icon: FileText,
          },
          { label: 'Saved jobs', value: 3, href: routes.w.saved, icon: Bookmark },
        ].map((tile) => (
          <Link
            key={tile.label}
            href={tile.href}
            className="bg-card hover:border-action/50 rounded-lg border p-4 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                {tile.label}
              </span>
              <tile.icon className="text-muted-foreground size-4" aria-hidden />
            </div>
            <p className="mt-1.5 text-2xl font-bold" data-numeric>
              {tile.value}
            </p>
          </Link>
        ))}
      </div>

      {pendingTasks.length > 0 ? (
        <section
          className="bg-action-subtle border-action/25 mt-6 rounded-lg border p-4"
          aria-labelledby="profile-completion"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="profile-completion" className="font-semibold">
                Your profile is {worker.profileCompletion}% complete
              </h2>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Complete profiles get contacted more often by employers nearby.
              </p>
            </div>
            <Button asChild variant="action" size="sm">
              <Link href={routes.w.editProfile}>Finish profile</Link>
            </Button>
          </div>

          <Progress value={worker.profileCompletion} className="mt-3" />

          <ul className="mt-3 flex flex-wrap gap-2">
            {tasks.map((task) => (
              <li key={task.id}>
                <Link
                  href={task.href}
                  className={
                    task.done
                      ? 'text-success bg-card inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs'
                      : 'bg-card hover:border-action inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs'
                  }
                >
                  {task.done ? <CircleCheck className="size-3" aria-hidden /> : null}
                  {task.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {activeApplications.length > 0 ? (
        <section className="mt-8" aria-labelledby="your-applications">
          <div className="flex items-end justify-between gap-3">
            <h2 id="your-applications" className="text-lg font-semibold">
              Your applications
            </h2>
            <Link
              href={routes.w.applications}
              className="text-primary inline-flex items-center gap-1 rounded-md text-sm font-semibold"
            >
              See all
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>

          <ul className="mt-3 space-y-2">
            {activeApplications.map((application) => (
              <li key={application.id}>
                <Link
                  href={routes.job(application.job.slug)}
                  className="bg-card hover:border-action/50 flex items-center gap-3 rounded-lg border p-3 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{application.job.title}</p>
                    <p className="text-muted-foreground truncate text-sm">
                      {application.job.location.locality ?? application.job.location.city} ·{' '}
                      {demoAgo(application.createdAt)}
                    </p>
                  </div>
                  <StageBadge stage={application.stage} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Rail
        title="Recommended for you"
        description={`Matching ${worker.skills
          .map((entry) => entry.skill.name)
          .slice(0, 2)
          .join(' and ')} within ${worker.workRadiusKm} km`}
        href={routes.w.jobs}
        jobs={recommended}
        icon={Sparkles}
      />

      <Rail
        title="Urgent work"
        description="Employers who need people immediately"
        href={`${routes.jobs}?urgency=URGENT,IMMEDIATE`}
        jobs={urgent}
        icon={Zap}
      />

      <Rail
        title="Nearby jobs"
        description={
          nearby[0]?.distanceKm !== undefined
            ? `Closest is ${formatDistance(nearby[0].distanceKm)}`
            : 'Sorted by distance from your area'
        }
        href={routes.w.jobs}
        jobs={nearby}
        icon={MapPin}
      />

      {nearby.length === 0 && recommended.length === 0 ? (
        <EmptyState
          className="mt-8"
          title="No work within your travel distance yet"
          description={`You are looking within ${worker.workRadiusKm} km of ${worker.location.locality ?? worker.location.city}. Increasing that distance usually finds ${pluralize(6, 'more job')}.`}
          actions={[
            { label: 'Increase travel distance', href: routes.w.editProfile, variant: 'action' },
            { label: 'Browse all jobs', href: routes.jobs },
          ]}
        />
      ) : null}
    </>
  );
}
