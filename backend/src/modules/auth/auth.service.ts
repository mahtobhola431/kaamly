import {
  ApiErrorCode,
  ApprovalStatus,
  AuthProvider,
  ROLES_REQUIRING_APPROVAL,
  UserRole,
  UserStatus,
  type AuthSession,
  type AuthUser,
  type CompleteRegistrationInput,
  type LoginInput,
  type RegisterInput,
  type RegistrableRole,
} from '@rokdajob/shared';
import { logger } from '@/config/logger';
import { ApiError } from '@/utils/api-error';
import { generateToken, hashToken, slugifyUsername } from '@/utils/crypto';
import type { GoogleProfile } from './google.service';
import { sendPasswordResetEmail, sendVerificationEmail } from './mail.service';
import { issueSession, revokeAllSessions, type SessionContext } from './token.service';
import { LOGIN_LOCK_MS, MAX_LOGIN_ATTEMPTS, User, hashPassword, type UserDoc } from './user.model';

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

/* ------------------------------------------------------------------ helpers */

/** Approval state a freshly registered account starts in, given its role. */
function initialApproval(role: UserRole): { status: ApprovalStatus } {
  return {
    status: ROLES_REQUIRING_APPROVAL.includes(role)
      ? ApprovalStatus.PENDING
      : ApprovalStatus.AUTO_APPROVED,
  };
}

/**
 * Turns an account state into the error the user should see.
 *
 * Being blocked is not the same as being unauthenticated: a pending contractor has valid
 * credentials, so they get a 403 carrying a code the client can branch on to show the
 * "waiting for approval" screen rather than bouncing them back to the login form.
 */
export function assertAccountUsable(user: UserDoc): void {
  if (user.status === UserStatus.SUSPENDED) {
    throw new ApiError(
      403,
      ApiErrorCode.ACCOUNT_SUSPENDED,
      'This account has been suspended. Contact support if you think this is a mistake.',
    );
  }
  if (user.status === UserStatus.DELETED || user.deletedAt) {
    throw ApiError.unauthenticated('This account no longer exists');
  }
  if (user.approval.status === ApprovalStatus.REJECTED) {
    throw new ApiError(
      403,
      ApiErrorCode.ACCOUNT_REJECTED,
      user.approval.reason
        ? `Your contractor account was not approved: ${user.approval.reason}`
        : 'Your contractor account was not approved',
    );
  }
  if (user.approval.status === ApprovalStatus.PENDING) {
    throw new ApiError(
      403,
      ApiErrorCode.ACCOUNT_PENDING_APPROVAL,
      'Your contractor account is waiting for admin approval',
    );
  }
}

/** Picks a free username derived from `source`, probing suffixes until one is unused. */
async function allocateUsername(source: string): Promise<string> {
  const base = slugifyUsername(source);

  if (!(await User.exists({ username: base }))) return base;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = `${base.slice(0, 24)}${Math.floor(1000 + Math.random() * 9000)}`;
    if (!(await User.exists({ username: candidate }))) return candidate;
  }

  throw ApiError.internal('Could not allocate a username. Please try again.');
}

/** Access + refresh pair plus the user payload the client needs to route on. */
export interface SessionResult {
  session: AuthSession;
  refreshToken: string;
  user: UserDoc;
}

async function buildSession(user: UserDoc, context: SessionContext): Promise<SessionResult> {
  const { tokens, refreshToken } = await issueSession(user, context);
  return { session: { user: user.toAuthUser(), tokens }, refreshToken, user };
}

/** Mints a single-use email verification token and stores only its digest. */
async function issueEmailVerification(user: UserDoc): Promise<string> {
  const token = generateToken(32);
  user.emailVerificationTokenHash = hashToken(token);
  user.emailVerificationExpiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);
  await user.save();
  return token;
}

/* ----------------------------------------------------------------- register */

/**
 * Creates an account.
 *
 * A session is issued even for a pending contractor. That is deliberate: they need to be
 * able to sign in and watch their own approval status, and every route that matters is
 * gated by `requireApproved` rather than by withholding the token.
 */
export async function register(
  input: RegisterInput,
  context: SessionContext,
): Promise<SessionResult> {
  const role = input.role as UserRole;

  const user = await User.create({
    name: input.name,
    username: input.username,
    email: input.email,
    ...(input.phone ? { phone: input.phone } : {}),
    passwordHash: await hashPassword(input.password),
    providers: [AuthProvider.LOCAL],
    role,
    approval: initialApproval(role),
    registrationComplete: true,
    ...(input.role === 'EMPLOYER' ? { companyName: input.companyName } : {}),
    lastLoginAt: new Date(),
    lastActiveAt: new Date(),
  });

  const token = await issueEmailVerification(user);
  await sendVerificationEmail(user.email, user.name, token);

  logger.info(
    { userId: user._id.toString(), role, approval: user.approval.status },
    'User registered',
  );

  return buildSession(user, context);
}

