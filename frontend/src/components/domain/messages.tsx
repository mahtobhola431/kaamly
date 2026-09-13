'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Conversation, PublicUser } from '@rokdajob/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquare } from 'lucide-react';
import { ConversationList } from '@/components/domain/conversation-list';
import { MessageThread } from '@/components/domain/message-thread';
import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from '@/lib/auth/use-session';
import {
  getConversation,
  getConversations,
  getMessages,
  markConversationRead,
  sendMessage,
} from '@/lib/data/conversations';
import { routes } from '@/lib/routes';

/**
 * Inbox and thread, shared by both sides. Only the link targets and the empty state
 * differ, hence one pair of components with an `area` rather than two copies.
 */

export type Area = 'worker' | 'employer';

const AREA = {
  worker: {
    conversation: routes.w.conversation,
    inbox: routes.w.messages,
    emptyTitle: 'No messages yet',
    emptyBody:
      'When an employer replies to an application, or you write to one from a job, the conversation appears here.',
    emptyAction: { label: 'Find work near you', href: routes.w.jobs },
  },
  employer: {
    conversation: routes.e.conversation,
    inbox: routes.e.messages,
    emptyTitle: 'No conversations yet',
    emptyBody: 'Message a worker from their profile or from the applicant pipeline to start one.',
    emptyAction: { label: 'Search workers', href: routes.e.workers },
  },
} as const;

/** The other person in a two-party thread. */
function counterpart(conversation: Conversation, viewerId: string | undefined): PublicUser {
  return (
    conversation.participants.find((participant) => participant.id !== viewerId) ??
    conversation.participants[0]!
  );
}

function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: () => getConversations(),
    // A thread the user is not looking at can still gain messages.
    refetchInterval: 30_000,
  });
}

/* ---------------------------------------------------------------------- inbox */

export function MessagesInbox({ area }: { area: Area }) {
  const config = AREA[area];
  const { user } = useSession();
  const { data, isPending, isError, refetch } = useConversations();

  if (isPending) {
    return (
      <div className="mt-5 space-y-2">
        {[0, 1, 2, 3].map((row) => (
          <Skeleton key={row} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mt-5">
        <ErrorState title="Could not load your messages" onRetry={() => void refetch()} />
      </div>
    );
  }

  if (data.items.length === 0) {
    return (
      <div className="mt-5">
        <EmptyState
          icon={MessageSquare}
          title={config.emptyTitle}
          description={config.emptyBody}
          actions={[{ ...config.emptyAction, variant: 'action' }]}
        />
      </div>
    );
  }

  return (
    <div className="bg-card mt-5 overflow-hidden rounded-lg border">
      <ConversationList
        items={data.items.map((conversation) => ({
          conversation,
          other: counterpart(conversation, user?.id),
          href: config.conversation(conversation.id),
        }))}
      />
    </div>
  );
}

/* --------------------------------------------------------------------- thread */

export function ConversationView({ area, id }: { area: Area; id: string }) {
  const config = AREA[area];
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useSession();

  const conversations = useConversations();

  const thread = useQuery({
    queryKey: ['conversation', id],
    queryFn: () => getConversation(id),
  });

  const messages = useQuery({
    queryKey: ['messages', id],
    queryFn: () => getMessages(id),
    refetchInterval: 15_000,
  });

  const read = useMutation({
    mutationFn: () => markConversationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });

  // Opening a thread marks it read, so the badge clears on arrival, not on the next poll.
  const unread = thread.data?.unreadCount ?? 0;
  useEffect(() => {
    if (unread > 0) read.mutate();
    // `read` is a stable mutation object; re-running on it would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, unread]);

  if (thread.isPending || messages.isPending) {
    return <Skeleton className="h-[28rem] w-full rounded-lg" />;
  }

  if (thread.isError) {
    return (
      <ErrorState
        title="Could not open this conversation"
        description="It may have been removed, or you may not have access to it."
        retryLabel="Back to messages"
        onRetry={() => router.push(config.inbox)}
      />
    );
  }

  const conversation = thread.data;

  async function send(body: string): Promise<void> {
    await sendMessage(id, body);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['messages', id] }),
      queryClient.invalidateQueries({ queryKey: ['conversations'] }),
    ]);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <div className="bg-card hidden overflow-hidden rounded-lg border lg:block">
        <ConversationList
          activeId={conversation.id}
          items={(conversations.data?.items ?? []).map((item) => ({
            conversation: item,
            other: counterpart(item, user?.id),
            href: config.conversation(item.id),
          }))}
        />
      </div>

      <MessageThread
        conversation={conversation}
        messages={messages.data?.items ?? []}
        viewerId={user?.id ?? ''}
        other={counterpart(conversation, user?.id)}
        backHref={config.inbox}
        onSend={send}
      />
    </div>
  );
}
