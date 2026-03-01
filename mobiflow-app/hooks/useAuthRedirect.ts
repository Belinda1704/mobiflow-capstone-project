import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';

import { auth } from '../config/firebase';

// send to tabs if logged in, else to login. waits for Firebase to restore session first
export function useAuthRedirect(
  onAuthenticated: () => void,
  onUnauthenticated?: () => void,
  skip = false
): void {
  useEffect(() => {
    if (skip) return;

    const currentUser = auth.currentUser;
    if (currentUser) {
      onAuthenticated();
    }
    // in case auth loads from storage late
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        onAuthenticated();
      } else if (onUnauthenticated) {
        onUnauthenticated();
      }
    });
    return unsub;
  }, [onAuthenticated, onUnauthenticated, skip]);
}
