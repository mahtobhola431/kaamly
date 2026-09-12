import {
  APPLICATION_STAGE_LABEL,
  AVAILABILITY_LABEL,
  JOB_STATUS_LABEL,
  URGENCY_LABEL,
} from '@rokdajob/shared';
import type {
  ApplicationStage,
  Availability,
  JobStatus,
  Urgency,
  WorkerVerification,
} from '@rokdajob/shared';
import { BadgeCheck, Building2, Clock, Flame, ShieldCheck, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Status vocabulary in one file.
 *
 * Colour carries meaning here: green is verified or available, amber is action or
 * urgency, navy is in-flight, muted is inert, red is only ever a failure.
 */

/* --------------------------------------------------------------- availability */

const AVAILABILITY_STYLE: Record<Availability, string> = {
  AVAILABLE_NOW: 'bg-success-subtle text-success border-success/25',
  AVAILABLE_FROM: 'bg-action-subtle text-action-hover border-action/25',
  BUSY: 'bg-muted text-muted-foreground',
  NOT_LOOKING: 'bg-muted text-muted-foreground',
};

export function AvailabilityBadge({
  availability,
  className,
}: {
  availability: Availability;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border border-transparent px-2 py-0.5 text-xs font-medium',
        AVAILABILITY_STYLE[availability],
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'size-1.5 rounded-full',
          availability === 'AVAILABLE_NOW' ? 'bg-success' : 'bg-current opacity-60',
        )}
      />
      {AVAILABILITY_LABEL[availability]}
    </span>
  );
}

/* ------------------------------------------------------------------ job status */

const JOB_STATUS_VARIANT: Record<JobStatus, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  PUBLISHED: 'bg-action-subtle text-action-hover border-action/25',
  HIRING: 'bg-action-subtle text-action-hover border-action/25',
  PAUSED: 'bg-transparent text-muted-foreground border-border',
  FILLED: 'bg-success-subtle text-success border-success/25',
  IN_PROGRESS: 'bg-navy-50 text-navy-700 border-navy-200',
  COMPLETED: 'bg-success-subtle text-success border-success/25',
  CANCELLED: 'bg-muted text-muted-foreground line-through',
  EXPIRED: 'bg-muted text-muted-foreground',
};

export function JobStatusBadge({ status, className }: { status: JobStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-md border border-transparent px-2 py-0.5 text-xs font-medium',
        JOB_STATUS_VARIANT[status],
        className,
      )}
    >
      {JOB_STATUS_LABEL[status]}
    </span>
  );
}

/* ----------------------------------------------------------- application stage */

const STAGE_STYLE: Record<ApplicationStage, string> = {
  APPLIED: 'bg-muted text-muted-foreground',
  REVIEWED: 'bg-navy-50 text-navy-600 border-navy-100',
  SHORTLISTED: 'bg-action-subtle text-action-hover border-action/25',
  CONTACTED: 'bg-navy-50 text-navy-700 border-navy-200',
  INTERVIEW: 'bg-navy-100 text-navy-700 border-navy-200',
  SELECTED: 'bg-success-subtle text-success border-success/25',
  HIRED: 'bg-success text-success-foreground',
  REJECTED: 'bg-transparent text-destructive border-destructive/30',
  WITHDRAWN: 'bg-muted text-muted-foreground',
};

export function StageBadge({ stage, className }: { stage: ApplicationStage; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-md border border-transparent px-2 py-0.5 text-xs font-medium',
        STAGE_STYLE[stage],
        className,
      )}
    >
      {APPLICATION_STAGE_LABEL[stage]}
    </span>
  );
}

/** Column accent used by the pipeline board headers. */
export const STAGE_ACCENT: Record<ApplicationStage, string> = {
  APPLIED: 'bg-muted-foreground/40',
  REVIEWED: 'bg-navy-300',
  SHORTLISTED: 'bg-action',
  CONTACTED: 'bg-navy-400',
  INTERVIEW: 'bg-navy-600',
  SELECTED: 'bg-success/60',
  HIRED: 'bg-success',
  REJECTED: 'bg-destructive/50',
  WITHDRAWN: 'bg-muted-foreground/30',
};

/* --------------------------------------------------------------------- urgency */

export function UrgencyBadge({ urgency, className }: { urgency: Urgency; className?: string }) {
  if (urgency === 'NORMAL') return null;
  return (
    <Badge variant="action" className={cn('gap-1', className)}>
      <Flame aria-hidden />
      {URGENCY_LABEL[urgency]}
    </Badge>
  );
}

/* ---------------------------------------------------------------- verification */

/**
 * Only claims what the platform actually checks (docs/06-RISKS.md, brief §47).
 * There is deliberately no "government verified" badge.
 */
export function VerificationBadges({
  verification,
  className,
  compact = false,
}: {
  verification: WorkerVerification;
  className?: string;
  compact?: boolean;
}) {
  const badges = [
    verification.profile && {
      key: 'profile',
      icon: BadgeCheck,
      label: 'Profile verified',
      short: 'Verified',
    },
    verification.phone && {
      key: 'phone',
      icon: ShieldCheck,
      label: 'Phone verified',
      short: 'Phone',
    },
    verification.documents && {
      key: 'documents',
      icon: BadgeCheck,
      label: 'Documents verified',
      short: 'Docs',
    },
  ].filter(Boolean) as { key: string; icon: typeof BadgeCheck; label: string; short: string }[];

  if (badges.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {badges.map((badge) => (
        <span
          key={badge.key}
          className="text-success bg-success-subtle border-success/20 inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium"
          title={badge.label}
        >
          <badge.icon className="size-3" aria-hidden />
          {compact ? badge.short : badge.label}
        </span>
      ))}
    </div>
  );
}

export function CompanyVerifiedBadge({ verified }: { verified: boolean }) {
  if (!verified) return null;
  return (
    <span
      className="text-success inline-flex items-center gap-1 text-xs font-medium"
      title="Company details verified by rokdajob"
    >
      <Building2 className="size-3.5" aria-hidden />
      Verified company
    </span>
  );
}

/* ------------------------------------------------------------------- qualities */

export function TopRatedBadge({ rating, count }: { rating: number; count: number }) {
  if (rating < 4.7 || count < 25) return null;
  return (
    <Badge variant="action" className="gap-1">
      <Star aria-hidden />
      Top rated
    </Badge>
  );
}

export function RecentlyActiveBadge({ lastActiveAt }: { lastActiveAt?: string }) {
  if (!lastActiveAt) return null;
  return (
    <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
      <Clock className="size-3" aria-hidden />
      Recently active
    </span>
  );
}
