import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import {
  sessionEnded,
  sessionStarted,
  tokenRefreshed,
  userUpdated,
  type AuthState,
} from './auth-slice';
import { clearSession, getAccessToken, getStoredUser, saveSession } from '@/lib/auth/session';

/**
 * Keeps `localStorage` in step with the auth slice.
 *
 * In middleware rather than the reducer, so reducers stay pure and one place writes the
 * session. The store leads and storage follows, except for the boot read below.
 * `sessionRestored` is not listened for — it comes *from* storage.
 */
export const persistenceMiddleware = createListenerMiddleware();

persistenceMiddleware.startListening({
  matcher: isAnyOf(sessionStarted, tokenRefreshed, userUpdated, sessionEnded),
  effect: (_action, api) => {
    const { user, accessToken } = (api.getState() as { auth: AuthState }).auth;

    if (user && accessToken) saveSession(user, accessToken);
    else clearSession();
  },
});

/** The boot read. `null` on the server. */
export function readStoredSession(): { user: NonNullable<AuthState['user']>; accessToken: string } | null {
  if (typeof window === 'undefined') return null;

  const user = getStoredUser();
  const accessToken = getAccessToken();
  if (!user || !accessToken) return null;

  return { user, accessToken };
}
