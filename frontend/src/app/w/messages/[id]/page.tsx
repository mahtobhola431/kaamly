import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ConversationList } from '@/components/domain/conversation-list';
import { MessageThread } from '@/components/domain/message-thread';
import {
  getConversation,
  getConversations,
  getMessages,
  otherParticipant,
  viewerIdFor,
} from '@/lib/data/messaging';
import { routes } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'Conversation',
  robots: { index: false, follow: false },
};

export async function generateStaticParams() {
  const conversations = await getConversations('worker');
  return conversations.map((conversation) => ({ id: conversation.id }));
}

export default async function WorkerConversationPage(props: PageProps<'/w/messages/[id]'>) {
  const { id } = await props.params;
  const conversation = await getConversation('worker', id);
  if (!conversation) notFound();

  const [messages, conversations] = await Promise.all([
    getMessages(conversation.id),
    getConversations('worker'),
  ]);

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <div className="bg-card hidden overflow-hidden rounded-lg border lg:block">
        <ConversationList
          activeId={conversation.id}
          items={conversations.map((item) => ({
            conversation: item,
            other: otherParticipant(item, 'worker'),
            href: routes.w.conversation(item.id),
          }))}
        />
      </div>

      <MessageThread
        conversation={conversation}
        messages={messages}
        viewerId={viewerIdFor('worker')}
        other={otherParticipant(conversation, 'worker')}
        backHref={routes.w.messages}
      />
    </div>
  );
}