/* -------------------------------------------------------------------- login */

/**
 * Password login by email address or username.
 *
 * Every credential failure returns the same message whether the account is missing or the
 * password is wrong, so the endpoint cannot be used to enumerate registered emails.
 */
export async function login(input: LoginInput, context: SessionContext): Promise<SessionResult> {
  const user = await User.findByIdentifier(input.identifier, true);

  const invalid = new ApiError(
    401,
    ApiErrorCode.INVALID_CREDENTIALS,
    'Those details do not match an account',
  );

  if (!user) {
    // Keeps the timing of a missing account close to that of a wrong password.
    await hashPassword(input.password);
    throw invalid;
  }

  if (user.isLocked()) {
    throw ApiError.rateLimited(
      'Too many failed attempts. Try again in a few minutes or reset your password.',
    );
  }

  if (!user.passwordHash) {
    throw new ApiError(
      401,
      ApiErrorCode.PASSWORD_NOT_SET,
      'This account signs in with Google. Use "Continue with Google", or reset your password to set one.',
    );
  }

  if (!(await user.comparePassword(input.password))) {
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
      user.lockedUntil = new Date(Date.now() + LOGIN_LOCK_MS);
      user.failedLoginAttempts = 0;
      logger.warn({ userId: user._id.toString() }, 'Account locked after repeated failed logins');
    }
    await user.save();
    throw invalid;
  }

  assertAccountUsable(user);

  user.failedLoginAttempts = 0;
  user.lockedUntil = undefined;
  user.lastLoginAt = new Date();
  user.lastActiveAt = new Date();
  await user.save();

  return buildSession(user, context);
}

/* ------------------------------------------------------------------- google */

export interface GoogleLoginResult extends SessionResult {
  /** True when the account was created by this sign-in. */
  isNewUser: boolean;
  /** True while the user still has to choose employee or contractor. */
  needsRole: boolean;
}

/**
 * Signs in or registers from a verified Google profile.
 *
 * Linking is by `googleId` first and email second: an existing password account that signs
 * in with the same verified Google address gains GOOGLE as a second provider rather than
 * colliding on the unique email index.
 */
export async function loginWithGoogle(
  profile: GoogleProfile,
  role: RegistrableRole | undefined,
  context: SessionContext,
): Promise<GoogleLoginResult> {
  if (!profile.emailVerified) {
    throw new ApiError(
      401,
      ApiErrorCode.OAUTH_FAILED,
      'Your Google email address is not verified with Google',
    );
  }

  let user = await User.findOne({ googleId: profile.googleId, deletedAt: null });
  let isNewUser = false;

  if (!user) {
    const byEmail = await User.findOne({ email: profile.email, deletedAt: null });

    if (byEmail) {
      // Link Google onto the existing account.
      byEmail.googleId = profile.googleId;
      if (!byEmail.providers.includes(AuthProvider.GOOGLE)) {
        byEmail.providers.push(AuthProvider.GOOGLE);
      }
      // Google has verified this address, so the account no longer needs to.
      byEmail.emailVerifiedAt ??= new Date();
      if (!byEmail.avatarUrl && profile.avatarUrl) byEmail.avatarUrl = profile.avatarUrl;
      await byEmail.save();
      user = byEmail;
    } else {
      const resolvedRole = (role ?? UserRole.WORKER) as UserRole;

      user = await User.create({
        name: profile.name,
        username: await allocateUsername(profile.email.split('@')[0] ?? profile.name),
        email: profile.email,
        providers: [AuthProvider.GOOGLE],
        googleId: profile.googleId,
        role: resolvedRole,
        approval: initialApproval(resolvedRole),
        // Without an explicit role the client must still ask; until then the account is
        // parked as a worker with registration incomplete.
        registrationComplete: Boolean(role),
        emailVerifiedAt: new Date(),
        ...(profile.avatarUrl ? { avatarUrl: profile.avatarUrl } : {}),
        lastLoginAt: new Date(),
        lastActiveAt: new Date(),
      });
      isNewUser = true;
    }
  }

  const needsRole = !user.registrationComplete;

  // A half-registered account gets a session so it can complete signup, but nothing else.
  if (!needsRole) assertAccountUsable(user);

  user.lastLoginAt = new Date();
  user.lastActiveAt = new Date();
  await user.save();

  const result = await buildSession(user, context);
  logger.info({ userId: user._id.toString(), isNewUser, needsRole }, 'Google sign-in completed');

  return { ...result, isNewUser, needsRole };
}

/**
 * Finishes a Google signup that arrived without a role. Choosing "contractor" here puts
 * the account into the same PENDING queue as a password registration would.
 */
