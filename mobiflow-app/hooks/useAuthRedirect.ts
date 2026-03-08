import { useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';

import { auth } from '../config/firebase';

// Give Firebase time to restore persisted session from AsyncStorage before redirecting to login.
const AUTH_RESTORE_WAIT_MS = 6000;

export function useAuthRedirect(
  onAuthenticated: () => void,
  onUnauthenticated?: () => void,
  skip = false
): void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (skip) return;

    let cancelled = false;

    const goAuthenticated = () => {
      if (cancelled || redirectedRef.current) return;
      redirectedRef.current = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      onAuthenticated();
    };

    const scheduleUnauthenticated = () => {
      if (cancelled || redirectedRef.current || !onUnauthenticated) return;
      if (timeoutRef.current) return;
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        if (!cancelled && !redirectedRef.current) {
          onUnauthenticated();
        }
      }, AUTH_RESTORE_WAIT_MS);
    };

    const unsub = onAuthStateChanged(auth, (user) => {
      if (cancelled) return;
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
      // Start the timer in case we stay unauthenticated (no persisted session).
      scheduleUnauthenticated();
    }

    return () => {
      cancelled = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      unsub();
    };
  }, [onAuthenticated, onUnauthenticated, skip]);
}
