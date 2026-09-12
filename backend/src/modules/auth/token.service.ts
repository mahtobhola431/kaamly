import { randomUUID } from 'node:crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { ApiErrorCode, type AuthTokens } from '@rokdajob/shared';
import { env } from '@/config/env';
import { logger } from '@/config/logger';
import { ApiError } from '@/utils/api-error';
import { generateFamilyId, generateToken, hashToken } from '@/utils/crypto';
import { RefreshToken, type RefreshTokenDoc } from './refresh-token.model';
import type { UserDoc } from './user.model';

export interface AccessTokenClaims {
  sub: string;
  role: string;
  adminLevel?: string;
  /** JWT id, surfaced on `req.auth.tokenId` for audit trails. */
  jti: string;
  iat: number;
  exp: number;
}

export interface SessionContext {
  userAgent?: string;
  ip?: string;
}

const REFRESH_TTL_MS = env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000;

export function refreshTokenMaxAgeMs(): number {
  return REFRESH_TTL_MS;
}

/**
 * Access tokens are stateless and short lived. They carry only what authorisation needs,
 * so a stale token cannot leak profile changes, and they are never stored server-side.
 */
export function signAccessToken(user: UserDoc): { token: string; expiresIn: number } {
  const jti = randomUUID();
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_TTL as SignOptions['expiresIn'],
    jwtid: jti,
  };

  const token = jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      ...(user.adminLevel ? { adminLevel: user.adminLevel } : {}),
    },
    env.JWT_ACCESS_SECRET,
    options,
  );

  const decoded = jwt.decode(token) as { exp?: number; iat?: number } | null;
  const expiresIn = decoded?.exp && decoded.iat ? decoded.exp - decoded.iat : 900;

  return { token, expiresIn };
}

/** Throws the usual `TokenExpiredError` / `JsonWebTokenError`, normalised by the error handler. */
export function verifyAccessToken(token: string): AccessTokenClaims {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenClaims;
}

/**
 * Issues a refresh token row. `family` is omitted on login (a new family starts) and
 * passed through on rotation so replay detection can revoke the whole chain.
 */
async function issueRefreshToken(
  user: UserDoc,
  context: SessionContext,
  family = generateFamilyId(),
): Promise<{ token: string; doc: RefreshTokenDoc }> {
  const token = generateToken();

  const doc = await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(token),
    family,
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    ...(context.userAgent ? { userAgent: context.userAgent.slice(0, 300) } : {}),
    ...(context.ip ? { ip: context.ip } : {}),
  });

  return { token, doc };
}

export interface IssuedSession {
  tokens: AuthTokens;
  refreshToken: string;
}

/** Starts a brand-new session: one access token plus a fresh refresh family. */
export async function issueSession(user: UserDoc, context: SessionContext): Promise<IssuedSession> {
  const access = signAccessToken(user);
  const { token: refreshToken } = await issueRefreshToken(user, context);

  return {
    tokens: { accessToken: access.token, expiresIn: access.expiresIn },
    refreshToken,
  };
}

/**
 * Rotates a refresh token.
 *
 * Reuse of an already-rotated token means the token leaked, so every session in that
 * family is revoked rather than just the presented one. The caller is then forced to log
 * in again, which is the only safe outcome.
 */
export async function rotateRefreshToken(
  presented: string,
  context: SessionContext,
  loadUser: (userId: string) => Promise<UserDoc | null>,
): Promise<IssuedSession> {
  const existing = await RefreshToken.findOne({ tokenHash: hashToken(presented) });

  if (!existing) throw ApiError.unauthenticated('Your session is no longer valid');

  if (existing.revokedAt) {
    await RefreshToken.updateMany(
      { family: existing.family, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );
    logger.warn(
      { userId: existing.user.toString(), family: existing.family },
      'Refresh token reuse detected; session family revoked',
    );
    throw ApiError.unauthenticated('Your session was ended for security reasons');
  }

  if (existing.expiresAt.getTime() <= Date.now()) {
    throw ApiError.tokenExpired('Your session has expired. Please sign in again.');
  }

  const user = await loadUser(existing.user.toString());
  if (!user) throw ApiError.unauthenticated('Your account is no longer available');

  // A password change invalidates every session issued before it.
  if (user.passwordChangedAt && user.passwordChangedAt > existing.createdAt) {
    await revokeFamily(existing.family);
    throw ApiError.unauthenticated('Your password changed. Please sign in again.');
  }

  const access = signAccessToken(user);
  const { token: refreshToken, doc } = await issueRefreshToken(user, context, existing.family);

  existing.revokedAt = new Date();
  existing.replacedBy = doc.tokenHash;
  await existing.save();

  return {
    tokens: { accessToken: access.token, expiresIn: access.expiresIn },
    refreshToken,
  };
}

/** Ends the single session behind this refresh token. Silent when the token is unknown. */
export async function revokeRefreshToken(presented: string): Promise<void> {
  await RefreshToken.updateOne(
    { tokenHash: hashToken(presented), revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
}

export async function revokeFamily(family: string): Promise<void> {
  await RefreshToken.updateMany({ family, revokedAt: null }, { $set: { revokedAt: new Date() } });
}

/** Signs every device out. Used on password change and on admin suspension. */
export async function revokeAllSessions(userId: string): Promise<number> {
  const result = await RefreshToken.updateMany(
    { user: userId, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
  return result.modifiedCount;
}

/** Guards against a caller using an access token where a refresh token is required. */
export function assertRefreshTokenPresent(token: string | undefined): asserts token is string {
  if (!token) {
    throw new ApiError(401, ApiErrorCode.UNAUTHENTICATED, 'No session to refresh. Please sign in.');
  }
}
