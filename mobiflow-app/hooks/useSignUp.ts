import { useState, useCallback } from 'react';
import { Alert } from 'react-native';

import { signUp, getAuthErrorMessage } from '../services/authService';
import { isPasswordStrong } from '../utils/passwordStrength';

/**
 * Hook for sign-up. Handles validation, loading state, and error alerts.
 * Returns success so the screen can navigate.
 */
export function useSignUp(): {
  signUp: (email: string, password: string, confirmPassword: string) => Promise<boolean>;
  loading: boolean;
} {
  const [loading, setLoading] = useState(false);

  const signUpUser = useCallback(
    async (email: string, password: string, confirmPassword: string): Promise<boolean> => {
      if (!email.trim() || !password || !confirmPassword) {
        Alert.alert('Error', 'Please fill in all fields.');
        return false;
      }
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match.');
        return false;
      }
      if (!isPasswordStrong(password)) {
        Alert.alert(
          'Weak password',
          'Use at least 8 characters with uppercase, lowercase, a number, and a special character.'
        );
        return false;
      }
      setLoading(true);
      try {
        await signUp(email, password);
        return true;
      } catch (err: unknown) {
        const code = err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : '';
        const msg = getAuthErrorMessage(code, 'Registration failed.');
        Alert.alert('Registration failed', msg);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { signUp: signUpUser, loading };
}
