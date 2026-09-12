import { Router } from 'express';
import {
  AdminLevel,
  UserRole,
  approvalQuerySchema,
  approveUserSchema,
  paginationSchema,
  rejectUserSchema,
  userIdParamSchema,
} from '@rokdajob/shared';
import { authenticate, authorize, requireAdminLevel } from '@/middleware/authenticate';
import { validate } from '@/middleware/validate';
import * as controller from './admin.controller';

export const adminRouter = Router();

/*
 * Every admin route sits behind the same three checks. SUPPORT can read the queue;
 * approving, rejecting and suspending need MODERATOR or SUPER, because those decisions
 * change what another account is allowed to do.
 */
adminRouter.use(authenticate, authorize(UserRole.ADMIN));

const canDecide = requireAdminLevel(AdminLevel.MODERATOR, AdminLevel.SUPER);

adminRouter.get(
  '/contractors',
  validate({ query: approvalQuerySchema.merge(paginationSchema) }),
  controller.listContractors,
);

adminRouter.get('/contractors/counts', controller.approvalCounts);

adminRouter.get(
  '/contractors/:id',
  validate({ params: userIdParamSchema }),
  controller.getContractor,
);

adminRouter.patch(
  '/contractors/:id/approve',
  canDecide,
  validate({ params: userIdParamSchema, body: approveUserSchema }),
  controller.approveContractor,
);

adminRouter.patch(
  '/contractors/:id/reject',
  canDecide,
  validate({ params: userIdParamSchema, body: rejectUserSchema }),
  controller.rejectContractor,
);

adminRouter.patch(
  '/users/:id/suspend',
  canDecide,
  validate({ params: userIdParamSchema, body: rejectUserSchema }),
  controller.suspendUser,
);

adminRouter.patch(
  '/users/:id/reactivate',
  canDecide,
  validate({ params: userIdParamSchema }),
  controller.reactivateUser,
);
