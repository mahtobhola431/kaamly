'use client';

import Link from 'next/link';
import { APPROVAL_STATUS_LABEL } from '@rokdajob/shared';
import { Briefcase, FileText, LayoutDashboard, MessageSquare, User } from 'lucide-react';
import { SignOutButton, SignOutMenuItem } from '@/components/auth/sign-out';
import { UserAvatar } from '@/components/domain/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from '@/lib/auth/use-session';
import { routes } from '@/lib/routes';

/**
 * Who is signed in, in the public header. Both roles share it — only the links differ.
 * A contractor awaiting approval gets a badge rather than a dashboard link that would
 * bounce them to the waiting screen.
 */

const WORKER_LINKS = [
  { href: routes.w.home, label: 'My dashboard', icon: LayoutDashboard },
  { href: routes.w.applications, label: 'My applications', icon: FileText },
  { href: routes.w.messages, label: 'Messages', icon: MessageSquare },
  { href: routes.w.profile, label: 'My profile', icon: User },
];

const EMPLOYER_LINKS = [
  { href: routes.e.dashboard, label: 'My dashboard', icon: LayoutDashboard },
  { href: routes.e.jobs, label: 'My jobs', icon: Briefcase },
  { href: routes.e.applicants, label: 'Applicants', icon: FileText },
  { href: routes.e.messages, label: 'Messages', icon: MessageSquare },
];

export function UserMenu() {
  const { user, loading, signedIn, canAct } = useSession();

  // A same-sized placeholder for the frame it takes to read the browser, so the header
  // does not jump and the first client render matches the server's markup.
  if (loading) {
    return <Skeleton className="size-8 rounded-full" aria-hidden />;
  }

  if (!signedIn || !user) {
    return (
      <>
        <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
          <Link href={routes.login}>Sign in</Link>
        </Button>
        <Button asChild variant="action" size="sm" className="hidden sm:inline-flex">
          <Link href={routes.chooseRole}>Get started</Link>
        </Button>
      </>
    );
  }

  const isEmployer = user.role === 'EMPLOYER' || user.role === 'ADMIN';
  const links = isEmployer ? EMPLOYER_LINKS : WORKER_LINKS;
  const pending = isEmployer && !canAct;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus-visible:ring-ring flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2">
        <UserAvatar user={user} size="sm" />
        <span className="hidden max-w-32 truncate text-sm font-medium lg:inline">
          {user.name}
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>
          <p className="truncate font-medium">{user.name}</p>
          <p className="text-muted-foreground truncate text-xs font-normal">{user.email}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-[10px]">
              {isEmployer ? 'Employer' : 'Worker'}
            </Badge>
            {pending ? (
              <Badge variant="outline" className="text-[10px]">
                {APPROVAL_STATUS_LABEL[user.approval.status]}
              </Badge>
            ) : null}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {pending ? (
          <DropdownMenuItem asChild>
            <Link href={routes.pending}>Check approval status</Link>
          </DropdownMenuItem>
        ) : (
          links.map((link) => (
            <DropdownMenuItem key={link.href} asChild>
              <Link href={link.href}>
                <link.icon aria-hidden />
                {link.label}
              </Link>
            </DropdownMenuItem>
          ))
        )}

        <DropdownMenuSeparator />
        <SignOutMenuItem />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** The same identity, laid out for the mobile navigation sheet. */
export function UserMenuMobile({ onNavigate }: { onNavigate?: () => void }) {
  const { user, loading, signedIn, canAct } = useSession();

  if (loading) return <Skeleton className="h-10 w-full rounded-md" aria-hidden />;

  if (!signedIn || !user) {
    return (
      <>
        <Button asChild variant="action" onClick={onNavigate}>
          <Link href={routes.chooseRole}>Get started</Link>
        </Button>
        <Button asChild variant="outline" onClick={onNavigate}>
          <Link href={routes.login}>Sign in</Link>
        </Button>
      </>
    );
  }

  const isEmployer = user.role === 'EMPLOYER' || user.role === 'ADMIN';
  const links = isEmployer ? EMPLOYER_LINKS : WORKER_LINKS;
  const pending = isEmployer && !canAct;

  return (
    <div className="space-y-2">
      <div className="bg-muted flex items-center gap-3 rounded-md p-3">
        <UserAvatar user={user} size="md" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{user.name}</p>
          <p className="text-muted-foreground truncate text-xs">
            {pending ? APPROVAL_STATUS_LABEL[user.approval.status] : user.email}
          </p>
        </div>
      </div>

      {pending ? (
        <Button asChild variant="outline" className="w-full" onClick={onNavigate}>
          <Link href={routes.pending}>Check approval status</Link>
        </Button>
      ) : (
        links.map((link) => (
          <Button
            key={link.href}
            asChild
            variant="outline"
            className="w-full justify-start"
            onClick={onNavigate}
          >
            <Link href={link.href}>
              <link.icon aria-hidden />
              {link.label}
            </Link>
          </Button>
        ))
      )}

      <SignOutButton className="w-full justify-start" />
    </div>
  );
}
