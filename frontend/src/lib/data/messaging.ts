import type { Conversation, Message, Notification, PublicUser } from '@rokdajob/shared';
import { currentEmployer } from '@/data/companies';
import {
  counterpartOf,
  employerConversations,
  messagesOf,
  workerConversations,
} from '@/data/messaging';
import { employerNotifications, workerNotifications } from '@/data/notifications';
import { currentWorker } from '@/data/workers';

/** Conversations, messages and notifications. Maps onto `/conversations` and `/notifications`. */

export type Audience = 'worker' | 'employer';

export function viewerIdFor(audience: Audience): string {
  return audience === 'worker' ? currentWorker.user.id : currentEmployer.user.id;
}

export async function getConversations(audience: Audience): Promise<Conversation[]> {
  return audience === 'worker' ? workerConversations : employerConversations;
}

export async function getConversation(
  audience: Audience,
  id: string,
): Promise<Conversation | null> {
  const list = await getConversations(audience);
  return list.find((conversation) => conversation.id === id) ?? null;
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  return messagesOf(conversationId);
}

export function otherParticipant(conversation: Conversation, audience: Audience): PublicUser {
  return counterpartOf(conversation, viewerIdFor(audience));
}

export async function getNotifications(audience: Audience): Promise<Notification[]> {
  return audience === 'worker' ? workerNotifications : employerNotifications;
}

export async function getUnreadNotificationCount(audience: Audience): Promise<number> {
  const list = await getNotifications(audience);
  return list.filter((notification) => notification.readAt === null).length;
}

export async function getUnreadMessageCount(audience: Audience): Promise<number> {
  const list = await getConversations(audience);
  return list.reduce((total, conversation) => total + conversation.unreadCount, 0);
}
