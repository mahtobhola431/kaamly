import type { Metadata } from 'next';
import Link from 'next/link';
import { AVAILABILITY_LABEL, formatExperience, formatWage } from '@rokdajob/shared';
import { ChevronRight, FileCheck2, Languages, MapPin, Pencil, Star, Wrench } from 'lucide-react';
import { SignOutButton } from '@/components/auth/sign-out';
import { AvailabilityBadge, VerificationBadges } from '@/components/domain/badges';
import { RatingStars } from '@/components/domain/rating-stars';
import { UserAvatar } from '@/components/domain/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { getCurrentWorker, getProfileTasks } from '@/lib/data/worker-area';
import { routes } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'Your profile',
  robots: { index: false, follow: false },
};

const LINKS = [
  { href: routes.w.skills, label: 'Skills and experience', icon: Wrench },
  { href: routes.w.documents, label: 'Documents and verification', icon: FileCheck2 },
  { href: routes.w.workHistory, label: 'Work history', icon: MapPin },
  { href: routes.w.reviews, label: 'Reviews about you', icon: Star },
];

export default async function WorkerProfilePage() {
  const [worker, tasks] = await Promise.all([getCurrentWorker(), getProfileTasks()]);
  const pending = tasks.filter((task) => !task.done);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-xl font-bold sm:text-2xl">Your profile</h1>
        <Button asChild variant="outline" size="sm">
          <Link href={routes.w.editProfile}>
            <Pencil aria-hidden />
            Edit
          </Link>
        </Button>
      </div>

      <section className="bg-card mt-4 rounded-lg border p-5">
        <div className="flex items-start gap-4">
          <UserAvatar user={worker.user} size="xl" />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold">{worker.user.name}</h2>
            <p className="text-muted-foreground text-sm">{worker.headline}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <AvailabilityBadge availability={worker.availability} />
              <RatingStars rating={worker.ratingAvg} count={worker.ratingCount} size="sm" />
            </div>
          </div>
        </div>

        <VerificationBadges verification={worker.verification} className="mt-4" />

        <Separator className="my-4" />

        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground text-xs">Area</dt>
            <dd className="mt-0.5 font-medium">{worker.location.formatted}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Travel distance</dt>
            <dd className="mt-0.5 font-medium" data-numeric>
              Up to {worker.workRadiusKm} km
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Expected wage</dt>
            <dd className="mt-0.5 font-medium" data-numeric>
              {formatWage(worker.expectedWage.amount, worker.expectedWage.type)}
              {worker.expectedWage.negotiable ? ' · negotiable' : ''}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Experience</dt>
            <dd className="mt-0.5 font-medium">{formatExperience(worker.experienceYears)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Availability</dt>
            <dd className="mt-0.5 font-medium">{AVAILABILITY_LABEL[worker.availability]}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Jobs completed</dt>
            <dd className="mt-0.5 font-medium" data-numeric>
              {worker.completedJobs}
            </dd>
          </div>
        </dl>

        <Separator className="my-4" />

        <div>
          <p className="text-muted-foreground text-xs">Skills</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {worker.skills.map((entry) => (
              <Badge key={entry.skill.id} variant="secondary">
                {entry.skill.name} · {entry.years}y
              </Badge>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-muted-foreground text-xs">Languages</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Languages className="text-muted-foreground size-4" aria-hidden />
            {worker.languages.map((language) => (
              <Badge key={language} variant="muted">
                {language}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {pending.length > 0 ? (
        <section className="bg-action-subtle border-action/25 mt-4 rounded-lg border p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Profile {worker.profileCompletion}% complete</h2>
            <span className="text-muted-foreground text-sm" data-numeric>
              {pending.length} left
            </span>
          </div>
          <Progress value={worker.profileCompletion} className="mt-2.5" />
          <ul className="mt-3 space-y-1.5">
            {pending.map((task) => (
              <li key={task.id}>
                <Link
                  href={task.href}
                  className="hover:bg-card flex items-center justify-between rounded-md px-2 py-1.5 text-sm"
                >
                  {task.label}
                  <ChevronRight className="text-muted-foreground size-4" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <nav aria-label="Profile sections" className="bg-card mt-4 divide-y rounded-lg border">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="hover:bg-accent/60 flex items-center gap-3 px-4 py-3.5 transition-colors"
          >
            <link.icon className="text-muted-foreground size-4.5 shrink-0" aria-hidden />
            <span className="flex-1 text-sm font-medium">{link.label}</span>
            <ChevronRight className="text-muted-foreground size-4" aria-hidden />
          </Link>
        ))}
      </nav>

      <div className="mt-4">
        <SignOutButton className="text-destructive w-full justify-start sm:w-auto" />
      </div>

      <p className="text-muted-foreground mt-6 text-xs">
        Public profile:{' '}
        <Link href={routes.workerProfile(worker.id)} className="underline">
          see what employers see
        </Link>
        . Your phone number is hidden there.
      </p>
    </>
  );
}
