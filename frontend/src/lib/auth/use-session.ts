'use client';

import type { AuthUser } from '@rokdajob/shared';
import {
  selectAuthReady,
  selectAuthUser,
  selectCanAct,
  selectHomeRoute,
  selectIsSignedIn,
} from '@/lib/store';
import { useAppSelector } from '@/lib/store/hooks';

export interface SessionState {
  user: AuthUser | null;
  /** True until the store has read the browser. */
  loading: boolean;
  signedIn: boolean;
  /** Signed in *and* cleared to act: a contractor at PENDING is not. */
  canAct: boolean;
  /** Where this user's own area lives. */
  homeRoute: string;
}

/** The signed-in user, read straight off the auth slice. */
export function useSession(): SessionState {
  const user = useAppSelector(selectAuthUser);
  const ready = useAppSelector(selectAuthReady);
  const signedIn = useAppSelector(selectIsSignedIn);
  const canAct = useAppSelector(selectCanAct);
  const homeRoute = useAppSelector(selectHomeRoute);

  return { user, loading: !ready, signedIn, canAct, homeRoute };
}
