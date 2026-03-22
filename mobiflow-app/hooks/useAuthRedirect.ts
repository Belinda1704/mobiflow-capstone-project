import { useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';

import { auth } from '../config/firebase';
import { authTrace } from '../utils/authTrace';

// Give Firebase time to restore persisted session from AsyncStorage before redirecting to login.
const AUTH_RESTORE_WAIT_MS = 2500;

export function useAuthRedirect(
  onAuthenticated: () => void,
  onUnauthenticated?: () => void,
  skip = false
): void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (skip) return;

    authTrace('useAuthRedirect start', {
      hasCurrentUser: !!auth.currentUser,
      uid: auth.currentUser?.uid ?? null,
    });

    let cancelled = false;

    const goAuthenticated = () => {
      if (cancelled || redirectedRef.current) return;
      redirectedRef.current = true;
      authTrace('redirect -> authenticated');
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      onAuthenticated();
    };

    const scheduleUnauthenticated = () => {
      if (cancelled || redirectedRef.current || !onUnauthenticated) return;
      if (timeoutRef.current) return;
      authTrace('schedule unauthenticated redirect', {
        waitMs: AUTH_RESTORE_WAIT_MS,
      });
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        if (!cancelled && !redirectedRef.current) {
          authTrace('redirect -> unauthenticated');
          onUnauthenticated();
        }
      }, AUTH_RESTORE_WAIT_MS);
    };

    const unsub = onAuthStateChanged(auth, (user) => {
      if (cancelled) return;
      authTrace('useAuthRedirect onAuthStateChanged', {
        hasUser: !!user,
        uid: user?.uid ?? null,
      });
      if (user) {
        goAuthenticated();
      } else {
        // Firebase may fire once with null before persistence restores. Delay redirect to login so session can restore.
        scheduleUnauthenticated();
      }
    });

    // If Firebase already has a user when this hook runs (session already restored), redirect immediately.
    if (auth.currentUser) {
      goAuthenticated();
    } else {
      // Timer: if still no user after wait, go to login (no saved session).
      scheduleUnauthenticated();
    }

    return () => {
      cancelled = true;
      authTrace('useAuthRedirect cleanup');
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      unsub();
    };
  }, [onAuthenticated, onUnauthenticated, skip]);
}
