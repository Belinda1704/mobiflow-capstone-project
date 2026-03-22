// Firebase user: start from auth.currentUser, then onAuthStateChanged for login/logout.
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';

import { auth } from '../config/firebase';
import { authTrace } from '../utils/authTrace';

export function useCurrentUser(): { user: User | null; userId: string; loading: boolean } {
  const [user, setUser] = useState<User | null>(() => auth.currentUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authTrace('useCurrentUser mount', {
      hasCurrentUserAtMount: !!auth.currentUser,
      uidAtMount: auth.currentUser?.uid ?? null,
    });

    const unsub = onAuthStateChanged(auth, (u) => {
      authTrace('onAuthStateChanged fired', {
        hasUser: !!u,
        uid: u?.uid ?? null,
      });
      setUser(u);
      setLoading(false);
    });

    return () => {
      authTrace('useCurrentUser unmount');
      unsub();
    };
  }, []);

  return { user, userId: user?.uid ?? '', loading };
}
