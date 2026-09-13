import type { AuthUser } from '@rokdajob/shared';

/**
 * Where the session is kept between page loads.
 *
 * This is the storage layer only. The session the app *runs on* is the `auth` slice in
 * `lib/store` — components read that, and the persistence middleware there is the one
 * thing that calls `saveSession` and `clearSession`. Nothing else should write here, or
 * the store and the browser would start disagreeing about who is signed in.
 *
 * Only the short-lived access token is stored. The refresh token is an httpOnly cookie
 * the browser never exposes to JavaScript, which is what limits the damage if this is
 * ever read by injected script: an access token expires in 15 minutes and cannot mint
 * a new one on its own.
 *
 * Storage is `localStorage` so a reload does not sign the user out. The alternative —
 * memory only, with a silent `/auth/refresh` on every page load — is stronger, and is
 * the natural next step now that there is a store to hold the in-memory copy.
 */
const TOKEN_KEY = 'kaamly.access_token';
const USER_KEY = 'kaamly.user';

/** Mirrors the storage value, so reads do not touch `localStorage` on every request. */
let cachedToken: string | undefined;

function safeRead(key: string): string | undefined {
  try {
    return window.localStorage.getItem(key) ?? undefined;
  } catch {
    // Private mode, or a browser configured to block site data.
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

export function getStoredUser(): AuthUser | undefined {
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

export function clearSession(): void {
  cachedToken = undefined;
  safeWrite(TOKEN_KEY, undefined);
  safeWrite(USER_KEY, undefined);
}

/**
 * Where a user belongs immediately after signing in or registering.
 *
 * A contractor who is still `PENDING` has a valid session but cannot do anything yet, so
 * they go to the waiting screen rather than a dashboard full of actions that would 403.
 */
export function landingRouteFor(user: AuthUser): string {
  if (!user.registrationComplete) return '/auth/role';
  if (user.role === 'ADMIN') return '/e';
  if (user.role === 'EMPLOYER') {
    return user.approval.status === 'APPROVED' || user.approval.status === 'AUTO_APPROVED'
      ? '/e'
      : '/auth/pending';
  }
  return '/w/onboarding';
}

/**
 * Accepts a `?next=` value only if it is a path on this site.
 *
 * Anything else — an absolute URL, a protocol-relative `//evil.example`, a backslash the
 * browser will normalise into one — is dropped. Without this check, a link to
 * `/auth/login?next=https://…` would turn our own sign-in page into a redirector to
 * someone else's, which is the classic phishing setup.
 */
export function safeNextPath(next: string | null | undefined): string | undefined {
  if (!next) return undefined;
  const path = next.trim();
  if (!path.startsWith('/')) return undefined;
  if (path.startsWith('//') || path.startsWith('/\\')) return undefined;
  return path;
}

/**
 * Where to go once someone has signed in.
 *
 * A `next` is honoured only after the account is actually usable: an unfinished
 * registration and a contractor still waiting on approval both have somewhere they must
 * go first, and sending them back to the job they were reading would only show them a
 * button that cannot work yet.
 */
export function postAuthRoute(user: AuthUser, next?: string | null): string {
  const landing = landingRouteFor(user);
  if (landing === '/auth/role' || landing === '/auth/pending') return landing;
  return safeNextPath(next) ?? landing;
}
