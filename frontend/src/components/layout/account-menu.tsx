'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { SignOutMenuItem } from '@/components/auth/sign-out';
import { UserAvatar } from '@/components/domain/user-avatar';
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
import { getMyEmployerProfile } from '@/lib/data/company';
import { routes } from '@/lib/routes';

/**
 * The identity in the signed-in shells. Name and avatar come from the session; the company
 * underneath from `/employer/me`, which the sidebar has usually cached already.
 */

export function AccountMenu() {
  const { user, loading } = useSession();
  const { data: profile } = useQuery({
    queryKey: ['my-employer-profile'],
    queryFn: getMyEmployerProfile,
    // Only a contractor has one; a worker never reaches this shell.
    enabled: user?.role === 'EMPLOYER',
  });

  if (loading || !user) return <Skeleton className="size-8 rounded-full" aria-hidden />;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full" aria-label="Account menu">
        <UserAvatar user={user} size="sm" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <p className="truncate font-medium">{user.name}</p>
          <p className="text-muted-foreground truncate text-xs font-normal">
            {profile?.company.name ?? user.email}
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
  );
}

/** The worker shell's header avatar: a link to their own profile, nothing more. */
export function SessionAvatar() {
  const { user, loading } = useSession();

  if (loading || !user) return <Skeleton className="size-8 rounded-full" aria-hidden />;

  return (
    <Link href={routes.w.profile} aria-label="Your profile">
      <UserAvatar user={user} size="sm" />
    </Link>
  );
}
