import { useState, useCallback } from 'react';

import { signIn, getAuthErrorMessage } from '../services/authService';
import { showError } from '../services/errorPresenter';
import { validateRwandaPhone } from '../utils/phoneUtils';

// Sign-in: validation, loading, errors shown via errorPresenter.
export function useSignIn(): {
  signIn: (phone: string, password: string) => Promise<boolean>;
  loading: boolean;
} {
  const [loading, setLoading] = useState(false);

  const signInUser = useCallback(async (phone: string, password: string): Promise<boolean> => {
    if (!phone.trim() || !password) {
      showError('Error', 'Please enter phone number and password.');
      return false;
    }
    const phoneError = validateRwandaPhone(phone);
    if (phoneError) {
      showError('Invalid phone', phoneError);
      return false;
    }
    setLoading(true);
    try {
      await signIn(phone, password);
      return true;
    } catch (err: unknown) {
      const code = err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : '';
      const msg = getAuthErrorMessage(code, 'Sign in failed.');
      showError('Sign in failed', msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { signIn: signInUser, loading };
}
