import { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';

/**
 * One row per issued refresh token.
 *
 * Tokens are stored as SHA-256 hashes, so a database leak does not hand out sessions.
 * Every token carries a `family` id: rotating a token issues a new row in the same family,
 * and presenting an already-rotated token revokes the whole family as replay.
 */
export interface RefreshTokenDocument {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  tokenHash: string;
  family: string;
  expiresAt: Date;
  revokedAt?: Date | null;
  /** Set when this token was rotated, pointing at its successor, for audit trails. */
  replacedBy?: string;
  userAgent?: string;
  ip?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type RefreshTokenDoc = HydratedDocument<RefreshTokenDocument>;

const refreshTokenSchema = new Schema<RefreshTokenDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tokenHash: { type: String, required: true },
    family: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    replacedBy: { type: String },
    userAgent: { type: String, maxlength: 300 },
    ip: { type: String, maxlength: 64 },
  },
  { timestamps: true },
);

refreshTokenSchema.index({ tokenHash: 1 }, { unique: true });
refreshTokenSchema.index({ user: 1, revokedAt: 1 });
refreshTokenSchema.index({ family: 1 });
/** Mongo sweeps expired rows itself, so revoked sessions do not accumulate forever. */
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = model<RefreshTokenDocument, Model<RefreshTokenDocument>>(
  'RefreshToken',
  refreshTokenSchema,
);
