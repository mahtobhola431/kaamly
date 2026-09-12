import type { FilterQuery } from 'mongoose';
import {
  ApprovalStatus,
  UserRole,
  UserStatus,
  type PaginationInput,
  type PendingApproval,
} from '@rokdajob/shared';
import { logger } from '@/config/logger';
import { ApiError } from '@/utils/api-error';
import { sendApprovalEmail, sendRejectionEmail } from '@/modules/auth/mail.service';
import { revokeAllSessions } from '@/modules/auth/token.service';
import { User, type UserDoc, type UserDocument } from '@/modules/auth/user.model';
import { AdminAction, AdminActivity } from './admin-activity.model';

export interface AdminContext {
  adminId: string;
  ip?: string;
}

function toPendingApproval(user: UserDoc): PendingApproval {
  return {
    id: user._id.toString(),
    name: user.name,
    username: user.username,
    email: user.email,
    ...(user.phone ? { phone: user.phone } : {}),
    ...(user.companyName ? { companyName: user.companyName } : {}),
    approval: {
      status: user.approval.status,
      ...(user.approval.reason ? { reason: user.approval.reason } : {}),
      ...(user.approval.decidedAt ? { decidedAt: user.approval.decidedAt.toISOString() } : {}),
    },
    registeredAt: user.createdAt.toISOString(),
  };
}

async function record(
  context: AdminContext,
  action: AdminAction,
  target: UserDoc,
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  note?: string,
): Promise<void> {
  await AdminActivity.create({
    admin: context.adminId,
    action,
    targetType: 'User',
    targetId: target._id,
    before,
    after,
    ...(note ? { note } : {}),
    ...(context.ip ? { ip: context.ip } : {}),
  });
}

/**
 * The contractor approval queue.
 *
 * `status` defaults to PENDING — the only view that needs acting on — but APPROVED and
 * REJECTED are listable too so a decision can be reviewed after the fact.
 */
export async function listContractors(
  filters: { status: ApprovalStatus; q?: string },
  page: PaginationInput,
): Promise<{ items: PendingApproval[]; total: number }> {
  const query: FilterQuery<UserDocument> = {
    role: UserRole.EMPLOYER,
    'approval.status': filters.status,
    deletedAt: null,
  };

  if (filters.q) {
    // Escaped so a search for "a.b" cannot become a wildcard.
    const needle = filters.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(needle, 'i');
    query.$or = [
      { name: pattern },
      { email: pattern },
      { username: pattern },
      { companyName: pattern },
    ];
  }

  const [items, total] = await Promise.all([
    User.find(query)
      .sort({ createdAt: -1 })
      .skip((page.page - 1) * page.limit)
      .limit(page.limit),
    User.countDocuments(query),
  ]);

  return { items: items.map(toPendingApproval), total };
}

export async function getContractor(id: string): Promise<PendingApproval> {
  const user = await User.findOne({ _id: id, role: UserRole.EMPLOYER, deletedAt: null });
  if (!user) throw ApiError.notFound('Contractor');
  return toPendingApproval(user);
}

/** Loads a contractor that is a legitimate target for an approval decision. */
async function loadDecidableContractor(id: string): Promise<UserDoc> {
  const user = await User.findOne({ _id: id, deletedAt: null });
  if (!user) throw ApiError.notFound('Contractor');

  if (user.role !== UserRole.EMPLOYER) {
    throw ApiError.badRequest('Only contractor accounts go through approval');
  }
  if (!user.registrationComplete) {
    throw ApiError.conflict('This account has not finished registering yet');
  }
  return user;
}

/**
 * Approves a contractor. Idempotent by design: re-approving an already approved account is
 * a no-op rather than an error, so a double-click in the admin panel is harmless.
 */
