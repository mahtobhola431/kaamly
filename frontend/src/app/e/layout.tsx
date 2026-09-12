import Link from 'next/link';
import { Plus } from 'lucide-react';
import { SignOutMenuItem } from '@/components/auth/sign-out';
import { UserAvatar } from '@/components/domain/user-avatar';
import { CommandMenu } from '@/components/layout/command-menu';
import { EmployerSidebar } from '@/components/layout/employer-sidebar';
import { NotificationMenu } from '@/components/layout/notification-menu';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Toaster } from '@/components/ui/sonner';
import { getCurrentEmployer } from '@/lib/data/employer';
import { getNotifications, getUnreadMessageCount } from '@/lib/data/messaging';
import { routes } from '@/lib/routes';

/**
 * Employer CRM shell: navy sidebar, sticky top bar, dense content area.
 *
 * Desktop-first on purpose — employers manage dozens of applicants across several sites,
 * which is table-and-board work, not thumb work.
 */
export default async function EmployerLayout({ children }: LayoutProps<'/e'>) {
  const [employer, notifications, unreadMessages] = await Promise.all([
    getCurrentEmployer(),
    getNotifications('employer'),
    getUnreadMessageCount('employer'),
  ]);

  return (
    <div className="flex min-h-svh">
      <EmployerSidebar employer={employer} unreadMessages={unreadMessages} />

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

              <DropdownMenu>
                <DropdownMenuTrigger className="rounded-full" aria-label="Account menu">
                  <UserAvatar user={employer.user} size="sm" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <p className="font-medium">{employer.user.name}</p>
                    <p className="text-muted-foreground text-xs font-normal">
                      {employer.company.name}
                    </p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={routes.e.company}>Company profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={routes.e.settings}>Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={routes.home}>Back to site</Link>
                  </DropdownMenuItem>
                  <SignOutMenuItem />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main id="main" className="min-w-0 flex-1 px-4 py-6 lg:px-6">
          {children}
        </main>
      </div>

      <Toaster />
    </div>
  );
}
