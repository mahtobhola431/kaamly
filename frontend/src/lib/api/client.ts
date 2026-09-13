import { createApiClient, type ApiClient, type RequestOptions } from '@rokdajob/shared';
import { ApiClientError } from '@rokdajob/shared';
import { getAccessToken } from '@/lib/auth/session';
import { sessionEnded, store, tokenRefreshed } from '@/lib/store';
import { clientEnv } from '@/lib/env';

/**
 * The web app's API client.
 *
 * Access tokens last 15 minutes, so a form that takes a while to fill would otherwise
 * fail on submit with "your session has expired" while the user still holds a perfectly
 * good refresh cookie. Every call therefore retries once through a silent refresh.
 *
 * The token comes from the store, which is why the store is a module-scope singleton:
 * this file is not a component and has no hooks to reach for. `getAccessToken()` remains
 * as the fallback for the sliver of time between the first render and the effect that
 * boots the session into Redux.
 */
const base = createApiClient({
  baseUrl: clientEnv.NEXT_PUBLIC_API_URL,
  getToken: () => store.getState().auth.accessToken ?? getAccessToken(),
});

const root = clientEnv.NEXT_PUBLIC_API_URL.replace(/\/$/, '');

/** In flight refresh, shared so ten parallel 401s cause one refresh, not ten. */
let inFlight: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  inFlight ??= (async () => {
    try {
      const response = await fetch(`${root}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) return false;

      const payload = (await response.json()) as {
        data?: { tokens?: { accessToken?: string } };
      };
      const token = payload.data?.tokens?.accessToken;
      if (!token) return false;

      // Through the store, so the persistence middleware writes it away for the reload.
      store.dispatch(tokenRefreshed(token));
      return true;
    } catch {
      return false;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

function isExpired(error: unknown): boolean {
  return (
    error instanceof ApiClientError &&
    error.status === 401 &&
    (error.code === 'TOKEN_EXPIRED' || error.code === 'UNAUTHENTICATED')
  );
}

/**
 * Runs a call, and on an expired token refreshes once and runs it again.
 *
 * Only ever retried once: if the refresh itself fails the session is genuinely over, and
 * the local token is cleared so the UI stops pretending otherwise.
 */
async function withRefresh<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (!isExpired(error) || typeof window === 'undefined') throw error;

    if (!(await refreshSession())) {
      // The refresh token is gone too, so the session is genuinely over. Ending it in the
      // store is what makes the header stop showing a user who is no longer signed in.
      store.dispatch(sessionEnded());
      throw error;
    }
    return run();
  }
}

export const api: ApiClient = {
  request: (path, options) => withRefresh(() => base.request(path, options)),
  get: (path, options) => withRefresh(() => base.get(path, options)),
  post: (path, body, options) => withRefresh(() => base.post(path, body, options)),
  patch: (path, body, options) => withRefresh(() => base.patch(path, body, options)),
  del: (path, options) => withRefresh(() => base.del(path, options)),
  list: (path, options) => withRefresh(() => base.list(path, options)),
} as ApiClient;

export type { RequestOptions };
export { ApiClientError } from '@rokdajob/shared';
