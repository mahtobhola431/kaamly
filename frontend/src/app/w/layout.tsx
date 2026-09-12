import Link from 'next/link';
import { MapPin, Search } from 'lucide-react';
import { AvailabilityToggle } from '@/components/domain/availability-toggle';
import { UserAvatar } from '@/components/domain/user-avatar';
import { Logo } from '@/components/layout/logo';
import { NotificationMenu } from '@/components/layout/notification-menu';
import { WorkerBottomNav, WorkerSideNav } from '@/components/layout/worker-bottom-nav';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { getNotifications, getUnreadMessageCount } from '@/lib/data/messaging';
import { getCurrentWorker } from '@/lib/data/worker-area';
import { routes } from '@/lib/routes';

/**
 * Worker app shell.
 *
 * Mobile-first: a compact header carrying the three things that matter on arrival —
 * where you are, whether you are available, and what is new — plus bottom navigation.
 * The desktop rail exists so the same app is usable on a laptop without a second design.
 */
export default async function WorkerLayout({ children }: LayoutProps<'/w'>) {
  const [worker, notifications, unreadMessages] = await Promise.all([
    getCurrentWorker(),
    getNotifications('worker'),
    getUnreadMessageCount('worker'),
  ]);

  return (
    <div className="flex min-h-svh flex-col">
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/85 sticky top-0 z-30 border-b backdrop-blur">
        <div className="container-dashboard flex h-14 items-center gap-3">
          <Logo showWordmark={false} href={routes.w.home} className="md:hidden" />
          <Logo href={routes.w.home} className="hidden md:flex" />

          <Link
            href={routes.w.editProfile}
            className="text-muted-foreground hover:text-foreground inline-flex min-w-0 items-center gap-1 rounded-md text-sm"
          >
            <MapPin className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{worker.location.locality ?? worker.location.city}</span>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="ghost" size="icon-sm" className="sm:hidden">
              <Link href={routes.w.jobs} aria-label="Search jobs">
                <Search aria-hidden />
              </Link>
            </Button>
            <div className="hidden sm:block">
              <AvailabilityToggle initial={worker.availability} />
            </div>
            <NotificationMenu notifications={notifications} allHref={routes.w.notifications} />
            <Link href={routes.w.profile} aria-label="Your profile">
              <UserAvatar user={worker.user} size="sm" />
            </Link>
          </div>
        </div>

        <div className="container-dashboard pb-3 sm:hidden">
          <AvailabilityToggle initial={worker.availability} />
        </div>
      </header>

      <div className="container-dashboard flex flex-1 gap-6 py-5">
        <WorkerSideNav unreadMessages={unreadMessages} />
        <main id="main" className="min-w-0 flex-1 pb-20 md:pb-0">
          {children}
        </main>
      </div>

      <WorkerBottomNav unreadMessages={unreadMessages} />
      <Toaster />
    </div>
  );
}
