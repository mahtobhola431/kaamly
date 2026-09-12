import type { Request } from 'express';
import type {
  ApprovalQueryInput,
  ApproveUserInput,
  PaginationInput,
  RejectUserInput,
  UserIdParam,
} from '@rokdajob/shared';
import { validatedBody, validatedParams, validatedQuery } from '@/middleware/validate';
import { asyncHandler } from '@/utils/async-handler';
import { ok, paginated } from '@/utils/response';
import * as adminService from './admin.service';

function adminContext(req: Request): adminService.AdminContext {
  return {
    adminId: req.auth!.userId,
    ...(req.ip ? { ip: req.ip } : {}),
  };
}

export const listContractors = asyncHandler(async (req, res) => {
  const query = validatedQuery<ApprovalQueryInput & PaginationInput>(req);
  const { items, total } = await adminService.listContractors(
    { status: query.status, ...(query.q ? { q: query.q } : {}) },
    { page: query.page, limit: query.limit },
  );

  paginated(res, items, { page: query.page, limit: query.limit, total });
});

export const getContractor = asyncHandler(async (req, res) => {
  const { id } = validatedParams<UserIdParam>(req);
  ok(res, await adminService.getContractor(id));
});

export const approveContractor = asyncHandler(async (req, res) => {
  const { id } = validatedParams<UserIdParam>(req);
  const { note } = validatedBody<ApproveUserInput>(req);

  ok(res, await adminService.approveContractor(id, note, adminContext(req)));
});

export const rejectContractor = asyncHandler(async (req, res) => {
  const { id } = validatedParams<UserIdParam>(req);
  const { reason } = validatedBody<RejectUserInput>(req);

  ok(res, await adminService.rejectContractor(id, reason, adminContext(req)));
});

export const suspendUser = asyncHandler(async (req, res) => {
  const { id } = validatedParams<UserIdParam>(req);
  const { reason } = validatedBody<RejectUserInput>(req);

  ok(res, await adminService.suspendUser(id, reason, adminContext(req)));
});

export const reactivateUser = asyncHandler(async (req, res) => {
  const { id } = validatedParams<UserIdParam>(req);
  ok(res, await adminService.reactivateUser(id, adminContext(req)));
});

export const approvalCounts = asyncHandler(async (_req, res) => {
  ok(res, await adminService.approvalCounts());
});
