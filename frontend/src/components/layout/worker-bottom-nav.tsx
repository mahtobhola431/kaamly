'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase, FileText, Home, MessageSquare, User } from 'lucide-react';
import { useUnreadMessages } from '@/lib/data/use-unread-messages';
import { cn } from '@/lib/utils';

const ITEMS = [
  { href: '/w', label: 'Home', icon: Home, exact: true },
  { href: '/w/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/w/applications', label: 'Applied', icon: FileText },
  { href: '/w/messages', label: 'Messages', icon: MessageSquare },
  { href: '/w/profile', label: 'Profile', icon: User },
];

/**
 * Bottom navigation, not a hamburger drawer.
 *
 * Five destinations, 56px tall targets, always visible. This is the primary navigation
 * for workers on small Android phones (brief §22, §45).
 */
export function WorkerBottomNav() {
  const pathname = usePathname();
  const unreadMessages = useUnreadMessages();

  return (
    <nav
      aria-label="Worker navigation"
      className="bg-card pb-safe fixed inset-x-0 bottom-0 z-40 border-t md:hidden"
    >
      <ul className="grid grid-cols-5">
        {ITEMS.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const showBadge = item.href === '/w/messages' && unreadMessages > 0;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px] font-medium transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <span className="relative">
                  <item.icon className={cn('size-5', active && 'stroke-[2.4]')} aria-hidden />
                  {showBadge ? (
                    <span
                      className="bg-action text-action-foreground absolute -right-2 -top-1.5 min-w-4 rounded-full px-1 text-[10px] font-bold leading-4"
                      data-numeric
                    >
                      {unreadMessages}
                    </span>
                  ) : null}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Desktop equivalent — a slim rail so the worker app is usable on a laptop too. */
export function WorkerSideNav() {
  const pathname = usePathname();
  const unreadMessages = useUnreadMessages();

  return (
    <nav
      aria-label="Worker navigation"
      className="bg-card sticky top-16 hidden h-fit w-56 shrink-0 rounded-lg border p-2 md:block"
    >
      <ul className="space-y-1">
        {ITEMS.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-accent text-primary'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                )}
              >
                <item.icon className="size-4" aria-hidden />
                {item.label}
                {item.href === '/w/messages' && unreadMessages > 0 ? (
                  <span
                    className="bg-action text-action-foreground ml-auto rounded-full px-1.5 text-xs font-bold"
                    data-numeric
                  >
                    {unreadMessages}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
