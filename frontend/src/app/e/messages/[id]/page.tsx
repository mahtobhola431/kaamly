import type { Metadata } from 'next';
import { ConversationView } from '@/components/domain/messages';

export const metadata: Metadata = {
  title: 'Conversation',
  robots: { index: false, follow: false },
};

/** One thread. Fetched in the browser with the contractor's own token — see `/w/messages/[id]`. */
export default async function EmployerConversationPage(props: PageProps<'/e/messages/[id]'>) {
  const { id } = await props.params;
  return <ConversationView area="employer" id={id} />;
}
