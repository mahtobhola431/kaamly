import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Providers } from '@/app/providers';
import { AccountMenu } from '@/components/layout/account-menu';
import { CommandMenu } from '@/components/layout/command-menu';
import { EmployerSidebar } from '@/components/layout/employer-sidebar';
import { NotificationMenu } from '@/components/layout/notification-menu';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { getNotifications } from '@/lib/data/messaging';
import { routes } from '@/lib/routes';

/**
 * Employer CRM shell: navy sidebar, sticky top bar, dense content area.
 *
 * Desktop-first on purpose — employers manage dozens of applicants across several sites,
 * which is table-and-board work, not thumb work.
 *
 * The shell reads nothing about the contractor itself. Their company and identity come
 * from `/employer/*` inside the sidebar and the account menu, which is why `Providers`
 * wraps the whole layout rather than just the page: the chrome runs queries too.
 */
export default async function EmployerLayout({ children }: LayoutProps<'/e'>) {
  // Notifications are the last part of this shell still on static data — `/notifications`
  // is a later phase (docs/02-API.md).
  const notifications = await getNotifications('employer');

  return (
    <Providers>
      <div className="flex min-h-svh">
        <EmployerSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="bg-background/95 supports-[backdrop-filter]:bg-background/85 sticky top-0 z-30 border-b backdrop-blur">
            <div className="flex h-14 items-center gap-3 px-4 lg:px-6">
              <CommandMenu />

              <div className="ml-auto flex items-center gap-2">
                <Button asChild variant="action" size="sm">
                  <Link href={routes.e.newJob}>
                    <Plus aria-hidden />
                    <span className="hidden sm:inline">Post a job</span>
                  </Link>
                </Button>

                <NotificationMenu notifications={notifications} allHref={routes.e.activity} />

                <AccountMenu />
              </div>
            </div>
          </header>

          <main id="main" className="min-w-0 flex-1 px-4 py-6 lg:px-6">
            {children}
          </main>
        </div>

        <Toaster />
      </div>
    </Providers>
  );
}