export async function completeRegistration(
  userId: string,
  input: CompleteRegistrationInput,
): Promise<AuthUser> {
  const user = await User.findOne({ _id: userId, deletedAt: null });
  if (!user) throw ApiError.notFound('Account');

  if (user.registrationComplete) {
    throw ApiError.conflict('This account has already finished registration');
  }

  user.role = input.role;
  user.approval = initialApproval(user.role);
  user.registrationComplete = true;
  if (input.username) user.username = input.username;
  if (input.companyName) user.companyName = input.companyName;

  await user.save();

  logger.info(
    { userId: user._id.toString(), role: user.role, approval: user.approval.status },
    'Registration completed',
  );

  return user.toAuthUser();
}

/* ------------------------------------------------------------------ account */

export async function getAuthUser(userId: string): Promise<AuthUser> {
  const user = await User.findOne({ _id: userId, deletedAt: null });
  if (!user) throw ApiError.unauthenticated('Your account is no longer available');
  return user.toAuthUser();
}

export async function checkAvailability(input: {
  username?: string;
  email?: string;
}): Promise<{ username?: boolean; email?: boolean }> {
  const result: { username?: boolean; email?: boolean } = {};

  if (input.username) {
    result.username = !(await User.exists({ username: input.username }));
  }
  if (input.email) {
    result.email = !(await User.exists({ email: input.email }));
  }

  return result;
}

/* ----------------------------------------------------------------- password */

/**
 * Starts a password reset. Always resolves the same way whether or not the address is
 * registered, so the endpoint does not confirm who has an account.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const user = await User.findOne({ email, deletedAt: null });
  if (!user) {
    logger.info({ email }, 'Password reset requested for unknown address');
    return;
  }

  const token = generateToken(32);
  user.passwordResetTokenHash = hashToken(token);
  user.passwordResetExpiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
  await user.save();

  await sendPasswordResetEmail(user.email, user.name, token);
}

/** Consumes a reset token, sets the new password and signs every device out. */
export async function resetPassword(token: string, password: string): Promise<void> {
  const user = await User.findOne({
    passwordResetTokenHash: hashToken(token),
    passwordResetExpiresAt: { $gt: new Date() },
    deletedAt: null,
  }).select('+passwordResetTokenHash +passwordResetExpiresAt');

  if (!user) {
    throw new ApiError(
      400,
      ApiErrorCode.VALIDATION_ERROR,
      'This reset link is invalid or has expired',
    );
  }

  user.passwordHash = await hashPassword(password);
  user.passwordChangedAt = new Date();
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpiresAt = undefined;
  user.failedLoginAttempts = 0;
  user.lockedUntil = undefined;
  if (!user.providers.includes(AuthProvider.LOCAL)) user.providers.push(AuthProvider.LOCAL);
  await user.save();

  const revoked = await revokeAllSessions(user._id.toString());
  logger.info({ userId: user._id.toString(), revoked }, 'Password reset; sessions revoked');
}

/**
 * Changes the password of a signed-in user. A Google-only account may use this to add a
 * password, in which case there is no current password to check.
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await User.findOne({ _id: userId, deletedAt: null }).select('+passwordHash');
  if (!user) throw ApiError.unauthenticated('Your account is no longer available');

  if (!user.passwordHash) {
    throw new ApiError(
      400,
      ApiErrorCode.PASSWORD_NOT_SET,
      'This account has no password yet. Use the reset-password flow to set one.',
    );
  }

  if (!(await user.comparePassword(currentPassword))) {
    throw new ApiError(
      400,
      ApiErrorCode.INVALID_CREDENTIALS,
      'Your current password is not correct',
    );
  }

  user.passwordHash = await hashPassword(newPassword);
  user.passwordChangedAt = new Date();
  await user.save();

  await revokeAllSessions(user._id.toString());
}

/* -------------------------------------------------------------------- email */

export async function verifyEmail(token: string): Promise<AuthUser> {
  const user = await User.findOne({
    emailVerificationTokenHash: hashToken(token),
    emailVerificationExpiresAt: { $gt: new Date() },
    deletedAt: null,
  }).select('+emailVerificationTokenHash +emailVerificationExpiresAt');

  if (!user) {
    throw new ApiError(
      400,
      ApiErrorCode.VALIDATION_ERROR,
      'This verification link is invalid or has expired',
    );
  }

  user.emailVerifiedAt = new Date();
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationExpiresAt = undefined;
  await user.save();

  return user.toAuthUser();
}

export async function resendVerificationEmail(userId: string): Promise<void> {
  const user = await User.findOne({ _id: userId, deletedAt: null });
  if (!user) throw ApiError.unauthenticated('Your account is no longer available');

  if (user.emailVerifiedAt) {
    throw ApiError.conflict('Your email address is already verified');
  }

  const token = await issueEmailVerification(user);
  await sendVerificationEmail(user.email, user.name, token);
}

/** Loader passed to the refresh rotation so the token service does not import the model. */
export async function loadActiveUser(userId: string): Promise<UserDoc | null> {
  return User.findOne({ _id: userId, deletedAt: null, status: { $ne: UserStatus.DELETED } });
}
