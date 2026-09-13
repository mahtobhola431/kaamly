'use client';

import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './index';
import { sessionRestored } from './auth-slice';
import { readStoredSession } from './persistence';

/**
 * Boots the session into the store.
 *
 * In an effect rather than at store creation: `localStorage` does not exist while the
 * server renders, so seeding from it would make the first client render disagree with the
 * HTML that was sent. The store starts empty on both sides and reads the browser a tick
 * later.
 */
function SessionBootstrap() {
  useEffect(() => {
    store.dispatch(sessionRestored(readStoredSession()));

    // Signing in or out in one tab must not leave another on the old identity.
    const onStorage = (event: StorageEvent): void => {
      if (event.key === null || event.key.startsWith('kaamly.')) {
        store.dispatch(sessionRestored(readStoredSession()));
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return null;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <SessionBootstrap />
      {children}
    </Provider>
  );
}
