import { Router } from 'express';
import { z } from 'zod';
import { LocationLevel, pincodeSchema, slugSchema } from '@rokdajob/shared';
import { validate, validatedQuery } from '@/middleware/validate';
import { asyncHandler } from '@/utils/async-handler';
import { ok } from '@/utils/response';
import * as service from './catalog.service';

export const catalogRouter = Router();

/**
 * Reference data. Public and read-only — every route here is safe to cache, and the
 * taxonomy changes rarely enough that a browser holding it for five minutes is fine.
 */
catalogRouter.use((_req, res, next) => {
  res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
  next();
});

const skillQuerySchema = z.object({
  category: slugSchema.optional(),
  q: z.string().trim().min(1).max(60).optional(),
});

const locationQuerySchema = z.object({
  type: z.nativeEnum(LocationLevel).optional(),
  parent: slugSchema.optional(),
  q: z.string().trim().min(1).max(60).optional(),
});

const resolveQuerySchema = z
  .object({
    pincode: pincodeSchema.optional(),
    city: slugSchema.optional(),
    locality: slugSchema.optional(),
  })
  .refine((value) => Boolean(value.pincode ?? value.city), {
    message: 'Provide a pincode, or a city (optionally with a locality)',
  });

catalogRouter.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    ok(res, await service.listCategories());
  }),
);

/** Nested city -> localities, for pickers that would otherwise walk the tree. */
catalogRouter.get(
  '/cities',
  asyncHandler(async (_req, res) => {
    ok(res, await service.listCities());
  }),
);

catalogRouter.get(
  '/skills',
  validate({ query: skillQuerySchema }),
  asyncHandler(async (req, res) => {
    ok(res, await service.listSkills(validatedQuery<z.infer<typeof skillQuerySchema>>(req)));
  }),
);

catalogRouter.get(
  '/locations',
  validate({ query: locationQuerySchema }),
  asyncHandler(async (req, res) => {
    const filters = validatedQuery<z.infer<typeof locationQuerySchema>>(req);
    ok(res, await service.listLocations({ ...filters, level: filters.type }));
  }),
);

/** `?pincode=400069` or `?city=mumbai&locality=andheri-east`. */
catalogRouter.get(
  '/locations/resolve',
  validate({ query: resolveQuerySchema }),
  asyncHandler(async (req, res) => {
    const { pincode, city, locality } = validatedQuery<z.infer<typeof resolveQuerySchema>>(req);
    ok(
      res,
      pincode
        ? await service.resolvePincode(pincode)
        : await service.resolvePlace(city as string, locality),
    );
  }),
);
