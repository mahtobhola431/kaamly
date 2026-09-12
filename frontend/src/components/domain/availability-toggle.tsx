'use client';

import { useState } from 'react';
import { AVAILABILITY_LABEL } from '@rokdajob/shared';
import type { Availability } from '@rokdajob/shared';
import { Check, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const OPTIONS: Availability[] = ['AVAILABLE_NOW', 'AVAILABLE_FROM', 'BUSY', 'NOT_LOOKING'];

const DOT: Record<Availability, string> = {
  AVAILABLE_NOW: 'bg-success',
  AVAILABLE_FROM: 'bg-action',
  BUSY: 'bg-muted-foreground',
  NOT_LOOKING: 'bg-muted-foreground',
};

/**
 * The single most important control on the worker home screen.
 *
 * Availability drives whether the worker appears in employer search at all, so it is a
 * one-tap change and always visible — never buried in profile settings.
 */
export function AvailabilityToggle({ initial }: { initial: Availability }) {
  const [availability, setAvailability] = useState<Availability>(initial);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="bg-card hover:bg-accent/60 inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors"
        aria-label={`Your availability: ${AVAILABILITY_LABEL[availability]}. Change it.`}
      >
        <span aria-hidden className={cn('size-2 rounded-full', DOT[availability])} />
        {AVAILABILITY_LABEL[availability]}
        <ChevronDown className="text-muted-foreground size-3.5" aria-hidden />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Are you available for work?</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {OPTIONS.map((option) => (
          <DropdownMenuItem key={option} onSelect={() => setAvailability(option)} className="gap-2">
            <span aria-hidden className={cn('size-2 rounded-full', DOT[option])} />
            {AVAILABILITY_LABEL[option]}
            {availability === option ? <Check className="ml-auto size-4" aria-hidden /> : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <p className="text-muted-foreground px-2 py-1.5 text-xs leading-relaxed">
          Employers searching nearby only see workers marked available. Setting &ldquo;not
          looking&rdquo; hides you from search entirely.
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
