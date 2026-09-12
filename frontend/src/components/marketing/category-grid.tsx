import Link from 'next/link';
import type { Category } from '@rokdajob/shared';
import {
  AirVent,
  ChefHat,
  Droplets,
  HardHat,
  PackageOpen,
  Truck,
  Users,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/** Category icons are named in the database, so this map is the only client-side coupling. */
const ICONS: Record<string, LucideIcon> = {
  HardHat,
  Zap,
  Droplets,
  Wrench,
  PackageOpen,
  ChefHat,
  AirVent,
  Truck,
  Users,
};

export function CategoryGrid({
  categories,
  counts,
  buildHref = (slug: string) => `/jobs?category=${slug}`,
  className,
}: {
  categories: Category[];
  counts?: Record<string, number>;
  /** Where a category tile points. City pages send it to their own SEO route. */
  buildHref?: (slug: string) => string;
  className?: string;
}) {
  return (
    <div className={cn('grid gap-3 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {categories.map((category) => {
        const Icon = ICONS[category.icon] ?? Users;
        const count = counts?.[category.slug];

        return (
          <Link
            key={category.id}
            href={buildHref(category.slug)}
            className="bg-card hover:border-action/50 group flex items-start gap-3 rounded-lg border p-4 transition-all hover:shadow-[var(--shadow-raised)]"
          >
            <span className="bg-navy-50 text-navy-700 group-hover:bg-action-subtle group-hover:text-action-hover flex size-10 shrink-0 items-center justify-center rounded-md transition-colors">
              <Icon className="size-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2">
                <span className="font-semibold">{category.name}</span>
                {count !== undefined ? (
                  <span className="text-muted-foreground text-xs" data-numeric>
                    {count} job{count === 1 ? '' : 's'}
                  </span>
                ) : null}
              </span>
              <span className="text-muted-foreground mt-0.5 block text-sm">
                {category.description}
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
