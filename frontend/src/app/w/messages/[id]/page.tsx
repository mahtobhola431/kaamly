import type { Metadata } from 'next';
import { ConversationView } from '@/components/domain/messages';

export const metadata: Metadata = {
  title: 'Conversation',
  robots: { index: false, follow: false },
};

/**
 * One thread.
 *
 * There is no `generateStaticParams` here on purpose: conversation ids belong to one
 * signed-in person, so there is nothing to prerender and nothing that should be cached
 * between users. The thread is fetched in the browser with that user's own token.
 */
export default async function WorkerConversationPage(props: PageProps<'/w/messages/[id]'>) {
  const { id } = await props.params;
  return <ConversationView area="worker" id={id} />;
}
