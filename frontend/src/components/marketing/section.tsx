import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionProps {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  action?: { href: string; label: string };
  children: ReactNode;
  className?: string;
  /** Alternate bands break up a long page without needing decoration. */
  tone?: 'default' | 'muted' | 'navy';
  align?: 'left' | 'center';
}

const TONE = {
  default: '',
  muted: 'bg-muted/50 border-y',
  navy: 'bg-primary text-primary-foreground',
} as const;

export function Section({
  id,
  eyebrow,
  title,
  description,
  action,
  children,
  className,
  tone = 'default',
  align = 'left',
}: SectionProps) {
  const headingId = id ? `${id}-title` : undefined;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn('py-16 md:py-20', TONE[tone], className)}
    >
      <div className="container-marketing">
        <div
          className={cn(
            'mb-8 flex flex-col gap-3 md:mb-10',
            align === 'center'
              ? 'items-center text-center'
              : 'md:flex-row md:items-end md:justify-between',
          )}
        >
          <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
            {eyebrow ? (
              <p
                className={cn(
                  'mb-2 text-xs font-semibold uppercase tracking-widest',
                  tone === 'navy' ? 'text-action' : 'text-muted-foreground',
                )}
              >
                {eyebrow}
              </p>
            ) : null}
            <h2 id={headingId} className="text-2xl font-bold md:text-3xl">
              {title}
            </h2>
            {description ? (
              <p
                className={cn(
                  'mt-2 text-base',
                  tone === 'navy' ? 'text-white/70' : 'text-muted-foreground',
                )}
              >
                {description}
              </p>
            ) : null}
          </div>

          {action ? (
            <Link
              href={action.href}
              className={cn(
                'group inline-flex shrink-0 items-center gap-1.5 rounded-md text-sm font-semibold',
                tone === 'navy' ? 'text-action' : 'text-primary hover:text-navy-500',
              )}
            >
              {action.label}
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          ) : null}
        </div>

        {children}
      </div>
    </section>
  );
}
