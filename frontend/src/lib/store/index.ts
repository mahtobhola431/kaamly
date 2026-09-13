import { configureStore } from '@reduxjs/toolkit';
import { authReducer } from './auth-slice';
import { persistenceMiddleware } from './persistence';

/**
 * One store at module scope rather than per request.
 *
 * Safe because of what is in it: the only slice is the session, read from the browser
 * after mount and never populated during a server render, so nothing user-specific can
 * leak between requests. Module scope is also what lets the API client — a plain module
 * with no hooks — read the access token.
 */
export function makeStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().prepend(persistenceMiddleware.middleware),
  });
}

export const store = makeStore();

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

export * from './auth-slice';
