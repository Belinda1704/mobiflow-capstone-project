import { useState, useCallback } from 'react';
import { Alert } from 'react-native';

import { signIn, getAuthErrorMessage } from '../services/authService';

/**
 * Hook for sign-in. Handles validation, loading state, and error alerts.
 * Returns success so the screen can navigate.
 */
export function useSignIn(): {
  signIn: (email: string, password: string) => Promise<boolean>;
  loading: boolean;
} {
  const [loading, setLoading] = useState(false);

  const signInUser = useCallback(async (email: string, password: string): Promise<boolean> => {
    if (!email.trim() || !password) {
      Alert.alert('Error', 'Please enter email and password.');
      return false;
    }
    setLoading(true);
    try {
      await signIn(email, password);
      return true;
    } catch (err: unknown) {
      const code = err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : '';
      const msg = getAuthErrorMessage(code, 'Sign in failed.');
      Alert.alert('Sign in failed', msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { signIn: signInUser, loading };
}
