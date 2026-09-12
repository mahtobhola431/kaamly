import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  rating: number;
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  /** Shows the numeric value next to the stars. */
  showValue?: boolean;
  className?: string;
}

const SIZE: Record<NonNullable<RatingStarsProps['size']>, string> = {
  sm: 'size-3',
  md: 'size-3.5',
  lg: 'size-5',
};

/**
 * Half-star rendering via a clipped overlay rather than a separate icon, so a 4.6
 * genuinely looks like 4.6.
 */
export function RatingStars({
  rating,
  count,
  size = 'md',
  showValue = true,
  className,
}: RatingStarsProps) {
  const clamped = Math.max(0, Math.min(rating, 5));
  const label = count
    ? `Rated ${clamped.toFixed(1)} out of 5 from ${count} reviews`
    : `Rated ${clamped.toFixed(1)} out of 5`;

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)} title={label}>
      <span className="relative inline-flex" aria-hidden>
        <span className="flex">
          {Array.from({ length: 5 }, (_, index) => (
            <Star key={index} className={cn(SIZE[size], 'text-border')} fill="currentColor" />
          ))}
        </span>
        <span
          className="absolute inset-0 flex overflow-hidden"
          style={{ width: `${(clamped / 5) * 100}%` }}
        >
          {Array.from({ length: 5 }, (_, index) => (
            <Star
              key={index}
              className={cn(SIZE[size], 'text-action shrink-0')}
              fill="currentColor"
            />
          ))}
        </span>
      </span>
      {showValue ? (
        <span className="text-sm font-medium" data-numeric>
          {clamped.toFixed(1)}
        </span>
      ) : null}
      {count !== undefined ? (
        <span className="text-muted-foreground text-xs" data-numeric>
          ({count})
        </span>
      ) : null}
      <span className="sr-only">{label}</span>
    </span>
  );
}
