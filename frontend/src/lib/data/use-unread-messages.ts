'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@/lib/auth/use-session';
import { getUnreadMessageCount } from '@/lib/data/conversations';

/**
 * Unread count for the shell badge. A plain fetch, not react-query: one number on a slow
 * poll needs no cache. Returns `0` on failure rather than breaking navigation.
 */
export function useUnreadMessages(intervalMs = 60_000): number {
  const { signedIn } = useSession();
  const [count, setCount] = useState(0);

  useEffect(() => {
    // From the store, so polling starts when the session arrives rather than on mount.
    if (!signedIn) return;

    let cancelled = false;

    const read = async (): Promise<void> => {
      try {
        const { total } = await getUnreadMessageCount();
        if (!cancelled) setCount(total);
      } catch {
        // Offline, or the session ended. Leave the badge as it was.
      }
    };

    void read();
    const timer = window.setInterval(() => void read(), intervalMs);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [intervalMs, signedIn]);

  return count;
}
