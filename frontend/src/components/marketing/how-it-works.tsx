'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface Step {
  title: string;
  body: string;
}

/**
 * One component, two audiences. Employers and workers want different four-step stories,
 * and putting them behind a toggle keeps the landing page from telling both at once.
 */
export function HowItWorks({
  employerSteps,
  workerSteps,
}: {
  employerSteps: Step[];
  workerSteps: Step[];
}) {
  const [audience, setAudience] = useState<'employer' | 'worker'>('employer');
  const steps = audience === 'employer' ? employerSteps : workerSteps;

  return (
    <div>
      <div
        role="tablist"
        aria-label="Choose your side"
        className="bg-muted mb-8 inline-flex rounded-md p-1"
      >
        {(
          [
            ['employer', 'I am hiring'],
            ['worker', 'I am looking for work'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={audience === value}
            onClick={() => setAudience(value)}
            className={cn(
              'rounded-sm px-4 py-2 text-sm font-medium transition-colors',
              audience === value
                ? 'bg-card text-foreground shadow-[var(--shadow-card)]'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <ol className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => (
          <li key={step.title} className="relative">
            <span
              aria-hidden
              className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md text-sm font-bold"
            >
              {index + 1}
            </span>
            {index < steps.length - 1 ? (
              <span
                aria-hidden
                className="bg-border absolute left-10 top-4 hidden h-px w-[calc(100%-2.5rem)] lg:block"
              />
            ) : null}
            <h3 className="mt-3 font-semibold">{step.title}</h3>
            <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{step.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
