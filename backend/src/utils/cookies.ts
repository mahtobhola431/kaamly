import type { CookieOptions, Response } from 'express';
import { env } from '@/config/env';

/** Refresh token cookie. Named in docs/02-API.md. */
export const REFRESH_COOKIE = 'rj_rt';

/** Short-lived cookie holding the OAuth `state` nonce between the two Google hops. */
export const OAUTH_STATE_COOKIE = 'rj_oauth_state';

const REFRESH_PATH = `${env.API_PREFIX}/auth`;

function baseOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    // `lax` still sends the cookie on the top-level GET that Google redirects back to.
    sameSite: 'lax',
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  };
}

/**
 * Scoped to the auth routes: no other endpoint needs the refresh token, so no other
 * endpoint receives it.
 */
export function setRefreshCookie(res: Response, token: string, maxAgeMs: number): void {
  res.cookie(REFRESH_COOKIE, token, { ...baseOptions(), path: REFRESH_PATH, maxAge: maxAgeMs });
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, { ...baseOptions(), path: REFRESH_PATH });
}

export function setOAuthStateCookie(res: Response, value: string): void {
  res.cookie(OAUTH_STATE_COOKIE, value, {
    ...baseOptions(),
    path: REFRESH_PATH,
    maxAge: 10 * 60 * 1000,
  });
}

export function clearOAuthStateCookie(res: Response): void {
  res.clearCookie(OAUTH_STATE_COOKIE, { ...baseOptions(), path: REFRESH_PATH });
}
