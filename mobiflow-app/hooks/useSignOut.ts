import { useState, useCallback } from 'react';

import { signOutUser } from '../services/authService';

/**
 * Hook for sign-out. Handles loading and errors.
 * Returns success so the caller can navigate to login.
 */
export function useSignOut(): {
  signOut: () => Promise<boolean>;
  loading: boolean;
} {
  const [loading, setLoading] = useState(false);

  const signOut = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    try {
      await signOutUser();
      return true;
    } catch {
      return true;
    } finally {
      setLoading(false);
    }
  }, []);

  return { signOut, loading };
}
