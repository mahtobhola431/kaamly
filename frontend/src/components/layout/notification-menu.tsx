'use client';

import Link from 'next/link';
import type { Notification } from '@rokdajob/shared';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { demoAgo } from '@/data/time';
import { cn } from '@/lib/utils';

export function NotificationMenu({
  notifications,
  allHref,
}: {
  notifications: Notification[];
  allHref: string;
}) {
  const unread = notifications.filter((notification) => notification.readAt === null).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative"
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        >
          <Bell aria-hidden />
          {unread > 0 ? (
            <span
              className="bg-action text-action-foreground absolute -right-0.5 -top-0.5 min-w-4 rounded-full px-1 text-[10px] font-bold leading-4"
              data-numeric
            >
              {unread}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[22rem] p-0">
        <div className="flex items-center justify-between border-b px-3 py-2.5">
          <p className="text-sm font-semibold">Notifications</p>
          {unread > 0 ? (
            <Button variant="ghost" size="xs" className="text-muted-foreground">
              <CheckCheck aria-hidden />
              Mark all read
            </Button>
          ) : null}
        </div>

        {notifications.length === 0 ? (
          <p className="text-muted-foreground px-3 py-8 text-center text-sm">
            Nothing new right now.
          </p>
        ) : (
          <ScrollArea className="h-80">
            <ul className="divide-y">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <Link
                    href={String(notification.data.href ?? allHref)}
                    className={cn(
                      'hover:bg-accent/60 block px-3 py-3 transition-colors',
                      notification.readAt === null && 'bg-action-subtle/40',
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {notification.readAt === null ? (
                        <span
                          aria-hidden
                          className="bg-action mt-1.5 size-1.5 shrink-0 rounded-full"
                        />
                      ) : (
                        <span aria-hidden className="mt-1.5 size-1.5 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-snug">{notification.title}</p>
                        <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                          {notification.body}
                        </p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {demoAgo(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}

        <div className="border-t p-2">
          <Button asChild variant="ghost" size="sm" className="w-full">
            <Link href={allHref}>View all notifications</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
