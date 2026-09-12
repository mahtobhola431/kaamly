'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SeedCity, Skill } from '@rokdajob/shared';
import { MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  cities: readonly SeedCity[];
  skills?: Skill[];
  /** Which side of the marketplace the search sends you to. */
  mode?: 'workers' | 'jobs';
  /** Lets the visitor flip between finding workers and finding work. */
  showModeToggle?: boolean;
  defaultQuery?: string;
  defaultCity?: string;
  className?: string;
  size?: 'default' | 'lg';
}

/**
 * Structured search: a trade in one field, a place in the other.
 *
 * Deliberately not a single free-text box — "electrician in Andheri" typed into one field
 * is ambiguous, and the brief calls for a reliable structured search before anything
 * cleverer (docs/02-API.md, brief §16).
 */
export function SearchBar({
  cities,
  mode: initialMode = 'workers',
  showModeToggle = false,
  defaultQuery = '',
  defaultCity = '',
  className,
  size = 'default',
}: SearchBarProps) {
  const router = useRouter();
  const [mode, setMode] = useState(initialMode);
  const [query, setQuery] = useState(defaultQuery);
  const [city, setCity] = useState(defaultCity);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (city) params.set('city', city);
    const search = params.toString();
    router.push(`/${mode}${search ? `?${search}` : ''}`);
  }

  const tall = size === 'lg';

  return (
    <div className={cn('w-full', className)}>
      {showModeToggle ? (
        <div
          role="tablist"
          aria-label="What are you looking for?"
          className="bg-muted mb-3 inline-flex rounded-md p-1"
        >
          {(
            [
              ['workers', 'I need workers'],
              ['jobs', 'I need work'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={mode === value}
              onClick={() => setMode(value)}
              className={cn(
                'rounded-sm px-3 py-1.5 text-sm font-medium transition-colors',
                mode === value
                  ? 'bg-card text-foreground shadow-[var(--shadow-card)]'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}

      <form
        onSubmit={submit}
        className={cn(
          'bg-card grid gap-2 rounded-lg border p-2 shadow-[var(--shadow-card)]',
          'sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-0',
        )}
      >
        <div className="relative">
          <Search
            className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={
              mode === 'workers' ? 'Electrician, mason, helper…' : 'Helper, driver, packer…'
            }
            aria-label={mode === 'workers' ? 'Skill or trade' : 'Work you are looking for'}
            className={cn(
              'border-0 pl-9 shadow-none focus-visible:ring-0',
              tall && 'h-12 text-base',
            )}
          />
        </div>

        <div className="relative sm:border-l">
          <MapPin
            className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Select value={city} onValueChange={setCity}>
            <SelectTrigger
              aria-label="City"
              className={cn(
                'w-full border-0 pl-9 shadow-none focus-visible:ring-0 sm:w-48',
                tall && 'h-12! text-base',
              )}
            >
              <SelectValue placeholder="Any city" />
            </SelectTrigger>
            <SelectContent>
              {cities.map((option) => (
                <SelectItem key={option.slug} value={option.slug}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" variant="action" size={tall ? 'lg' : 'default'} className="sm:ml-2">
          <Search aria-hidden />
          {mode === 'workers' ? 'Find workers' : 'Find work'}
        </Button>
      </form>
    </div>
  );
}
