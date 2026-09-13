import { Router } from 'express';
import { z } from 'zod';
import {
  UserRole,
  availabilityUpdateSchema,
  createWorkerProfileSchema,
  objectIdSchema,
  updateWorkerProfileSchema,
  workerSearchSchema,
  type AvailabilityUpdateInput,
  type CreateWorkerProfileInput,
  type UpdateWorkerProfileInput,
  type WorkerSearchInput,
} from '@rokdajob/shared';
import { authenticate, authorize } from '@/middleware/authenticate';
import { searchLimiter } from '@/middleware/rate-limit';
import { validate, validatedBody, validatedParams, validatedQuery } from '@/middleware/validate';
import { asyncHandler } from '@/utils/async-handler';
import { created, ok, paginated } from '@/utils/response';
import * as service from './worker.service';

export const workerRouter = Router();

const idParamSchema = z.object({ id: objectIdSchema });

/* ------------------------------------------------------------------ own profile */

// Registered before `/:id` so "me" is never read as an object id.
workerRouter.get(
  '/me/profile',
  authenticate,
  authorize(UserRole.WORKER),
  asyncHandler(async (req, res) => {
    // A worker who has not onboarded yet is a normal state, not a 404.
    ok(res, await service.getMyProfile(req.auth!.userId));
  }),
);

workerRouter.post(
  '/me/profile',
  authenticate,
  authorize(UserRole.WORKER),
  validate({ body: createWorkerProfileSchema }),
  asyncHandler(async (req, res) => {
    const input = validatedBody<CreateWorkerProfileInput>(req);
    created(res, await service.createProfile(req.auth!.userId, input));
  }),
);

workerRouter.patch(
  '/me/profile',
  authenticate,
  authorize(UserRole.WORKER),
  validate({ body: updateWorkerProfileSchema }),
  asyncHandler(async (req, res) => {
    const input = validatedBody<UpdateWorkerProfileInput>(req);
    ok(res, await service.updateProfile(req.auth!.userId, input));
  }),
);

workerRouter.patch(
  '/me/availability',
  authenticate,
  authorize(UserRole.WORKER),
  validate({ body: availabilityUpdateSchema }),
  asyncHandler(async (req, res) => {
    const { availability, availableFrom } = validatedBody<AvailabilityUpdateInput>(req);
    ok(res, await service.setAvailability(req.auth!.userId, availability, availableFrom));
  }),
);

/* ----------------------------------------------------------------------- public */

/** Geo search. The heaviest read path in the product, so it carries its own limiter. */
workerRouter.get(
  '/',
  searchLimiter,
  validate({ query: workerSearchSchema }),
  asyncHandler(async (req, res) => {
    const input = validatedQuery<WorkerSearchInput>(req);
    const { items, total } = await service.searchWorkers(input);
    paginated(res, items, { page: input.page, limit: input.limit, total });
  }),
);

workerRouter.get(
  '/facets',
  asyncHandler(async (_req, res) => {
    ok(res, await service.listSearchFacets());
  }),
);

workerRouter.get(
  '/counts-by-city',
  asyncHandler(async (_req, res) => {
    ok(res, await service.countByCity());
  }),
);

workerRouter.get(
  '/:id',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const { id } = validatedParams<z.infer<typeof idParamSchema>>(req);
    ok(res, await service.getPublicProfile(id));
  }),
);
