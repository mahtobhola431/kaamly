import type { Metadata } from 'next';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { EmptyState } from '@/components/feedback/empty-state';
import { Button } from '@/components/ui/button';
import { demoAgo } from '@/data/time';
import { getNotifications } from '@/lib/data/messaging';
import { routes } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'Notifications',
  robots: { index: false, follow: false },
};

export default async function WorkerNotificationsPage() {
  const notifications = await getNotifications('worker');
  const unread = notifications.filter((notification) => notification.readAt === null);

  return (
    <div className="max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Notifications</h1>
          <p className="text-muted-foreground mt-1 text-sm" data-numeric>
            {unread.length} unread of {notifications.length}
          </p>
        </div>
        {unread.length > 0 ? (
          <Button variant="outline" size="sm">
            Mark all read
          </Button>
        ) : null}
      </div>

      <div className="mt-5">
        {notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="Nothing yet"
            description="You will be told here when a job matching your trade is posted nearby, or an employer responds to you."
            actions={[{ label: 'Find work near you', href: routes.w.jobs, variant: 'action' }]}
          />
        ) : (
          <ul className="bg-card divide-y overflow-hidden rounded-lg border">
            {notifications.map((notification) => (
              <li key={notification.id}>
                <Link
                  href={String(notification.data.href ?? routes.w.home)}
                  className={
                    notification.readAt === null
                      ? 'bg-action-subtle/40 hover:bg-accent/60 flex gap-3 px-4 py-3.5 transition-colors'
                      : 'hover:bg-accent/60 flex gap-3 px-4 py-3.5 transition-colors'
                  }
                >
                  <span
                    aria-hidden
                    className={
                      notification.readAt === null
                        ? 'bg-action mt-1.5 size-2 shrink-0 rounded-full'
                        : 'bg-border mt-1.5 size-2 shrink-0 rounded-full'
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{notification.title}</p>
                    <p className="text-muted-foreground mt-0.5 text-sm leading-relaxed">
                      {notification.body}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {demoAgo(notification.createdAt)}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
