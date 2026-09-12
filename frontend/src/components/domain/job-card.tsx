import Link from 'next/link';
import { SHIFT_LABEL, formatDistance, formatWage, pluralize } from '@rokdajob/shared';
import type { Job } from '@rokdajob/shared';
import { Bed, CalendarDays, Clock, MapPin, UsersRound, Utensils } from 'lucide-react';
import { CompanyVerifiedBadge, JobStatusBadge, UrgencyBadge } from '@/components/domain/badges';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { demoAgo, demoDay } from '@/data/time';
import { routes } from '@/lib/routes';
import { cn } from '@/lib/utils';

interface JobCardProps {
  job: Job;
  /** `compact` drops the description and perks; used in dense rails and sidebars. */
  compact?: boolean;
  showStatus?: boolean;
  className?: string;
}

export function JobCard({ job, compact = false, showStatus = false, className }: JobCardProps) {
  const href = routes.job(job.slug);

  return (
    <article
      className={cn(
        'bg-card relative flex flex-col rounded-lg border p-4 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-raised)]',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <UrgencyBadge urgency={job.urgency} />
            {showStatus ? <JobStatusBadge status={job.status} /> : null}
          </div>
          <h3 className="font-semibold leading-snug">
            <Link
              href={href}
              className="hover:text-primary outline-none before:absolute before:inset-0"
            >
              {job.title}
            </Link>
          </h3>
          <p className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2 text-sm">
            <span className="truncate">{job.company.name}</span>
            <CompanyVerifiedBadge verified={job.company.verification.company} />
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="font-semibold" data-numeric>
            {formatWage(job.salary.amount, job.salary.type)}
          </p>
          {job.salary.negotiable ? (
            <p className="text-muted-foreground text-xs">Negotiable</p>
          ) : null}
        </div>
      </div>

      <dl className="text-muted-foreground mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        <div className="col-span-2 flex items-center gap-1.5">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          <dt className="sr-only">Location</dt>
          <dd className="truncate">
            {job.location.locality ? `${job.location.locality}, ` : ''}
            {job.location.city}
            {job.distanceKm !== undefined ? (
              <span className="text-foreground font-medium">
                {' '}
                · {formatDistance(job.distanceKm)}
              </span>
            ) : null}
          </dd>
        </div>

        <div className="flex items-center gap-1.5">
          <UsersRound className="size-3.5 shrink-0" aria-hidden />
          <dt className="sr-only">Workers needed</dt>
          <dd data-numeric>{pluralize(job.vacanciesLeft, 'opening')}</dd>
        </div>

        <div className="flex items-center gap-1.5">
          <CalendarDays className="size-3.5 shrink-0" aria-hidden />
          <dt className="sr-only">Starts</dt>
          <dd>{job.startDate ? demoDay(job.startDate) : 'Flexible'}</dd>
        </div>

        <div className="flex items-center gap-1.5">
          <Clock className="size-3.5 shrink-0" aria-hidden />
          <dt className="sr-only">Shift</dt>
          <dd>
            {job.workingHours
              ? `${job.workingHours.from}–${job.workingHours.to}`
              : SHIFT_LABEL[job.shift]}
          </dd>
        </div>

        {job.durationDays ? (
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Duration</dt>
            <dd data-numeric>
              {job.durationDays >= 365 ? 'Long term' : `${job.durationDays} days`}
            </dd>
          </div>
        ) : null}
      </dl>

      {!compact ? (
        <>
          <p className="text-muted-foreground mt-3 line-clamp-2 text-sm">{job.description}</p>

          {(job.perks.accommodation || job.perks.food || job.perks.transport) && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {job.perks.accommodation ? (
                <Badge variant="secondary" className="gap-1">
                  <Bed aria-hidden />
                  Stay
                </Badge>
              ) : null}
              {job.perks.food ? (
                <Badge variant="secondary" className="gap-1">
                  <Utensils aria-hidden />
                  Food
                </Badge>
              ) : null}
              {job.perks.transport ? <Badge variant="secondary">Transport</Badge> : null}
            </div>
          )}
        </>
      ) : null}

      <div className="mt-4 flex items-center justify-between gap-3 border-t pt-3">
        <span className="text-muted-foreground text-xs">
          {job.publishedAt ? `Posted ${demoAgo(job.publishedAt)}` : 'Not published'}
        </span>
        <Button asChild variant="action" size="sm" className="relative z-10">
          <Link href={href}>View job</Link>
        </Button>
      </div>
    </article>
  );
}

export function JobList({
  jobs,
  compact,
  className,
}: {
  jobs: Job[];
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('grid gap-4 md:grid-cols-2 xl:grid-cols-3', className)}>
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} compact={compact} />
      ))}
    </div>
  );
}
