import type { Request, RequestHandler, Response } from 'express';
import type {
  AvailabilityCheckInput,
  ChangePasswordInput,
  CompleteRegistrationInput,
  ForgotPasswordInput,
  GoogleCallbackInput,
  GoogleStartInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from '@rokdajob/shared';
import { env } from '@/config/env';
import { validatedBody, validatedQuery } from '@/middleware/validate';
import { ApiError } from '@/utils/api-error';
import { asyncHandler } from '@/utils/async-handler';
import {
  OAUTH_STATE_COOKIE,
  REFRESH_COOKIE,
  clearOAuthStateCookie,
  clearRefreshCookie,
  setOAuthStateCookie,
  setRefreshCookie,
} from '@/utils/cookies';
import { created, noContent, ok } from '@/utils/response';
import * as authService from './auth.service';
import {
  buildAuthorizationUrl,
  createOAuthState,
  exchangeCodeForProfile,
  parseOAuthState,
} from './google.service';
import {
  assertRefreshTokenPresent,
  refreshTokenMaxAgeMs,
  revokeAllSessions,
  revokeRefreshToken,
  rotateRefreshToken,
  type SessionContext,
} from './token.service';

function sessionContext(req: Request): SessionContext {
  return {
    ...(req.get('user-agent') ? { userAgent: req.get('user-agent')! } : {}),
    ...(req.ip ? { ip: req.ip } : {}),
  };
}

/** The refresh token goes in an httpOnly cookie; only the access token is in the body. */
function attachSession(res: Response, refreshToken: string): void {
  setRefreshCookie(res, refreshToken, refreshTokenMaxAgeMs());
}

/* ----------------------------------------------------------------- register */

export const register = asyncHandler(async (req, res) => {
  const input = validatedBody<RegisterInput>(req);
  const result = await authService.register(input, sessionContext(req));

  attachSession(res, result.refreshToken);
  created(res, result.session);
});

export const checkAvailability = asyncHandler(async (req, res) => {
  const input = validatedQuery<AvailabilityCheckInput>(req);
  ok(res, await authService.checkAvailability(input));
});

/* -------------------------------------------------------------------- login */

export const login = asyncHandler(async (req, res) => {
  const input = validatedBody<LoginInput>(req);
  const result = await authService.login(input, sessionContext(req));

  attachSession(res, result.refreshToken);
  ok(res, result.session);
});

export const refresh = asyncHandler(async (req, res) => {
  const presented = req.cookies?.[REFRESH_COOKIE] as string | undefined;
  assertRefreshTokenPresent(presented);

  const result = await rotateRefreshToken(
    presented,
    sessionContext(req),
    authService.loadActiveUser,
  );

  attachSession(res, result.refreshToken);
  ok(res, { tokens: result.tokens });
});

export const logout = asyncHandler(async (req, res) => {
  const presented = req.cookies?.[REFRESH_COOKIE] as string | undefined;
  if (presented) await revokeRefreshToken(presented);

  clearRefreshCookie(res);
  noContent(res);
});

/** Signs the account out everywhere, including the device making this call. */
export const logoutAll = asyncHandler(async (req, res) => {
  const revoked = await revokeAllSessions(req.auth!.userId);
  clearRefreshCookie(res);
  ok(res, { sessionsEnded: revoked });
});

/* ------------------------------------------------------------------- google */

/**
 * Step 1. Mints a signed `state`, mirrors it into an httpOnly cookie and bounces the
 * browser to Google. The cookie is what makes a forged callback URL useless on its own.
 */
export const googleStart: RequestHandler = (req, res) => {
  const input = validatedQuery<GoogleStartInput>(req);
  const state = createOAuthState(input);

  setOAuthStateCookie(res, state);
  // Nothing here awaits, so this stays a plain handler; a synchronous throw from
  // buildAuthorizationUrl still reaches the error handler through Express.
  res.redirect(buildAuthorizationUrl(state));
};

/**
 * Step 2. Google sends the browser back here. Because this is a top-level navigation, the
 * response is a redirect into the web app carrying a one-time access token in the URL
 * fragment; the refresh cookie is set the same way as on any other login.
 */
export const googleCallback = asyncHandler(async (req, res) => {
  const { code, state } = validatedQuery<GoogleCallbackInput>(req);

  const cookieState = req.cookies?.[OAUTH_STATE_COOKIE] as string | undefined;
  clearOAuthStateCookie(res);

  if (!cookieState || cookieState !== state) {
    throw ApiError.badRequest('This sign-in attempt could not be verified. Please try again.');
  }

  const payload = parseOAuthState(state);
  const profile = await exchangeCodeForProfile(code);
  const result = await authService.loginWithGoogle(profile, payload.role, sessionContext(req));

  attachSession(res, result.refreshToken);

  const base = result.session.user.role === 'ADMIN' ? env.APP_ADMIN_URL : env.APP_WEB_URL;
  const target = new URL(payload.redirect ?? '/auth/callback', base);

  // The fragment is not sent to the server and stays out of access logs and Referer.
  target.hash = new URLSearchParams({
    access_token: result.session.tokens.accessToken,
    expires_in: String(result.session.tokens.expiresIn),
    ...(result.needsRole ? { needs_role: '1' } : {}),
    ...(result.isNewUser ? { new_user: '1' } : {}),
  }).toString();

  res.redirect(target.toString());
});

/** Finishes a Google signup by choosing employee or contractor. */
export const completeRegistration = asyncHandler(async (req, res) => {
  const input = validatedBody<CompleteRegistrationInput>(req);
  ok(res, await authService.completeRegistration(req.auth!.userId, input));
});

/* ------------------------------------------------------------------ account */

export const me = asyncHandler(async (req, res) => {
  ok(res, await authService.getAuthUser(req.auth!.userId));
});

/* ----------------------------------------------------------------- password */

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = validatedBody<ForgotPasswordInput>(req);
  await authService.requestPasswordReset(email);

  // Always the same answer, so the endpoint cannot confirm who has an account.
  ok(res, { message: 'If that address has an account, a reset link is on its way.' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = validatedBody<ResetPasswordInput>(req);
  await authService.resetPassword(token, password);

  clearRefreshCookie(res);
  ok(res, { message: 'Your password has been changed. Please sign in.' });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = validatedBody<ChangePasswordInput>(req);
  await authService.changePassword(req.auth!.userId, currentPassword, newPassword);

  clearRefreshCookie(res);
  ok(res, { message: 'Your password has been changed. Please sign in again.' });
});

/* -------------------------------------------------------------------- email */

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = validatedBody<VerifyEmailInput>(req);
  ok(res, await authService.verifyEmail(token));
});

export const resendVerification = asyncHandler(async (req, res) => {
  await authService.resendVerificationEmail(req.auth!.userId);
  ok(res, { message: 'Verification email sent.' });
});
