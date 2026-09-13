import { Router } from 'express';
import { z } from 'zod';
import {
  UserRole,
  conversationQuerySchema,
  messageQuerySchema,
  objectIdSchema,
  sendMessageSchema,
  startConversationSchema,
  type ConversationQueryInput,
  type MessageQueryInput,
  type SendMessageInput,
  type StartConversationInput,
} from '@rokdajob/shared';
import { authenticate, authorize, requireApproved } from '@/middleware/authenticate';
import { messageLimiter } from '@/middleware/rate-limit';
import { validate, validatedBody, validatedParams, validatedQuery } from '@/middleware/validate';
import { asyncHandler } from '@/utils/async-handler';
import { created, cursorPaginated, noContent, ok, paginated } from '@/utils/response';
import * as service from './messaging.service';

export const conversationRouter = Router();

const idParamSchema = z.object({ id: objectIdSchema });

/** Messaging is for the two sides of a job. Admins moderate elsewhere. */
conversationRouter.use(authenticate, authorize(UserRole.WORKER, UserRole.EMPLOYER));

/**
 * Reading an inbox only needs a session, so a pending or suspended contractor can still
 * see what was said to them. Writing reaches another person, so it needs approval.
 */
const canWrite = [requireApproved, messageLimiter];

conversationRouter.get(
  '/',
  validate({ query: conversationQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = validatedQuery<ConversationQueryInput>(req);
    const { items, total } = await service.listConversations(req.auth!.userId, query);
    paginated(res, items, { page: query.page, limit: query.limit, total });
  }),
);

// Registered before `/:id` so "unread-count" is never read as an object id.
conversationRouter.get(
  '/unread-count',
  asyncHandler(async (req, res) => {
    ok(res, await service.unreadCount(req.auth!.userId));
  }),
);

/** The body carries a job, an application or a recipient; the service derives the rest. */
conversationRouter.post(
  '/',
  ...canWrite,
  validate({ body: startConversationSchema }),
  asyncHandler(async (req, res) => {
    const input = validatedBody<StartConversationInput>(req);
    created(res, await service.startConversation(req.auth!.userId, req.auth!.role, input));
  }),
);

conversationRouter.get(
  '/:id',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const { id } = validatedParams<z.infer<typeof idParamSchema>>(req);
    ok(res, await service.getConversation(req.auth!.userId, id));
  }),
);

conversationRouter.get(
  '/:id/messages',
  validate({ params: idParamSchema, query: messageQuerySchema }),
  asyncHandler(async (req, res) => {
    const { id } = validatedParams<z.infer<typeof idParamSchema>>(req);
    const query = validatedQuery<MessageQueryInput>(req);
    const { items, nextCursor } = await service.listMessages(req.auth!.userId, id, query);
    cursorPaginated(res, items, nextCursor);
  }),
);

conversationRouter.post(
  '/:id/messages',
  ...canWrite,
  validate({ params: idParamSchema, body: sendMessageSchema }),
  asyncHandler(async (req, res) => {
    const { id } = validatedParams<z.infer<typeof idParamSchema>>(req);
    const { body } = validatedBody<SendMessageInput>(req);
    created(res, await service.sendMessage(req.auth!.userId, id, body));
  }),
);

conversationRouter.post(
  '/:id/read',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const { id } = validatedParams<z.infer<typeof idParamSchema>>(req);
    ok(res, await service.markRead(req.auth!.userId, id));
  }),
);

/** Hides the thread for the caller only; the other side keeps their copy. */
conversationRouter.delete(
  '/:id',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const { id } = validatedParams<z.infer<typeof idParamSchema>>(req);
    await service.hideConversation(req.auth!.userId, id);
    noContent(res);
  }),
);
