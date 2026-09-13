import type { Metadata } from 'next';
import { MessagesInbox } from '@/components/domain/messages';

export const metadata: Metadata = {
  title: 'Messages',
  robots: { index: false, follow: false },
};

export default function EmployerMessagesPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold sm:text-2xl">Messages</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Every conversation is attached to the job it is about.
      </p>

      <MessagesInbox area="employer" />
    </div>
  );
}