export async function approveContractor(
  id: string,
  note: string | undefined,
  context: AdminContext,
): Promise<PendingApproval> {
  const user = await loadDecidableContractor(id);

  if (user.approval.status === ApprovalStatus.APPROVED) return toPendingApproval(user);

  const before = { status: user.approval.status, reason: user.approval.reason };

  user.approval = {
    status: ApprovalStatus.APPROVED,
    decidedAt: new Date(),
    decidedBy: context.adminId as unknown as UserDoc['_id'],
  };
  await user.save();

  await record(
    context,
    AdminAction.CONTRACTOR_APPROVED,
    user,
    before,
    {
      status: ApprovalStatus.APPROVED,
    },
    note,
  );

  await sendApprovalEmail(user.email, user.name);
  logger.info({ adminId: context.adminId, userId: user._id.toString() }, 'Contractor approved');

  return toPendingApproval(user);
}

/**
 * Rejects a contractor and ends their sessions, so the decision takes effect immediately
 * rather than when their current access token happens to expire.
 */
export async function rejectContractor(
  id: string,
  reason: string,
  context: AdminContext,
): Promise<PendingApproval> {
  const user = await loadDecidableContractor(id);

  const before = { status: user.approval.status, reason: user.approval.reason };

  user.approval = {
    status: ApprovalStatus.REJECTED,
    reason,
    decidedAt: new Date(),
    decidedBy: context.adminId as unknown as UserDoc['_id'],
  };
  await user.save();

  await revokeAllSessions(user._id.toString());
  await record(context, AdminAction.CONTRACTOR_REJECTED, user, before, {
    status: ApprovalStatus.REJECTED,
    reason,
  });

  await sendRejectionEmail(user.email, user.name, reason);
  logger.info({ adminId: context.adminId, userId: user._id.toString() }, 'Contractor rejected');

  return toPendingApproval(user);
}

/* ------------------------------------------------------------ account state */

export async function suspendUser(
  id: string,
  reason: string,
  context: AdminContext,
): Promise<{ id: string; status: UserStatus }> {
  const user = await User.findOne({ _id: id, deletedAt: null });
  if (!user) throw ApiError.notFound('User');

  if (user.role === UserRole.ADMIN) {
    throw ApiError.forbidden('Admin accounts cannot be suspended from here');
  }
  if (user._id.toString() === context.adminId) {
    throw ApiError.badRequest('You cannot suspend your own account');
  }

  const before = { status: user.status };
  user.status = UserStatus.SUSPENDED;
  await user.save();

  await revokeAllSessions(user._id.toString());
  await record(
    context,
    AdminAction.USER_SUSPENDED,
    user,
    before,
    {
      status: UserStatus.SUSPENDED,
    },
    reason,
  );

  return { id: user._id.toString(), status: user.status };
}

export async function reactivateUser(
  id: string,
  context: AdminContext,
): Promise<{ id: string; status: UserStatus }> {
  const user = await User.findOne({ _id: id, deletedAt: null });
  if (!user) throw ApiError.notFound('User');

  const before = { status: user.status };
  user.status = UserStatus.ACTIVE;
  user.failedLoginAttempts = 0;
  user.lockedUntil = undefined;
  await user.save();

  await record(context, AdminAction.USER_REACTIVATED, user, before, {
    status: UserStatus.ACTIVE,
  });

  return { id: user._id.toString(), status: user.status };
}

/** Counts for the admin dashboard header. */
export async function approvalCounts(): Promise<Record<ApprovalStatus, number>> {
  const rows = await User.aggregate<{ _id: ApprovalStatus; count: number }>([
    { $match: { role: UserRole.EMPLOYER, deletedAt: null } },
    { $group: { _id: '$approval.status', count: { $sum: 1 } } },
  ]);

  const counts = {
    [ApprovalStatus.AUTO_APPROVED]: 0,
    [ApprovalStatus.PENDING]: 0,
    [ApprovalStatus.APPROVED]: 0,
    [ApprovalStatus.REJECTED]: 0,
  };

  for (const row of rows) {
    if (row._id in counts) counts[row._id] = row.count;
  }
  return counts;
}
