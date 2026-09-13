'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Conversation, Message, PublicUser } from '@rokdajob/shared';
import { AlertCircle, ArrowLeft, Briefcase, Loader2, Send } from 'lucide-react';
import { UserAvatar } from '@/components/domain/user-avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { demoTime } from '@/data/time';
import { routes } from '@/lib/routes';
import { cn } from '@/lib/utils';

interface PendingMessage {
  id: string;
  body: string;
  failed: boolean;
}

/**
 * Message thread with an optimistic composer.
 *
 * The message appears immediately and is reconciled when `onSend` resolves. A failed send
 * stays on screen, marked, with the text put back in the box.
 */
export function MessageThread({
  conversation,
  messages,
  viewerId,
  other,
  backHref,
  onSend,
}: {
  conversation: Conversation;
  messages: Message[];
  viewerId: string;
  other: PublicUser;
  backHref: string;
  /** Resolves once the server has the message; rejecting marks it as not sent. */
  onSend: (body: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState<PendingMessage[]>([]);
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // Open at the newest message, and follow along as more arrive.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length, pending.length]);

  function send(event: React.FormEvent): void {
    event.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;

    const id = `local-${Date.now()}`;
    setPending((previous) => [...previous, { id, body, failed: false }]);
    setDraft('');
    setSending(true);

    void onSend(body)
      .then(() => {
        // The refreshed thread carries it now; drop the local copy.
        setPending((previous) => previous.filter((message) => message.id !== id));
      })
      .catch(() => {
        setPending((previous) =>
          previous.map((message) => (message.id === id ? { ...message, failed: true } : message)),
        );
        // Put the text back so it can be resent without retyping.
        setDraft((current) => current || body);
      })
      .finally(() => setSending(false));
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
            <div
              className={cn(
                'max-w-[80%] rounded-lg rounded-br-sm px-3 py-2 text-sm sm:max-w-[65%]',
                message.failed
                  ? 'bg-destructive-subtle text-foreground border-destructive/30 border'
                  : 'bg-primary/60 text-primary-foreground',
              )}
            >
              <p className="whitespace-pre-line leading-relaxed">{message.body}</p>
              <p
                className={cn(
                  'mt-1 flex items-center gap-1 text-[11px]',
                  message.failed ? 'text-destructive' : 'text-primary-foreground/70',
                )}
              >
                {message.failed ? (
                  <>
                    <AlertCircle className="size-3" aria-hidden />
                    Not sent — try again
                  </>
                ) : (
                  <>
                    <Loader2 className="size-3 animate-spin" aria-hidden />
                    Sending…
                  </>
                )}
              </p>
            </div>
          </div>
        ))}

        <div ref={endRef} />
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
          disabled={!draft.trim() || sending}
          aria-label="Send"
        >
          {sending ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
        </Button>
      </form>
    </div>
  );
}
