import bcrypt from 'bcryptjs';
import { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';
import {
  AdminLevel,
  ApprovalStatus,
  AuthProvider,
  ROLES_REQUIRING_APPROVAL,
  UserRole,
  UserStatus,
  type AuthUser,
  type PublicUser,
} from '@rokdajob/shared';

/** Work factor for bcrypt. 12 is the figure quoted in docs/01-DATABASE.md. */
export const BCRYPT_ROUNDS = 12;

/** After this many consecutive failures the account stops accepting passwords for a while. */
export const MAX_LOGIN_ATTEMPTS = 8;
export const LOGIN_LOCK_MS = 15 * 60 * 1000;

export interface ApprovalSubdocument {
  status: ApprovalStatus;
  reason?: string;
  decidedAt?: Date;
  decidedBy?: Types.ObjectId;
}

export interface UserDocument {
  _id: Types.ObjectId;
  name: string;
  username: string;
  email: string;
  phone?: string;
  /** Absent on accounts that only ever signed in with Google. */
  passwordHash?: string;
  providers: AuthProvider[];
  googleId?: string;
  role: UserRole;
  adminLevel?: AdminLevel;
  status: UserStatus;
  approval: ApprovalSubdocument;
  registrationComplete: boolean;
  /** Captured at signup so the approval queue has something to judge. */
  companyName?: string;
  avatarUrl?: string;
  emailVerifiedAt?: Date | null;
  phoneVerifiedAt?: Date | null;
  /** Sessions issued before this moment are rejected. */
  passwordChangedAt?: Date;
  passwordResetTokenHash?: string;
  passwordResetExpiresAt?: Date;
  emailVerificationTokenHash?: string;
  emailVerificationExpiresAt?: Date;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  lastActiveAt?: Date;
  lastLoginAt?: Date;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserMethods {
  comparePassword(candidate: string): Promise<boolean>;
  isLocked(): boolean;
  /** True when the account may act on the product: active, registered and approved. */
  canAct(): boolean;
  toPublicUser(): PublicUser;
  toAuthUser(extra?: { hasProfile?: boolean; profileCompletion?: number }): AuthUser;
}

export type UserDoc = HydratedDocument<UserDocument, UserMethods>;

export interface UserModel extends Model<UserDocument, object, UserMethods> {
  /** Looks a user up by email address or username, whichever the identifier looks like. */
  findByIdentifier(identifier: string, withPassword?: boolean): Promise<UserDoc | null>;
}

const approvalSchema = new Schema<ApprovalSubdocument>(
  {
    status: {
      type: String,
      enum: Object.values(ApprovalStatus),
      required: true,
      default: ApprovalStatus.AUTO_APPROVED,
    },
    reason: { type: String, trim: true, maxlength: 500 },
    decidedAt: { type: Date },
    decidedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false },
);

const userSchema = new Schema<UserDocument, UserModel, UserMethods>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    username: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
    },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },

    // `select: false` keeps the hash out of every incidental read; login opts back in.
    passwordHash: { type: String, select: false },
    providers: {
      type: [String],
      enum: Object.values(AuthProvider),
      required: true,
      default: () => [AuthProvider.LOCAL],
    },
    googleId: { type: String },

    role: { type: String, enum: Object.values(UserRole), required: true },
    adminLevel: { type: String, enum: Object.values(AdminLevel) },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      required: true,
      default: UserStatus.ACTIVE,
    },

    approval: { type: approvalSchema, required: true, default: () => ({}) },
    registrationComplete: { type: Boolean, required: true, default: true },
    companyName: { type: String, trim: true, maxlength: 120 },
    avatarUrl: { type: String, trim: true },

    emailVerifiedAt: { type: Date, default: null },
    phoneVerifiedAt: { type: Date, default: null },

    passwordChangedAt: { type: Date },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpiresAt: { type: Date, select: false },
    emailVerificationTokenHash: { type: String, select: false },
    emailVerificationExpiresAt: { type: Date, select: false },

    failedLoginAttempts: { type: Number, required: true, default: 0 },
    lockedUntil: { type: Date },

    lastActiveAt: { type: Date },
    lastLoginAt: { type: Date },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

/*
 * Uniqueness is enforced by the database rather than a read-then-write check, so two
 * simultaneous registrations for the same email cannot both win. The duplicate-key error
 * is translated into a 409 by middleware/error-handler.ts.
 */
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ phone: 1 }, { unique: true, sparse: true });
userSchema.index({ googleId: 1 }, { unique: true, sparse: true });
userSchema.index({ role: 1, status: 1 });
/** Drives the admin approval queue: pending contractors, newest first. */
userSchema.index({ role: 1, 'approval.status': 1, createdAt: -1 });
userSchema.index({ lastActiveAt: -1 });

userSchema.pre('validate', function applyApprovalGate(next) {
  // A role change (the Google onboarding step picking "contractor") re-opens the gate.
  if (this.isModified('role') && ROLES_REQUIRING_APPROVAL.includes(this.role)) {
    if (this.approval.status === ApprovalStatus.AUTO_APPROVED) {
      this.approval.status = ApprovalStatus.PENDING;
    }
  }
  next();
});

userSchema.methods.comparePassword = async function comparePassword(candidate: string) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidate, this.passwordHash);
};

userSchema.methods.isLocked = function isLocked() {
  return Boolean(this.lockedUntil && this.lockedUntil.getTime() > Date.now());
};

userSchema.methods.canAct = function canAct() {
  if (this.status !== UserStatus.ACTIVE) return false;
  if (!this.registrationComplete) return false;
  return (
    this.approval.status === ApprovalStatus.AUTO_APPROVED ||
    this.approval.status === ApprovalStatus.APPROVED
  );
};

userSchema.methods.toPublicUser = function toPublicUser(): PublicUser {
  return {
    id: this._id.toString(),
    name: this.name,
    username: this.username,
    role: this.role,
    ...(this.avatarUrl ? { avatarUrl: this.avatarUrl } : {}),
    ...(this.lastActiveAt ? { lastActiveAt: this.lastActiveAt.toISOString() } : {}),
  };
};

userSchema.methods.toAuthUser = function toAuthUser(extra = {}): AuthUser {
  return {
    ...this.toPublicUser(),
    email: this.email,
    ...(this.phone ? { phone: this.phone } : {}),
    status: this.status,
    phoneVerified: Boolean(this.phoneVerifiedAt),
    emailVerified: Boolean(this.emailVerifiedAt),
    ...(this.adminLevel ? { adminLevel: this.adminLevel } : {}),
    providers: this.providers,
    approval: {
      status: this.approval.status,
      ...(this.approval.reason ? { reason: this.approval.reason } : {}),
      ...(this.approval.decidedAt ? { decidedAt: this.approval.decidedAt.toISOString() } : {}),
    },
    registrationComplete: this.registrationComplete,
    hasProfile: extra.hasProfile ?? false,
    profileCompletion: extra.profileCompletion ?? 0,
  };
};

userSchema.statics.findByIdentifier = function findByIdentifier(
  identifier: string,
  withPassword = false,
) {
  const value = identifier.trim().toLowerCase();
  // An `@` is the only thing that separates the two forms, and usernames forbid it.
  const filter = value.includes('@') ? { email: value } : { username: value };
  const query = this.findOne({ ...filter, deletedAt: null });
  return withPassword ? query.select('+passwordHash') : query;
};

export const User = model<UserDocument, UserModel>('User', userSchema);

/** Hashes a plaintext password with the project-wide work factor. */
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}
