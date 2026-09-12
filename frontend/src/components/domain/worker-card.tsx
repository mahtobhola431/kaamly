import Link from 'next/link';
import { formatDistance, formatWage } from '@rokdajob/shared';
import type { WorkerProfile } from '@rokdajob/shared';
import { Briefcase, MapPin, MessageSquare, Send } from 'lucide-react';
import { AvailabilityBadge, VerificationBadges } from '@/components/domain/badges';
import { RatingStars } from '@/components/domain/rating-stars';
import { UserAvatar } from '@/components/domain/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { routes } from '@/lib/routes';
import { cn } from '@/lib/utils';

interface WorkerCardProps {
  worker: WorkerProfile;
  /**
   * `public` is the marketing-site card. `employer` adds invite and message actions that
   * only make sense inside the CRM.
   */
  variant?: 'public' | 'employer';
  className?: string;
}

export function WorkerCard({ worker, variant = 'public', className }: WorkerCardProps) {
  const primarySkill = worker.skills[0]?.skill.name ?? worker.primaryCategory?.name ?? 'Worker';
  const extraSkills = worker.skills.slice(1, 3);
  const href = routes.workerProfile(worker.id);

  return (
    <article
      className={cn(
        'bg-card group flex flex-col rounded-lg border p-4 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-raised)]',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <UserAvatar user={worker.user} size="lg" />

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold">
            <Link href={href} className="hover:text-primary rounded-sm outline-none">
              {worker.user.name}
            </Link>
          </h3>
          <p className="text-muted-foreground truncate text-sm">{primarySkill}</p>
          <div className="mt-1.5">
            <RatingStars rating={worker.ratingAvg} count={worker.ratingCount} size="sm" />
          </div>
        </div>

        <AvailabilityBadge availability={worker.availability} className="shrink-0" />
      </div>

      <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">
            {worker.location.locality ?? worker.location.city}
            {worker.distanceKm !== undefined ? (
              <span className="text-foreground font-medium">
                {' '}
                · {formatDistance(worker.distanceKm)}
              </span>
            ) : null}
          </span>
        </span>
        <span className="inline-flex items-center gap-1.5" data-numeric>
          <Briefcase className="size-3.5 shrink-0" aria-hidden />
          {worker.experienceYears} yr{worker.experienceYears === 1 ? '' : 's'}
        </span>
      </div>

      {extraSkills.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {extraSkills.map((entry) => (
            <Badge key={entry.skill.id} variant="secondary">
              {entry.skill.name}
            </Badge>
          ))}
          {worker.skills.length > 3 ? (
            <Badge variant="muted">+{worker.skills.length - 3}</Badge>
          ) : null}
        </div>
      ) : null}

      <VerificationBadges verification={worker.verification} compact className="mt-3" />

      <div className="mt-4 flex items-end justify-between gap-3 border-t pt-3">
        <div>
          <p className="text-muted-foreground text-xs">Expected</p>
          <p className="font-semibold" data-numeric>
            {formatWage(worker.expectedWage.amount, worker.expectedWage.type)}
          </p>
        </div>

        <div className="flex gap-2">
          {variant === 'employer' ? (
            <>
              <Button variant="outline" size="sm" aria-label={`Message ${worker.user.name}`}>
                <MessageSquare aria-hidden />
                <span className="sr-only sm:not-sr-only">Message</span>
              </Button>
              <Button variant="action" size="sm">
                <Send aria-hidden />
                Invite
              </Button>
            </>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link href={href}>View profile</Link>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

export function WorkerGrid({
  workers,
  variant,
  className,
}: {
  workers: WorkerProfile[];
  variant?: WorkerCardProps['variant'];
  className?: string;
}) {
  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-3', className)}>
      {workers.map((worker) => (
        <WorkerCard key={worker.id} worker={worker} variant={variant} />
      ))}
    </div>
  );
}
