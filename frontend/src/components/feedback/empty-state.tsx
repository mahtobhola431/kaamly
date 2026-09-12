import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateAction {
  label: string;
  /** Always a link: EmptyState is a server component, so it cannot carry click handlers. */
  href: string;
  variant?: 'action' | 'outline' | 'secondary';
}

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  /** Say what to do next, not just that nothing was found. */
  description?: string;
  actions?: EmptyStateAction[];
  className?: string;
  /** Renders inside a card instead of bare, for use inside a page section. */
  bordered?: boolean;
}

/**
 * Empty states always offer a way forward — widening a radius, clearing a filter, posting
 * a job. A blank screen with "No results" is treated as a bug in this codebase.
 */
export function EmptyState({
  icon: Icon = SearchX,
  title,
  description,
  actions,
  className,
  bordered = true,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-6 py-14 text-center',
        bordered && 'bg-card rounded-lg border border-dashed',
        className,
      )}
    >
      <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full">
        <Icon className="size-5" aria-hidden />
      </div>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      {description ? (
        <p className="text-muted-foreground mt-1.5 max-w-sm text-sm">{description}</p>
      ) : null}
      {actions?.length ? (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {actions.map((action) => (
            <Button key={action.label} asChild variant={action.variant ?? 'outline'} size="sm">
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
