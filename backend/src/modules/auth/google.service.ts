import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { ApiErrorCode } from '@rokdajob/shared';
import type { RegistrableRole } from '@rokdajob/shared';
import { env, hasGoogleOAuth } from '@/config/env';
import { logger } from '@/config/logger';
import { ApiError } from '@/utils/api-error';

const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const USERINFO_ENDPOINT = 'https://openidconnect.googleapis.com/v1/userinfo';

/** Ten minutes is long enough to sign in and short enough to bound a stolen state value. */
const STATE_TTL_MS = 10 * 60 * 1000;

export interface GoogleProfile {
  googleId: string;
  email: string;
  emailVerified: boolean;
  name: string;
  avatarUrl?: string;
}

export interface OAuthStatePayload {
  nonce: string;
  role?: RegistrableRole;
  redirect?: string;
  issuedAt: number;
}

function assertConfigured(): void {
  if (!hasGoogleOAuth) {
    throw new ApiError(
      503,
      ApiErrorCode.OAUTH_FAILED,
      'Google sign-in is not configured on this server',
    );
  }
}

/*
 * The `state` parameter is a signed, self-contained payload rather than a server-side
 * session: it survives a restart, needs no store, and cannot be forged without the JWT
 * secret. It is *also* echoed in an httpOnly cookie, so a stolen URL alone is not enough.
 */
function sign(payload: string): string {
  return createHmac('sha256', env.JWT_ACCESS_SECRET).update(payload).digest('base64url');
}

export function createOAuthState(input: { role?: RegistrableRole; redirect?: string }): string {
  const payload: OAuthStatePayload = {
    nonce: randomBytes(16).toString('base64url'),
    issuedAt: Date.now(),
    ...(input.role ? { role: input.role } : {}),
    ...(input.redirect ? { redirect: input.redirect } : {}),
  };

  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${sign(body)}`;
}

export function parseOAuthState(state: string): OAuthStatePayload {
  const [body, signature] = state.split('.');
  if (!body || !signature)
    throw new ApiError(400, ApiErrorCode.OAUTH_FAILED, 'Malformed OAuth state');

  const expected = Buffer.from(sign(body));
  const provided = Buffer.from(signature);
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    throw new ApiError(400, ApiErrorCode.OAUTH_FAILED, 'OAuth state failed verification');
  }

  let payload: OAuthStatePayload;
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as OAuthStatePayload;
  } catch {
    throw new ApiError(400, ApiErrorCode.OAUTH_FAILED, 'Malformed OAuth state');
  }

  if (Date.now() - payload.issuedAt > STATE_TTL_MS) {
    throw new ApiError(400, ApiErrorCode.OAUTH_FAILED, 'This sign-in attempt expired. Try again.');
  }

  return payload;
}

/** Builds the Google consent URL the browser is redirected to. */
export function buildAuthorizationUrl(state: string): string {
  assertConfigured();

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID as string,
    redirect_uri: env.GOOGLE_CALLBACK_URL,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    // `select_account` stops Google silently reusing a session the user forgot about.
    prompt: 'select_account',
    include_granted_scopes: 'true',
  });

  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

/**
 * Exchanges the one-time authorization code for an access token, then reads the profile.
 *
 * The userinfo endpoint is used rather than decoding the id_token locally: it is one more
 * round trip, but it means Google validates the token rather than this codebase.
 */
export async function exchangeCodeForProfile(code: string): Promise<GoogleProfile> {
  assertConfigured();

  const tokenResponse = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID as string,
      client_secret: env.GOOGLE_CLIENT_SECRET as string,
      redirect_uri: env.GOOGLE_CALLBACK_URL,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenResponse.ok) {
    const detail = await tokenResponse.text();
    logger.warn({ status: tokenResponse.status, detail }, 'Google token exchange failed');
    throw new ApiError(401, ApiErrorCode.OAUTH_FAILED, 'Google sign-in could not be completed');
  }

  const { access_token: accessToken } = (await tokenResponse.json()) as { access_token?: string };
  if (!accessToken) {
    throw new ApiError(401, ApiErrorCode.OAUTH_FAILED, 'Google did not return an access token');
  }

  const profileResponse = await fetch(USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!profileResponse.ok) {
    logger.warn({ status: profileResponse.status }, 'Google userinfo request failed');
    throw new ApiError(401, ApiErrorCode.OAUTH_FAILED, 'Could not read your Google profile');
  }

  const profile = (await profileResponse.json()) as {
    sub?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    given_name?: string;
    picture?: string;
  };

  if (!profile.sub || !profile.email) {
    throw new ApiError(401, ApiErrorCode.OAUTH_FAILED, 'Your Google account has no email address');
  }

  return {
    googleId: profile.sub,
    email: profile.email.toLowerCase(),
    emailVerified: profile.email_verified === true,
    name: profile.name ?? profile.given_name ?? profile.email.split('@')[0] ?? 'New user',
    ...(profile.picture ? { avatarUrl: profile.picture } : {}),
  };
}
