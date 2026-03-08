import { useState, useCallback } from 'react';

import { signUp, getAuthErrorMessage } from '../services/authService';
import { showError } from '../services/errorPresenter';
import { isPasswordStrong } from '../utils/passwordStrength';
import { validateRwandaPhone } from '../utils/phoneUtils';

// Sign-up: validation, loading, errors shown via errorPresenter.
export function useSignUp(): {
  signUp: (phone: string, password: string, confirmPassword: string) => Promise<boolean>;
  loading: boolean;
} {
  const [loading, setLoading] = useState(false);

  const signUpUser = useCallback(
    async (phone: string, password: string, confirmPassword: string): Promise<boolean> => {
      if (!phone.trim() || !password || !confirmPassword) {
        showError('Error', 'Please fill in all fields.');
        return false;
      }
      const phoneError = validateRwandaPhone(phone);
      if (phoneError) {
        showError('Invalid phone', phoneError);
        return false;
      }
      if (password !== confirmPassword) {
        showError('Error', 'Passwords do not match.');
        return false;
      }
      if (!isPasswordStrong(password)) {
        showError(
          'Weak password',
          'Use at least 8 characters with uppercase, lowercase, a number, and a special character.'
        );
        return false;
      }
      setLoading(true);
      try {
        await signUp(phone, password);
        return true;
      } catch (err: unknown) {
        const code = err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : '';
        const msg = getAuthErrorMessage(code, 'Registration failed.');
        showError('Registration failed', msg);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { signUp: signUpUser, loading };
}
