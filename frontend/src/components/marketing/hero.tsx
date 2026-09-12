import Link from 'next/link';
import { formatWage, pluralize } from '@rokdajob/shared';
import type { Job, SeedCity, Skill, WorkerProfile } from '@rokdajob/shared';
import { BadgeCheck, MapPin, ShieldCheck, Zap } from 'lucide-react';
import { AvailabilityBadge } from '@/components/domain/badges';
import { RatingStars } from '@/components/domain/rating-stars';
import { SearchBar } from '@/components/domain/search-bar';
import { UserAvatar } from '@/components/domain/user-avatar';
import { Button } from '@/components/ui/button';
import { demoDay } from '@/data/time';

/**
 * The hero visual is the product itself — a real worker result and a real job post —
 * rather than an illustration. Employers recognise what they are buying in one glance,
 * and there is no stock imagery to load on a slow connection.
 */
function WorkerPreviewCard({ worker }: { worker: WorkerProfile }) {
  return (
    <div className="bg-card w-full rounded-lg border p-4 shadow-[var(--shadow-raised)]">
      <div className="flex items-start gap-3">
        <UserAvatar user={worker.user} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{worker.user.name}</p>
          <p className="text-muted-foreground truncate text-sm">
            {worker.skills[0]?.skill.name} · {worker.experienceYears} yrs
          </p>
          <div className="mt-1">
            <RatingStars rating={worker.ratingAvg} count={worker.ratingCount} size="sm" />
          </div>
        </div>
        <AvailabilityBadge availability={worker.availability} />
      </div>
      <div className="text-muted-foreground mt-3 flex items-center justify-between border-t pt-3 text-sm">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="size-3.5" aria-hidden />
          {worker.location.locality}
          <span className="text-foreground font-medium">· 3.2 km</span>
        </span>
        <span className="text-foreground font-semibold" data-numeric>
          {formatWage(worker.expectedWage.amount, worker.expectedWage.type)}
        </span>
      </div>
    </div>
  );
}

function JobPreviewCard({ job }: { job: Job }) {
  return (
    <div className="bg-card w-full rounded-lg border p-4 shadow-[var(--shadow-raised)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="bg-action-subtle text-action-hover border-action/25 mb-1.5 inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium">
            <Zap className="size-3" aria-hidden />
            Hiring now
          </span>
          <p className="truncate font-semibold">{job.title}</p>
          <p className="text-muted-foreground truncate text-sm">
            {job.location.locality}, {job.location.city}
          </p>
        </div>
        <span className="shrink-0 font-semibold" data-numeric>
          {formatWage(job.salary.amount, job.salary.type)}
        </span>
      </div>
      <div className="text-muted-foreground mt-3 flex items-center justify-between border-t pt-3 text-sm">
        <span data-numeric>{pluralize(job.vacanciesLeft, 'opening')}</span>
        <span>Starts {job.startDate ? demoDay(job.startDate) : 'soon'}</span>
      </div>
    </div>
  );
}

export function Hero({
  cities,
  popularSkills,
  featuredWorker,
  featuredJob,
}: {
  cities: readonly SeedCity[];
  popularSkills: Skill[];
  featuredWorker: WorkerProfile;
  featuredJob: Job;
}) {
  return (
    <section className="from-navy-50/60 border-b bg-gradient-to-b to-transparent">
      <div className="container-marketing grid gap-12 py-14 md:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
        <div>
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl">
            Find the right people for the work that matters.
          </h1>

          <p className="text-muted-foreground mt-4 max-w-xl text-lg">
            Connect with skilled and reliable workers near your worksite, manage hiring, and build
            your workforce from one place.
          </p>

          <div className="mt-8">
            <SearchBar cities={cities} showModeToggle size="lg" />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-sm">Popular:</span>
            {popularSkills.slice(0, 5).map((skill) => (
              <Link
                key={skill.id}
                href={`/workers?skill=${skill.slug}`}
                className="hover:border-action hover:text-action-hover rounded-md border px-2.5 py-1 text-sm transition-colors"
              >
                {skill.name}
              </Link>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="action" size="lg">
              <Link href="/workers">Find workers</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/jobs">Find work</Link>
            </Button>
          </div>

          <ul className="text-muted-foreground mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <li className="inline-flex items-center gap-1.5">
              <ShieldCheck className="text-success size-4" aria-hidden />
              Phone-verified accounts
            </li>
            <li className="inline-flex items-center gap-1.5">
              <BadgeCheck className="text-success size-4" aria-hidden />
              Ratings after every job
            </li>
            <li className="inline-flex items-center gap-1.5">
              <MapPin className="text-success size-4" aria-hidden />
              Distance-based matching
            </li>
          </ul>
        </div>

        <div className="relative">
          <div
            aria-hidden
            className="bg-action/10 absolute -right-6 -top-8 hidden size-40 rounded-full blur-3xl lg:block"
          />
          <div className="relative space-y-4">
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
              Workers near Andheri East
            </p>
            <WorkerPreviewCard worker={featuredWorker} />
            <div className="pl-6 sm:pl-10">
              <JobPreviewCard job={featuredJob} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
