'use client';

import type { ReactNode } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useQueryParams } from '@/hooks/use-query-params';
import { cn } from '@/lib/utils';

/** Building blocks shared by the worker and job filter panels. */

export function FilterSection({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('border-b py-4 first:pt-0 last:border-b-0', className)}>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide">{title}</h3>
      {children}
    </section>
  );
}

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export function CheckboxFilter({
  param,
  options,
  columns = 1,
}: {
  param: string;
  options: FilterOption[];
  columns?: 1 | 2;
}) {
  const { has, toggleParam } = useQueryParams();

  return (
    <div className={cn('grid gap-2.5', columns === 2 && 'sm:grid-cols-2')}>
      {options.map((option) => {
        const id = `${param}-${option.value}`;
        return (
          <div key={option.value} className="flex items-center gap-2.5">
            <Checkbox
              id={id}
              checked={has(param, option.value)}
              onCheckedChange={() => toggleParam(param, option.value)}
            />
            <Label htmlFor={id} className="flex-1 cursor-pointer text-sm font-normal">
              {option.label}
            </Label>
            {option.count !== undefined ? (
              <span className="text-muted-foreground text-xs" data-numeric>
                {option.count}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function RadioFilter({
  param,
  options,
  allLabel = 'Any',
}: {
  param: string;
  options: FilterOption[];
  allLabel?: string;
}) {
  const { get, setParams } = useQueryParams();
  const current = get(param) ?? '';

  return (
    <RadioGroup
      value={current}
      onValueChange={(value) => setParams({ [param]: value || null })}
      className="gap-2.5"
    >
      <div className="flex items-center gap-2.5">
        <RadioGroupItem value="" id={`${param}-any`} />
        <Label htmlFor={`${param}-any`} className="cursor-pointer text-sm font-normal">
          {allLabel}
        </Label>
      </div>
      {options.map((option) => (
        <div key={option.value} className="flex items-center gap-2.5">
          <RadioGroupItem value={option.value} id={`${param}-${option.value}`} />
          <Label
            htmlFor={`${param}-${option.value}`}
            className="cursor-pointer text-sm font-normal"
          >
            {option.label}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}

/** Desktop: a sticky column. Mobile: a sheet behind a "Filters" button. */
export function FilterShell({
  children,
  activeCount,
  keepOnClear = [],
  className,
}: {
  children: ReactNode;
  activeCount: number;
  /** Params that survive "Clear all" — usually the city you are browsing. */
  keepOnClear?: string[];
  className?: string;
}) {
  const { clearAll } = useQueryParams();

  const body = (
    <div className="divide-border">
      <div className="mb-2 flex items-center justify-between lg:mb-4">
        <p className="text-sm font-semibold">
          Filters
          {activeCount > 0 ? (
            <span className="text-muted-foreground ml-1.5 font-normal" data-numeric>
              ({activeCount})
            </span>
          ) : null}
        </p>
        {activeCount > 0 ? (
          <Button variant="ghost" size="xs" onClick={() => clearAll(keepOnClear)}>
            <X aria-hidden />
            Clear all
          </Button>
        ) : null}
      </div>
      {children}
    </div>
  );

  return (
    <>
      <aside
        className={cn(
          'bg-card hidden h-fit rounded-lg border p-4 lg:sticky lg:top-20 lg:block',
          className,
        )}
        aria-label="Filters"
      >
        {body}
      </aside>

      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              <SlidersHorizontal aria-hidden />
              Filters
              {activeCount > 0 ? (
                <span
                  className="bg-action text-action-foreground ml-1 rounded-full px-1.5 text-xs font-semibold"
                  data-numeric
                >
                  {activeCount}
                </span>
              ) : null}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
              <SheetDescription>Narrow down what you are looking for.</SheetDescription>
            </SheetHeader>
            <div className="px-4 pb-8">{body}</div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
