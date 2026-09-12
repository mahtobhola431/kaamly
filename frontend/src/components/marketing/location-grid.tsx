import Link from 'next/link';
import type { SeedCity } from '@rokdajob/shared';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LocationGrid({
  cities,
  workerCounts,
  jobCounts,
  className,
}: {
  cities: readonly SeedCity[];
  workerCounts?: Record<string, number>;
  jobCounts?: Record<string, number>;
  className?: string;
}) {
  return (
    <div className={cn('grid gap-3 sm:grid-cols-2 lg:grid-cols-4', className)}>
      {cities.map((city) => (
        <Link
          key={city.slug}
          href={`/jobs/${city.slug}`}
          className="bg-card hover:border-action/50 group rounded-lg border p-4 transition-all hover:shadow-[var(--shadow-raised)]"
        >
          <div className="flex items-center gap-2">
            <MapPin className="text-muted-foreground group-hover:text-action size-4" aria-hidden />
            <span className="font-semibold">{city.name}</span>
          </div>
          <p className="text-muted-foreground mt-0.5 text-xs">{city.state}</p>
          <p className="text-muted-foreground mt-3 text-sm" data-numeric>
            {jobCounts?.[city.slug] ?? 0} jobs · {workerCounts?.[city.slug] ?? 0} workers
          </p>
          <p className="text-muted-foreground mt-2 truncate text-xs">
            {city.localities
              .slice(0, 3)
              .map((locality) => locality.name)
              .join(' · ')}
          </p>
        </Link>
      ))}
    </div>
  );
}
