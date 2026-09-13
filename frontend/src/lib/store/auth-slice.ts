import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthUser } from '@rokdajob/shared';

/**
 * Who is signed in — the single source of truth for it.
 *
 * `status` matters as much as `user`: the session lives in `localStorage`, which does not
 * exist during a server render, so the first client render has to match the server's
 * "nobody is here". Components render a neutral state while it is `unknown`.
 */
export type AuthStatus = 'unknown' | 'ready';

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  status: AuthStatus;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  status: 'unknown',
};

export interface SessionPayload {
  user: AuthUser;
  accessToken: string;
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** Boot: the browser has been read, with or without a session. */
    sessionRestored(state, action: PayloadAction<SessionPayload | null>) {
      state.user = action.payload?.user ?? null;
      state.accessToken = action.payload?.accessToken ?? null;
      state.status = 'ready';
    },

    /** A fresh sign-in, registration or OAuth landing. */
    sessionStarted(state, action: PayloadAction<SessionPayload>) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.status = 'ready';
    },

    /** A silent refresh replaced the token; the user is unchanged. */
    tokenRefreshed(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
    },

    /** The profile changed: new avatar, verified email, approval granted. */
    userUpdated(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
      state.status = 'ready';
    },

    sessionEnded(state) {
      state.user = null;
      state.accessToken = null;
      state.status = 'ready';
    },
  },
});

export const { sessionRestored, sessionStarted, tokenRefreshed, userUpdated, sessionEnded } =
  authSlice.actions;

export const authReducer = authSlice.reducer;

/* ------------------------------------------------------------------ selectors */

interface WithAuth {
  auth: AuthState;
}

export const selectAuth = (state: WithAuth): AuthState => state.auth;
export const selectAuthUser = (state: WithAuth): AuthUser | null => state.auth.user;
export const selectAccessToken = (state: WithAuth): string | null => state.auth.accessToken;

/** True once the browser has been read. */
export const selectAuthReady = (state: WithAuth): boolean => state.auth.status === 'ready';

export const selectIsSignedIn = createSelector(
  selectAuthUser,
  selectAccessToken,
  (user, token) => Boolean(user && token),
);

export const selectIsWorker = createSelector(
  selectAuthUser,
  (user) => user?.role === 'WORKER',
);

export const selectIsEmployer = createSelector(
  selectAuthUser,
  (user) => user?.role === 'EMPLOYER',
);

/** May act (post, apply, message), not merely signed in. A PENDING contractor fails this. */
export const selectCanAct = createSelector(selectAuthUser, (user) => {
  if (!user?.registrationComplete || user.status !== 'ACTIVE') return false;
  return user.approval.status === 'APPROVED' || user.approval.status === 'AUTO_APPROVED';
});

/** Where this user's own area lives. */
export const selectHomeRoute = createSelector(selectAuthUser, (user) => {
  if (!user) return '/auth/login';
  if (!user.registrationComplete) return '/auth/role';
  if (user.role === 'ADMIN') return '/e';
  if (user.role === 'EMPLOYER') {
    return user.approval.status === 'APPROVED' || user.approval.status === 'AUTO_APPROVED'
      ? '/e'
      : '/auth/pending';
  }
  return '/w';
});
