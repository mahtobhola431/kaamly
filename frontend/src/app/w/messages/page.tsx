import type { Metadata } from 'next';
import { MessageSquare } from 'lucide-react';
import { ConversationList } from '@/components/domain/conversation-list';
import { EmptyState } from '@/components/feedback/empty-state';
import { getConversations, otherParticipant } from '@/lib/data/messaging';
import { routes } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'Messages',
  robots: { index: false, follow: false },
};

export default async function WorkerMessagesPage() {
  const conversations = await getConversations('worker');

  return (
    <>
      <h1 className="text-xl font-bold sm:text-2xl">Messages</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Employers message you here. Your phone number is not shared until you reply.
      </p>

      <div className="mt-5">
        {conversations.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No messages yet"
            description="When an employer shortlists you or replies to an application, the conversation appears here."
            actions={[{ label: 'Find work near you', href: routes.w.jobs, variant: 'action' }]}
          />
        ) : (
          <div className="bg-card overflow-hidden rounded-lg border">
            <ConversationList
              items={conversations.map((conversation) => ({
                conversation,
                other: otherParticipant(conversation, 'worker'),
                href: routes.w.conversation(conversation.id),
              }))}
            />
          </div>
        )}
      </div>
    </>
  );
}
