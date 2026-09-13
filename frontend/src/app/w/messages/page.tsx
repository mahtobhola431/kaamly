import type { Metadata } from 'next';
import { MessagesInbox } from '@/components/domain/messages';

export const metadata: Metadata = {
  title: 'Messages',
  robots: { index: false, follow: false },
};

export default function WorkerMessagesPage() {
  return (
    <>
      <h1 className="text-xl font-bold sm:text-2xl">Messages</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Employers message you here. Your phone number is not shared until you reply.
      </p>

      <MessagesInbox area="worker" />
    </>
  );
}
