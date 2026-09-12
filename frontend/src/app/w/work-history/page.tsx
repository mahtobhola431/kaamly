import type { Metadata } from 'next';
import { CircleCheck } from 'lucide-react';
import { demoDate } from '@/data/time';
import { getWorkHistory } from '@/lib/data/worker-area';

export const metadata: Metadata = {
  title: 'Work history',
  robots: { index: false, follow: false },
};

export default async function WorkHistoryPage() {
  const history = await getWorkHistory();
  const totalDays = history.reduce((sum, entry) => sum + entry.daysWorked, 0);

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold sm:text-2xl">Work history</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Jobs completed through rokdajob are marked verified. You can add earlier work yourself.
      </p>

      <p className="text-muted-foreground mt-4 text-sm" data-numeric>
        {history.length} entries · {totalDays} days worked
      </p>

      <ol className="mt-5 space-y-3">
        {history.map((entry) => (
          <li key={entry.id} className="bg-card rounded-lg border p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium">{entry.role}</p>
                <p className="text-muted-foreground text-sm">{entry.company}</p>
              </div>
              {entry.verified ? (
                <span className="text-success inline-flex items-center gap-1 text-xs font-medium">
                  <CircleCheck className="size-3.5" aria-hidden />
                  Verified
                </span>
              ) : (
                <span className="text-muted-foreground text-xs">Self reported</span>
              )}
            </div>
            <p className="text-muted-foreground mt-2 text-sm" data-numeric>
              {demoDate(entry.from)} – {demoDate(entry.to)} · {entry.daysWorked} days ·{' '}
              {entry.location}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
