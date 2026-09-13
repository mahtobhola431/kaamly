import type { Conversation, CursorMeta, Message, PaginationMeta } from '@rokdajob/shared';
import { api } from '@/lib/api/client';

/**
 * Messaging, served by `/conversations`. `startConversation` takes whatever the caller has
 * — a job, an application, a recipient — and the API derives the counterpart.
 */

export interface StartConversationInput {
  job?: string;
  application?: string;
  recipient?: string;
  text: string;
}

export async function startConversation(
  input: StartConversationInput,
): Promise<{ conversation: Conversation; message: Message }> {
  return api.post<{ conversation: Conversation; message: Message }>('/conversations', input);
}

export async function getConversations(params: { job?: string; q?: string; page?: number } = {}) {
  return api.list<Conversation>('/conversations', {
    query: {
      ...(params.job ? { job: params.job } : {}),
      ...(params.q ? { q: params.q } : {}),
      page: params.page ?? 1,
    },
  }) as Promise<{ items: Conversation[]; meta: PaginationMeta }>;
}

export async function getConversation(id: string): Promise<Conversation> {
  return api.get<Conversation>(`/conversations/${id}`);
}

/** A page of history, oldest first. Pass the previous `nextCursor` for older messages. */
export async function getMessages(
  conversationId: string,
  cursor?: string,
): Promise<{ items: Message[]; meta: CursorMeta }> {
  const { data, meta } = await api.request<Message[], CursorMeta>(
    `/conversations/${conversationId}/messages`,
    { query: { ...(cursor ? { cursor } : {}) } },
  );
  return { items: data, meta };
}

export async function sendMessage(conversationId: string, body: string): Promise<Message> {
  return api.post<Message>(`/conversations/${conversationId}/messages`, { body });
}

export async function markConversationRead(conversationId: string): Promise<void> {
  await api.post(`/conversations/${conversationId}/read`);
}

export async function getUnreadMessageCount(): Promise<{ total: number; threads: number }> {
  return api.get<{ total: number; threads: number }>('/conversations/unread-count');
}
