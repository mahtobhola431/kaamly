import Link from 'next/link';
import type { Conversation, PublicUser } from '@rokdajob/shared';
import { UserAvatar } from '@/components/domain/user-avatar';
import { demoAgo } from '@/data/time';
import { cn } from '@/lib/utils';

export interface ConversationListItem {
  conversation: Conversation;
  other: PublicUser;
  href: string;
}

/**
 * Inbox rows. Job context sits under the name because in this product almost every
 * conversation is about a specific job — without it, an inbox of "Rajesh Kumar" ten times
 * is useless.
 */
export function ConversationList({
  items,
  activeId,
  className,
}: {
  items: ConversationListItem[];
  activeId?: string;
  className?: string;
}) {
  return (
    <ul className={cn('divide-y', className)}>
      {items.map(({ conversation, other, href }) => {
        const unread = conversation.unreadCount > 0;
        const active = conversation.id === activeId;

        return (
          <li key={conversation.id}>
            <Link
              href={href}
              aria-current={active ? 'true' : undefined}
              className={cn(
                'flex gap-3 px-4 py-3 transition-colors',
                active ? 'bg-accent' : 'hover:bg-accent/60',
              )}
            >
              <UserAvatar user={other} size="md" className="shrink-0" />

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className={cn('truncate text-sm', unread ? 'font-semibold' : 'font-medium')}>
                    {other.name}
                  </p>
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {conversation.lastMessage ? demoAgo(conversation.lastMessage.at) : ''}
                  </span>
                </div>

                {conversation.job ? (
                  <p className="text-muted-foreground truncate text-xs">{conversation.job.title}</p>
                ) : null}

                <p
                  className={cn(
                    'mt-0.5 truncate text-sm',
                    unread ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {conversation.lastMessage?.text}
                </p>
              </div>

              {unread ? (
                <span
                  className="bg-action text-action-foreground mt-1 h-fit shrink-0 rounded-full px-1.5 text-xs font-bold"
                  data-numeric
                  aria-label={`${conversation.unreadCount} unread`}
                >
                  {conversation.unreadCount}
                </span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
