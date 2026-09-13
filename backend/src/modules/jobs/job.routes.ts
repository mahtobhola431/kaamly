import { Router } from 'express';
import { z } from 'zod';
import {
  UserRole,
  applyToJobSchema,
  createJobSchema,
  employerApplicationQuerySchema,
  employerJobQuerySchema,
  jobSearchSchema,
  jobStatusSchema,
  updateJobSchema,
  type ApplyToJobInput,
  type CreateJobInput,
  type EmployerApplicationQueryInput,
  type JobStatus,
  type EmployerJobQueryInput,
  type JobSearchInput,
  type JobStatusInput,
  type UpdateJobInput,
} from '@rokdajob/shared';
import { authenticate, authorize, requireApproved } from '@/middleware/authenticate';
import { applyLimiter, searchLimiter } from '@/middleware/rate-limit';
import { validate, validatedBody, validatedParams, validatedQuery } from '@/middleware/validate';
import { asyncHandler } from '@/utils/async-handler';
import { created, noContent, ok, paginated } from '@/utils/response';
import * as applications from '@/modules/applications/application.service';
import * as service from './job.service';

export const jobRouter = Router();

const idParamSchema = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id') });
const idOrSlugParamSchema = z.object({ idOrSlug: z.string().trim().min(1).max(120) });

/**
 * Posting is gated three ways: signed in, an employer, and approved by an admin.
 * `requireApproved` reads the database rather than the token, so an approval takes effect
 * on the contractor's next request instead of when their access token happens to expire.
 */
const canPost = [authenticate, authorize(UserRole.EMPLOYER), requireApproved];

/* --------------------------------------------------------------------- public */

jobRouter.get(
  '/',
  searchLimiter,
  validate({ query: jobSearchSchema }),
  asyncHandler(async (req, res) => {
    const input = validatedQuery<JobSearchInput>(req);
    const { items, total } = await service.searchJobs(input);
    paginated(res, items, { page: input.page, limit: input.limit, total });
  }),
);

jobRouter.get(
  '/facets',
  asyncHandler(async (_req, res) => {
    ok(res, await service.listSearchFacets());
  }),
);

jobRouter.get(
  '/counts-by-city',
  asyncHandler(async (_req, res) => {
    ok(res, await service.countByCity());
  }),
);

jobRouter.get(
  '/counts-by-category',
  asyncHandler(async (_req, res) => {
    ok(res, await service.countByCategory());
  }),
);

/* ------------------------------------------------------------------- employer */

/** The employer's own list, which unlike the public search includes drafts. */
jobRouter.get(
  '/mine',
  authenticate,
  authorize(UserRole.EMPLOYER),
  validate({ query: employerJobQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = validatedQuery<EmployerJobQueryInput>(req);
    const { items, total } = await service.listEmployerJobs(req.auth!.userId, query);
    paginated(res, items, { page: query.page, limit: query.limit, total });
  }),
);

jobRouter.post(
  '/',
  ...canPost,
  validate({ body: createJobSchema }),
  asyncHandler(async (req, res) => {
    const input = validatedBody<CreateJobInput>(req);
    created(res, await service.createJob(req.auth!.userId, input));
  }),
);

jobRouter.patch(
  '/:id',
  ...canPost,
  validate({ params: idParamSchema, body: updateJobSchema }),
  asyncHandler(async (req, res) => {
    const { id } = validatedParams<z.infer<typeof idParamSchema>>(req);
    ok(res, await service.updateJob(req.auth!.userId, id, validatedBody<UpdateJobInput>(req)));
  }),
);

jobRouter.patch(
  '/:id/status',
  ...canPost,
  validate({ params: idParamSchema, body: jobStatusSchema }),
  asyncHandler(async (req, res) => {
    const { id } = validatedParams<z.infer<typeof idParamSchema>>(req);
    const { status } = validatedBody<JobStatusInput>(req);
    ok(res, await service.setJobStatus(req.auth!.userId, id, status as JobStatus));
  }),
);

jobRouter.delete(
  '/:id',
  ...canPost,
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const { id } = validatedParams<z.infer<typeof idParamSchema>>(req);
    await service.deleteJob(req.auth!.userId, id);
    noContent(res);
  }),
);

/* --------------------------------------------------------------- applications */

/**
 * A worker applies.
 *
 * `requireApproved` is here for suspension, not approval: workers are auto-approved at
 * registration, but a suspended account must not be able to keep applying.
 *
 * The response is `201` for a new application and `200` when one already existed, so a
 * retried request tells the client what happened without ever being an error.
 */
jobRouter.post(
  '/:id/apply',
  applyLimiter,
  authenticate,
  authorize(UserRole.WORKER),
  requireApproved,
  validate({ params: idParamSchema, body: applyToJobSchema }),
  asyncHandler(async (req, res) => {
    const { id } = validatedParams<z.infer<typeof idParamSchema>>(req);
    const input = validatedBody<ApplyToJobInput>(req);
    const { application, created: isNew } = await applications.applyToJob(
      req.auth!.userId,
      id,
      input,
    );
    ok(res, application, isNew ? 201 : 200);
  }),
);

/** The caller's own application to this job, or `null`. Drives the apply button. */
jobRouter.get(
  '/:idOrSlug/my-application',
  authenticate,
  authorize(UserRole.WORKER),
  validate({ params: idOrSlugParamSchema }),
  asyncHandler(async (req, res) => {
    const { idOrSlug } = validatedParams<z.infer<typeof idOrSlugParamSchema>>(req);
    ok(res, await applications.myApplicationForJob(req.auth!.userId, idOrSlug));
  }),
);

/** Everyone who applied to one job. Owner only. */
jobRouter.get(
  '/:id/applications',
  ...canPost,
  validate({ params: idParamSchema, query: employerApplicationQuerySchema }),
  asyncHandler(async (req, res) => {
    const { id } = validatedParams<z.infer<typeof idParamSchema>>(req);
    const query = validatedQuery<EmployerApplicationQueryInput>(req);
    const { items, total } = await applications.listJobApplications(req.auth!.userId, id, query);
    paginated(res, items, { page: query.page, limit: query.limit, total });
  }),
);

jobRouter.get(
  '/:id/applications/counts',
  ...canPost,
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const { id } = validatedParams<z.infer<typeof idParamSchema>>(req);
    ok(res, await applications.employerPipelineCounts(req.auth!.userId, id));
  }),
);

/* ------------------------------------------------------- public detail (last) */

// Registered after every literal path so "mine" and "facets" are not read as slugs.
jobRouter.get(
  '/:idOrSlug',
  validate({ params: idOrSlugParamSchema }),
  asyncHandler(async (req, res) => {
    const { idOrSlug } = validatedParams<z.infer<typeof idOrSlugParamSchema>>(req);
    ok(res, await service.getJobBySlugOrId(idOrSlug));
  }),
);
