import type { Metadata } from 'next';
import {
  CircleCheck,
  CircleX,
  FilePlus2,
  MessageSquare,
  Star,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import type { ActivityEvent } from '@/lib/data/employer';
import { demoAgo, demoDate } from '@/data/time';
import { getEmployerActivity } from '@/lib/data/employer';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Activity',
  robots: { index: false, follow: false },
};

const ICONS: Record<ActivityEvent['kind'], { icon: typeof UserPlus; tone: string }> = {
  APPLIED: { icon: UserPlus, tone: 'bg-muted text-muted-foreground' },
  SHORTLISTED: { icon: UserCheck, tone: 'bg-action-subtle text-action-hover' },
  CONTACTED: { icon: MessageSquare, tone: 'bg-navy-50 text-navy-700' },
  HIRED: { icon: CircleCheck, tone: 'bg-success-subtle text-success' },
  REJECTED: { icon: CircleX, tone: 'bg-destructive-subtle text-destructive' },
  POSTED: { icon: FilePlus2, tone: 'bg-navy-50 text-navy-700' },
  REVIEW: { icon: Star, tone: 'bg-action-subtle text-action-hover' },
};

export default async function ActivityPage() {
  const activity = await getEmployerActivity();

  const byDay = activity.reduce<Record<string, ActivityEvent[]>>((groups, event) => {
    const day = demoDate(event.at);
    groups[day] = [...(groups[day] ?? []), event];
    return groups;
  }, {});

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold sm:text-2xl">Activity</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Everything that has happened across your jobs, newest first.
      </p>

      <div className="mt-6 space-y-8">
        {Object.entries(byDay).map(([day, events]) => (
          <section key={day} aria-labelledby={`day-${day}`}>
            <h2
              id={`day-${day}`}
              className="text-muted-foreground text-xs font-semibold uppercase tracking-wide"
            >
              {day}
            </h2>

            <ol className="mt-3 space-y-0">
              {events.map((event, index) => {
                const { icon: Icon, tone } = ICONS[event.kind];
                const last = index === events.length - 1;

                return (
                  <li key={event.id} className="relative flex gap-3 pb-4">
                    {!last ? (
                      <span
                        aria-hidden
                        className="bg-border absolute bottom-0 left-[15px] top-9 w-px"
                      />
                    ) : null}

                    <span
                      className={cn(
                        'relative flex size-8 shrink-0 items-center justify-center rounded-full',
                        tone,
                      )}
                    >
                      <Icon className="size-4" aria-hidden />
                    </span>

                    <div className="min-w-0 flex-1 pt-1">
                      <p className="text-sm">
                        <span className="font-medium">{event.actor}</span> {event.summary}{' '}
                        <span className="text-muted-foreground">{event.context}</span>
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-xs">{demoAgo(event.at)}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
