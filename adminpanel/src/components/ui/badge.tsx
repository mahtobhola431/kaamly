import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ApprovalStatus } from '@rokdajob/shared';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
  {
    variants: {
      tone: {
        neutral: 'bg-muted text-muted-foreground border-transparent',
        pending: 'bg-warning/15 text-warning-foreground border-warning/30',
        approved: 'bg-success-subtle text-success border-success/30',
        rejected: 'bg-destructive-subtle text-destructive border-destructive/30',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone, className }))} {...props} />;
}

const APPROVAL_TONE = {
  PENDING: 'pending',
  APPROVED: 'approved',
  AUTO_APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

const APPROVAL_LABEL = {
  PENDING: 'Pending review',
  APPROVED: 'Approved',
  AUTO_APPROVED: 'Approved',
  REJECTED: 'Rejected',
} as const;

export function ApprovalBadge({ status }: { status: ApprovalStatus }) {
  return <Badge tone={APPROVAL_TONE[status]}>{APPROVAL_LABEL[status]}</Badge>;
}
