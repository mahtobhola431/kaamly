'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Conversation, Message, PublicUser } from '@rokdajob/shared';
import { ArrowLeft, Briefcase, Send } from 'lucide-react';
import { UserAvatar } from '@/components/domain/user-avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { demoTime } from '@/data/time';
import { routes } from '@/lib/routes';
import { cn } from '@/lib/utils';

/**
 * Message thread with an optimistic composer.
 *
 * Sent messages are appended locally and marked pending — there is no transport yet, and
 * the UI says so rather than pretending the message was delivered.
 */
export function MessageThread({
  conversation,
  messages,
  viewerId,
  other,
  backHref,
}: {
  conversation: Conversation;
  messages: Message[];
  viewerId: string;
  other: PublicUser;
  backHref: string;
}) {
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState<{ id: string; body: string }[]>([]);

  function send(event: React.FormEvent): void {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setPending((previous) => [...previous, { id: `local-${previous.length}`, body }]);
    setDraft('');
  }

  return (
    <div className="bg-card flex h-[calc(100svh-12rem)] min-h-[28rem] flex-col rounded-lg border">
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <Button asChild variant="ghost" size="icon-sm" className="md:hidden">
          <Link href={backHref} aria-label="Back to messages">
            <ArrowLeft aria-hidden />
          </Link>
        </Button>

        <UserAvatar user={other} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{other.name}</p>
          {conversation.job ? (
            <Link
              href={routes.job(conversation.job.slug)}
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 truncate text-xs"
            >
              <Briefcase className="size-3" aria-hidden />
              {conversation.job.title}
            </Link>
          ) : null}
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((message) => {
          const mine = message.sender.id === viewerId;
          return (
            <div key={message.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[80%] rounded-lg px-3 py-2 text-sm sm:max-w-[65%]',
                  mine
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-muted rounded-bl-sm',
                )}
              >
                <p className="whitespace-pre-line leading-relaxed">{message.body}</p>
                <p
                  className={cn(
                    'mt-1 text-[11px]',
                    mine ? 'text-primary-foreground/60' : 'text-muted-foreground',
                  )}
                >
                  {demoTime(message.createdAt)}
                </p>
              </div>
            </div>
          );
        })}

        {pending.map((message) => (
          <div key={message.id} className="flex justify-end">
            <div className="bg-primary/60 text-primary-foreground max-w-[80%] rounded-lg rounded-br-sm px-3 py-2 text-sm sm:max-w-[65%]">
              <p className="whitespace-pre-line leading-relaxed">{message.body}</p>
              <p className="text-primary-foreground/70 mt-1 text-[11px]">
                Not sent — messaging API not connected yet
              </p>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={send} className="flex items-end gap-2 border-t p-3">
        <label htmlFor="message-input" className="sr-only">
          Write a message
        </label>
        <Textarea
          id="message-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Write a message…"
          rows={1}
          className="max-h-32 min-h-10 resize-none"
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              send(event);
            }
          }}
        />
        <Button
          type="submit"
          variant="action"
          size="icon"
          disabled={!draft.trim()}
          aria-label="Send"
        >
          <Send aria-hidden />
        </Button>
      </form>
    </div>
  );
}
