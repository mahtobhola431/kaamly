import { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';

/**
 * Append-only audit trail for everything an admin does to somebody else's account.
 *
 * Approvals and rejections change what a user is allowed to do, so each one records who
 * decided, what changed and from where. Nothing here is ever updated or deleted.
 */
export const AdminAction = {
  CONTRACTOR_APPROVED: 'CONTRACTOR_APPROVED',
  CONTRACTOR_REJECTED: 'CONTRACTOR_REJECTED',
  USER_SUSPENDED: 'USER_SUSPENDED',
  USER_REACTIVATED: 'USER_REACTIVATED',
} as const;
export type AdminAction = (typeof AdminAction)[keyof typeof AdminAction];

export interface AdminActivityDocument {
  _id: Types.ObjectId;
  admin: Types.ObjectId;
  action: AdminAction;
  targetType: string;
  targetId: Types.ObjectId;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  note?: string;
  ip?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type AdminActivityDoc = HydratedDocument<AdminActivityDocument>;

const adminActivitySchema = new Schema<AdminActivityDocument>(
  {
    admin: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, enum: Object.values(AdminAction), required: true },
    targetType: { type: String, required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    note: { type: String, trim: true, maxlength: 500 },
    ip: { type: String, maxlength: 64 },
  },
  { timestamps: true },
);

adminActivitySchema.index({ admin: 1, createdAt: -1 });
adminActivitySchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
adminActivitySchema.index({ action: 1, createdAt: -1 });

export const AdminActivity = model<AdminActivityDocument, Model<AdminActivityDocument>>(
  'AdminActivity',
  adminActivitySchema,
);
