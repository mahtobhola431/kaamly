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

export default async function EmployerMessagesPage() {
  const conversations = await getConversations('employer');

  return (
    <>
      <h1 className="text-xl font-bold sm:text-2xl">Messages</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Every conversation is attached to the job it is about.
      </p>

      <div className="mt-5 max-w-3xl">
        {conversations.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No conversations yet"
            description="Message a worker from their profile or from the applicant pipeline to start one."
            actions={[{ label: 'Search workers', href: routes.e.workers, variant: 'action' }]}
          />
        ) : (
          <div className="bg-card overflow-hidden rounded-lg border">
            <ConversationList
              items={conversations.map((conversation) => ({
                conversation,
                other: otherParticipant(conversation, 'employer'),
                href: routes.e.conversation(conversation.id),
              }))}
            />
          </div>
        )}
      </div>
    </>
  );
}
