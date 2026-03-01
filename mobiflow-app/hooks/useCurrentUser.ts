/** Current user from Firebase auth (or null). We use currentUser first so the UI doesn’t wait, then listen for sign-in/out. */
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';

import { auth } from '../config/firebase';

export function useCurrentUser(): { user: User | null; userId: string; loading: boolean } {
  const [user, setUser] = useState<User | null>(() => auth.currentUser);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { user, userId: user?.uid ?? '', loading };
}
