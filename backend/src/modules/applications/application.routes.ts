import { Router } from 'express';
import { z } from 'zod';
import {
  UserRole,
  myApplicationQuerySchema,
  objectIdSchema,
  withdrawApplicationSchema,
  type MyApplicationQueryInput,
  type WithdrawApplicationInput,
} from '@rokdajob/shared';
import { authenticate, authorize } from '@/middleware/authenticate';
import { validate, validatedBody, validatedParams, validatedQuery } from '@/middleware/validate';
import { asyncHandler } from '@/utils/async-handler';
import { ok, paginated } from '@/utils/response';
import * as service from './application.service';

/** The worker's own area. Scoped to the caller by the service, never by a URL id. */
export const meRouter = Router();

const idParamSchema = z.object({ id: objectIdSchema });

meRouter.use(authenticate, authorize(UserRole.WORKER));

meRouter.get(
  '/applications',
  validate({ query: myApplicationQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = validatedQuery<MyApplicationQueryInput>(req);
    const { items, total } = await service.listMyApplications(req.auth!.userId, query);
    paginated(res, items, { page: query.page, limit: query.limit, total });
  }),
);

meRouter.get(
  '/applications/counts',
  asyncHandler(async (req, res) => {
    ok(res, await service.myApplicationCounts(req.auth!.userId));
  }),
);

/** A `DELETE` that keeps the row — see the service. */
meRouter.delete(
  '/applications/:id',
  validate({ params: idParamSchema, body: withdrawApplicationSchema.partial() }),
  asyncHandler(async (req, res) => {
    const { id } = validatedParams<z.infer<typeof idParamSchema>>(req);
    const { reason } = validatedBody<WithdrawApplicationInput>(req) ?? {};
    ok(res, await service.withdrawApplication(req.auth!.userId, id, reason));
  }),
);
