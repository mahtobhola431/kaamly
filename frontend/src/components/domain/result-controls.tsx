'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import type { PaginationMeta } from '@rokdajob/shared';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQueryParams } from '@/hooks/use-query-params';
import { cn } from '@/lib/utils';

export interface SortOption {
  value: string;
  label: string;
}

export function SortSelect({
  options,
  defaultValue,
}: {
  options: SortOption[];
  defaultValue: string;
}) {
  const { get, setParams } = useQueryParams();
  const value = get('sort') ?? defaultValue;

  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground hidden text-sm sm:inline">Sort by</span>
      <Select value={value} onValueChange={(next) => setParams({ sort: next })}>
        <SelectTrigger size="sm" className="w-[170px]" aria-label="Sort results">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Link-based pagination so it works without JavaScript — important on the low-end
 * devices this product targets.
 */
export function Pagination({ meta, className }: { meta: PaginationMeta; className?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (meta.totalPages <= 1) return null;

  const hrefFor = (page: number): string => {
    const next = new URLSearchParams(searchParams.toString());
    if (page <= 1) next.delete('page');
    else next.set('page', String(page));
    const query = next.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const pages = Array.from({ length: meta.totalPages }, (_, index) => index + 1).filter(
    (page) => page === 1 || page === meta.totalPages || Math.abs(page - meta.page) <= 1,
  );

  return (
    <nav
      aria-label="Pagination"
      className={cn('flex items-center justify-center gap-1', className)}
    >
      <Button
        asChild={meta.page > 1}
        variant="outline"
        size="icon-sm"
        disabled={meta.page === 1}
        aria-label="Previous page"
      >
        {meta.page > 1 ? (
          <Link href={hrefFor(meta.page - 1)}>
            <ChevronLeft aria-hidden />
          </Link>
        ) : (
          <span>
            <ChevronLeft aria-hidden />
          </span>
        )}
      </Button>

      {pages.map((page, index) => {
        const previous = pages[index - 1];
        const gap = previous !== undefined && page - previous > 1;
        return (
          <span key={page} className="flex items-center gap-1">
            {gap ? <span className="text-muted-foreground px-1">…</span> : null}
            <Button
              asChild
              variant={page === meta.page ? 'default' : 'outline'}
              size="icon-sm"
              aria-current={page === meta.page ? 'page' : undefined}
            >
              <Link href={hrefFor(page)} data-numeric>
                {page}
              </Link>
            </Button>
          </span>
        );
      })}

      <Button
        asChild={meta.hasMore}
        variant="outline"
        size="icon-sm"
        disabled={!meta.hasMore}
        aria-label="Next page"
      >
        {meta.hasMore ? (
          <Link href={hrefFor(meta.page + 1)}>
            <ChevronRight aria-hidden />
          </Link>
        ) : (
          <span>
            <ChevronRight aria-hidden />
          </span>
        )}
      </Button>
    </nav>
  );
}

export function ResultCount({ meta, noun }: { meta: PaginationMeta; noun: string }) {
  if (meta.total === 0) return null;
  const from = (meta.page - 1) * meta.limit + 1;
  const to = Math.min(meta.page * meta.limit, meta.total);
  return (
    <p className="text-muted-foreground text-sm" data-numeric>
      Showing {from}–{to} of {meta.total} {noun}
    </p>
  );
}
