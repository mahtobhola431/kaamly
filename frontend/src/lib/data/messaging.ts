import type { Notification } from '@rokdajob/shared';
import { employerNotifications, workerNotifications } from '@/data/notifications';

/**
 * Notifications. Maps onto `/notifications`, which is still a later phase.
 *
 * Conversations and messages used to live here too. They are real now — see
 * `lib/data/conversations.ts`, which talks to `/conversations` — so nothing in this file
 * should be reached for when wiring messaging.
 */

export type Audience = 'worker' | 'employer';

export async function getNotifications(audience: Audience): Promise<Notification[]> {
  return audience === 'worker' ? workerNotifications : employerNotifications;
}

export async function getUnreadNotificationCount(audience: Audience): Promise<number> {
  const list = await getNotifications(audience);
  return list.filter((notification) => notification.readAt === null).length;
}
