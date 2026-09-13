import { z } from 'zod';
import { LIMITS } from '../constants/app';
import { objectIdSchema, paginationSchema } from './common';

/**
 * A conversation is always about a job or an application — there is no unsolicited DM
 * between strangers.
 */
export const startConversationSchema = z
  .object({
    /** Omit when `job` alone identifies the counterpart. */
    recipient: objectIdSchema.optional(),
    job: objectIdSchema.optional(),
    application: objectIdSchema.optional(),
    text: z
      .string()
      .trim()
      .min(1, 'Write a message')
      .max(LIMITS.messageMaxLength, `Keep it under ${LIMITS.messageMaxLength} characters`),
  })
  .refine((value) => Boolean(value.recipient ?? value.job ?? value.application), {
    message: 'Say who or what this message is about',
    path: ['recipient'],
  });
export type StartConversationInput = z.infer<typeof startConversationSchema>;

export const sendMessageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, 'Write a message')
    .max(LIMITS.messageMaxLength, `Keep it under ${LIMITS.messageMaxLength} characters`),
});
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const conversationQuerySchema = paginationSchema.extend({
  job: objectIdSchema.optional(),
  q: z.string().trim().max(80).optional(),
});
export type ConversationQueryInput = z.infer<typeof conversationQuerySchema>;

/**
 * Cursor rather than page number: new messages arrive at the head while a reader scrolls,
 * which would shift every offset-based page under them.
 */
export const messageQuerySchema = z.object({
  cursor: objectIdSchema.optional(),
  limit: z.coerce.number().int().min(1).max(LIMITS.pageSizeMax).default(30),
});
export type MessageQueryInput = z.infer<typeof messageQuerySchema>;
