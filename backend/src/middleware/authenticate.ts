import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ApiErrorCode, ApprovalStatus, UserRole, UserStatus } from '@rokdajob/shared';
import type { AdminLevel, AuthProvider } from '@rokdajob/shared';
import { ApiError } from '@/utils/api-error';
import { User, type UserDoc } from '@/modules/auth/user.model';
import { verifyAccessToken } from '@/modules/auth/token.service';

/**
 * The chain is deliberately split in three, so each route says exactly what it needs:
 *
 *   authenticate      — there is a signed-in user
 *   authorize(...)    — that user holds one of these roles
 *   requireApproved   — and an admin has cleared the account to act
 *
 * A pending contractor passes the first two and fails the third, which is what lets them
 * sign in and watch their own status while every job-posting route stays closed.
 */

declare module 'express-serve-static-core' {
  interface Request {
    /** Loaded lazily by `loadUser`; present on routes that ask for the full document. */
    currentUser?: UserDoc;
  }
}

function readBearerToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (!header) return undefined;

  const [scheme, value] = header.split(' ');
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !value) return undefined;
  return value.trim();
}

/** Rejects the request unless it carries a valid, unexpired access token. */
export const authenticate: RequestHandler = (req: Request, _res: Response, next: NextFunction) => {
  const token = readBearerToken(req);
  if (!token) {
    next(ApiError.unauthenticated());
    return;
  }

  try {
    const claims = verifyAccessToken(token);
    req.auth = {
      userId: claims.sub,
      role: claims.role as UserRole,
      ...(claims.adminLevel ? { adminLevel: claims.adminLevel as AdminLevel } : {}),
      tokenId: claims.jti,
    };
    next();
  } catch (error) {
    // TokenExpiredError / JsonWebTokenError are normalised by the error handler.
    next(error);
  }
};

/**
 * Attaches identity when a token is present and carries on silently when it is not.
 * Used by public reads that show more detail to a signed-in viewer.
 */
export const optionalAuthenticate: RequestHandler = (req, _res, next) => {
  const token = readBearerToken(req);
  if (!token) {
    next();
    return;
  }

  try {
    const claims = verifyAccessToken(token);
    req.auth = {
      userId: claims.sub,
      role: claims.role as UserRole,
      ...(claims.adminLevel ? { adminLevel: claims.adminLevel as AdminLevel } : {}),
      tokenId: claims.jti,
    };
  } catch {
    // An invalid token on an optional route is treated as no token at all.
  }
  next();
};

/** Restricts a route to the listed roles. Must run after `authenticate`. */
export function authorize(...roles: UserRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) {
      next(ApiError.unauthenticated());
      return;
    }
    if (!roles.includes(req.auth.role)) {
      next(ApiError.forbidden('Your account type cannot access this'));
      return;
    }
    next();
  };
}

/** Restricts a route to admins at or above the given level. */
export function requireAdminLevel(...levels: AdminLevel[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) {
      next(ApiError.unauthenticated());
      return;
    }
    if (req.auth.role !== UserRole.ADMIN) {
      next(ApiError.forbidden('Admin access only'));
      return;
    }
    if (!req.auth.adminLevel || !levels.includes(req.auth.adminLevel)) {
      next(ApiError.forbidden('This action needs a higher admin level'));
      return;
    }
    next();
  };
}

/**
 * Loads the full user document onto `req.currentUser`.
 *
 * The access token is not re-checked against the database on every request — that is the
 * point of a stateless token — so this is only used where the handler needs live state.
 */
export const loadUser: RequestHandler = (req, _res, next) => {
  if (!req.auth) {
    next(ApiError.unauthenticated());
    return;
  }

  User.findOne({ _id: req.auth.userId, deletedAt: null })
    .then((user) => {
      if (!user) {
        next(ApiError.unauthenticated('Your account is no longer available'));
        return;
      }
      req.currentUser = user;
      next();
    })
    .catch(next);
};

/**
 * The approval gate. Apply to everything a contractor should not be able to do before an
 * admin has cleared them: posting jobs, inviting workers, revealing contact details.
 *
 * This reads the database rather than the token, so an approval or a suspension takes
 * effect on the next request instead of when the access token happens to expire.
 */
export const requireApproved: RequestHandler = (req, _res, next) => {
  if (!req.auth) {
    next(ApiError.unauthenticated());
    return;
  }

  User.findOne({ _id: req.auth.userId, deletedAt: null })
    .then((user) => {
      if (!user) {
        next(ApiError.unauthenticated('Your account is no longer available'));
        return;
      }

      if (user.status === UserStatus.SUSPENDED) {
        next(new ApiError(403, ApiErrorCode.ACCOUNT_SUSPENDED, 'This account has been suspended'));
        return;
      }

      if (!user.registrationComplete) {
        next(
          new ApiError(
            403,
            ApiErrorCode.PROFILE_INCOMPLETE,
            'Finish choosing your account type before continuing',
          ),
        );
        return;
      }

      if (user.approval.status === ApprovalStatus.PENDING) {
        next(
          new ApiError(
            403,
            ApiErrorCode.ACCOUNT_PENDING_APPROVAL,
            'Your contractor account is waiting for admin approval',
          ),
        );
        return;
      }

      if (user.approval.status === ApprovalStatus.REJECTED) {
        next(
          new ApiError(
            403,
            ApiErrorCode.ACCOUNT_REJECTED,
            user.approval.reason
              ? `Your contractor account was not approved: ${user.approval.reason}`
              : 'Your contractor account was not approved',
          ),
        );
        return;
      }

      req.currentUser = user;
      next();
    })
    .catch(next);
};

/** Convenience for routes that need a verified email address (billing, payouts). */
export const requireVerifiedEmail: RequestHandler = (req, _res, next) => {
  const user = req.currentUser;
  if (!user) {
    next(ApiError.internal('requireVerifiedEmail must run after loadUser or requireApproved'));
    return;
  }
  if (!user.emailVerifiedAt) {
    next(
      new ApiError(403, ApiErrorCode.EMAIL_NOT_VERIFIED, 'Confirm your email address to continue'),
    );
    return;
  }
  next();
};

/** Narrow helper for handlers that need to branch on how the user signed up. */
export function hasProvider(user: UserDoc, provider: AuthProvider): boolean {
  return user.providers.includes(provider);
}
