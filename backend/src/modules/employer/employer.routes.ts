import { Router } from 'express';
import { z } from 'zod';
import {
  UserRole,
  applicationStageSchema,
  employerApplicationQuerySchema,
  hireApplicationSchema,
  objectIdSchema,
  rejectApplicationSchema,
  updateCompanySchema,
  type ApplicationStageInput,
  type EmployerApplicationQueryInput,
  type HireApplicationInput,
  type RejectApplicationInput,
  type UpdateCompanyInput,
} from '@rokdajob/shared';
import { authenticate, authorize, requireApproved } from '@/middleware/authenticate';
import { uploadLimiter } from '@/middleware/rate-limit';
import { imageUpload } from '@/middleware/upload';
import { validate, validatedBody, validatedParams, validatedQuery } from '@/middleware/validate';
import { ApiError } from '@/utils/api-error';
import { asyncHandler } from '@/utils/async-handler';
import { ok, paginated } from '@/utils/response';
import * as applications from '@/modules/applications/application.service';
import * as service from './employer.service';

export const employerRouter = Router();

const idParamSchema = z.object({ id: objectIdSchema });

/**
 * The contractor's own workspace.
 *
 * Reading their dashboard only needs a signed-in employer — a pending contractor should be
 * able to see an empty console and understand why. Anything that reaches workers or posts
 * a job sits behind `requireApproved` instead.
 */
employerRouter.use(authenticate, authorize(UserRole.EMPLOYER));

employerRouter.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    ok(res, await service.getDashboard(req.auth!.userId));
  }),
);

employerRouter.get(
  '/me',
  asyncHandler(async (req, res) => {
    ok(res, await service.getMyEmployerProfile(req.auth!.userId));
  }),
);

employerRouter.get(
  '/company',
  asyncHandler(async (req, res) => {
    ok(res, await service.getMyCompany(req.auth!.userId));
  }),
);

/**
 * No `requireApproved`, unlike the pipeline routes below: editing your own profile reaches
 * nobody. In practice a PENDING contractor cannot get here anyway — `POST /auth/login`
 * refuses them with `ACCOUNT_PENDING_APPROVAL` — so this only matters if that gate is ever
 * relaxed to let them fill the profile in while they wait.
 */
employerRouter.patch(
  '/company',
  validate({ body: updateCompanySchema }),
  asyncHandler(async (req, res) => {
    const input = validatedBody<UpdateCompanyInput>(req);
    ok(res, await service.updateMyCompany(req.auth!.userId, input));
  }),
);

employerRouter.post(
  '/company/logo',
  uploadLimiter,
  imageUpload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw ApiError.badRequest('Choose an image to upload');
    ok(res, await service.setCompanyLogo(req.auth!.userId, req.file.buffer));
  }),
);

/* ------------------------------------------------------------- pipeline board */

employerRouter.get(
  '/applications',
  requireApproved,
  validate({ query: employerApplicationQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = validatedQuery<EmployerApplicationQueryInput>(req);
    const { items, total } = await applications.listEmployerApplications(req.auth!.userId, query);
    paginated(res, items, { page: query.page, limit: query.limit, total });
  }),
);

/** Column headers for the board, so an empty pipeline still renders its stages. */
employerRouter.get(
  '/applications/counts',
  requireApproved,
  asyncHandler(async (req, res) => {
    const counts = await applications.employerPipelineCounts(req.auth!.userId);
    ok(res, { columns: service.PIPELINE_COLUMNS, counts });
  }),
);

employerRouter.patch(
  '/applications/:id/stage',
  requireApproved,
  validate({ params: idParamSchema, body: applicationStageSchema }),
  asyncHandler(async (req, res) => {
    const { id } = validatedParams<z.infer<typeof idParamSchema>>(req);
    const input = validatedBody<ApplicationStageInput>(req);
    ok(res, await applications.setStage(req.auth!.userId, id, input));
  }),
);

/** Takes a vacancy off the job. Fails with `VACANCIES_FULL` if it was the last one. */
employerRouter.post(
  '/applications/:id/hire',
  requireApproved,
  validate({ params: idParamSchema, body: hireApplicationSchema }),
  asyncHandler(async (req, res) => {
    const { id } = validatedParams<z.infer<typeof idParamSchema>>(req);
    const { note } = validatedBody<HireApplicationInput>(req);
    ok(res, await applications.hireApplicant(req.auth!.userId, id, note));
  }),
);

employerRouter.post(
  '/applications/:id/reject',
  requireApproved,
  validate({ params: idParamSchema, body: rejectApplicationSchema }),
  asyncHandler(async (req, res) => {
    const { id } = validatedParams<z.infer<typeof idParamSchema>>(req);
    const { reason } = validatedBody<RejectApplicationInput>(req);
    ok(res, await applications.rejectApplicant(req.auth!.userId, id, reason));
  }),
);
