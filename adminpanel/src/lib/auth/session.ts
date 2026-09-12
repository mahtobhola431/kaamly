import type { AuthUser } from '@rokdajob/shared';

/**
 * Admin console session.
 *
 * Only the short-lived access token is kept here; the refresh token is an httpOnly cookie
 * the browser never exposes to script. Storage keys are deliberately distinct from the
 * public web app's, so signing in here never collides with a worker or employer session
 * in another tab on the same machine.
 */
const TOKEN_KEY = 'kaamly.admin.access_token';
const USER_KEY = 'kaamly.admin.user';

let cachedToken: string | undefined;

function safeRead(key: string): string | undefined {
  try {
    return window.localStorage.getItem(key) ?? undefined;
  } catch {
    return undefined;
  }
}

function safeWrite(key: string, value: string | undefined): void {
  try {
    if (value === undefined) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Non-fatal: the session simply does not survive a reload.
  }
}

export function getAccessToken(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  cachedToken ??= safeRead(TOKEN_KEY);
  return cachedToken;
}

export function getStoredAdmin(): AuthUser | undefined {
  if (typeof window === 'undefined') return undefined;
  const raw = safeRead(USER_KEY);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return undefined;
  }
}

export function saveSession(user: AuthUser, accessToken: string): void {
  cachedToken = accessToken;
  safeWrite(TOKEN_KEY, accessToken);
  safeWrite(USER_KEY, JSON.stringify(user));
}

/** Refreshes the cached user without touching the token. */
export function updateStoredAdmin(user: AuthUser): void {
  safeWrite(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  cachedToken = undefined;
  safeWrite(TOKEN_KEY, undefined);
  safeWrite(USER_KEY, undefined);
}

/**
 * This console is for admins only.
 *
 * The check is repeated server-side on every request — a stored user object is just a
 * cache and could be edited by hand — so this decides what to render, never what to trust.
 */
export function isAdmin(user: AuthUser | undefined): user is AuthUser {
  return user?.role === 'ADMIN';
}

/** Approving and rejecting need MODERATOR or SUPER; SUPPORT can only read the queue. */
export function canDecide(user: AuthUser | undefined): boolean {
  return user?.role === 'ADMIN' && (user.adminLevel === 'MODERATOR' || user.adminLevel === 'SUPER');
}
