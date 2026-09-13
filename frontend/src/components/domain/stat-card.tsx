import type { LucideIcon } from 'lucide-react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { AnimatedNumber } from '@/components/domain/animated-number';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: number | string;
  suffix?: string;
  icon?: LucideIcon;
  /** Percentage change against the previous period. */
  delta?: number;
  hint?: string;
  className?: string;
  /** Counts up on first paint. Off by default; used on marketing pages only. */
  animate?: boolean;
}

/**
 * Server component on purpose.
 *
 * Callers pass a Lucide icon component as a prop, and React cannot serialise a component
 * across the server/client boundary — so only the count-up animation is a client island
 * (`AnimatedNumber`), not the whole card.
 */
export function StatCard({
  label,
  value,
  suffix,
  icon: Icon,
  delta,
  hint,
  className,
  animate = false,
}: StatCardProps) {
  const isNumeric = typeof value === 'number';

  return (
    <div className={cn('bg-card rounded-lg border p-4 shadow-[var(--shadow-card)]', className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
          {label}
        </p>
        {Icon ? <Icon className="text-muted-foreground size-4 shrink-0" aria-hidden /> : null}
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-muted-foreground" data-numeric>
          {animate && isNumeric ? (
            <AnimatedNumber value={value} suffix={suffix} />
          ) : (
            <>
              {isNumeric ? value.toLocaleString('en-IN') : value}
              {suffix}
            </>
          )}
        </span>

        {delta !== undefined ? (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-xs font-medium',
              delta >= 0 ? 'text-success' : 'text-destructive',
            )}
            data-numeric
          >
            {delta >= 0 ? (
              <TrendingUp className="size-3" aria-hidden />
            ) : (
              <TrendingDown className="size-3" aria-hidden />
            )}
            {Math.abs(delta)}%
          </span>
        ) : null}
      </div>

      {hint ? <p className="text-muted-foreground mt-1 text-xs">{hint}</p> : null}
    </div>
  );
}
