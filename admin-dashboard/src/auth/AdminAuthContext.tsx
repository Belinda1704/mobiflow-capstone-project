import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import { auth, db } from '../firebase/config';
import { normalizeAdminIdentifier, validateAdminIdentifier } from '../utils/phone';

type AdminAuthContextValue = {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  signIn: (identifier: string, password: string) => Promise<boolean>;
  requestPasswordReset: (identifier: string) => Promise<boolean>;
  signOutAdmin: () => Promise<void>;
  clearError: () => void;
};

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

async function loadAdminFlag(userId: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'users', userId));
  return snap.exists() && snap.data()?.isAdmin === true;
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setLoading(true);
      if (!nextUser) {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const admin = await loadAdminFlag(nextUser.uid);
        setUser(nextUser);
        setIsAdmin(admin);
        if (!admin) {
          setError('This account is not marked as admin.');
        }
      } catch {
        setUser(nextUser);
        setIsAdmin(false);
        setError('Could not verify admin access.');
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const signIn = useCallback(async (identifier: string, password: string) => {
    setError(null);

    const trimmedIdentifier = identifier.trim();
    const trimmedPassword = password.trim();

    if (!trimmedIdentifier || !trimmedPassword) {
      setError('Enter email and password.');
      return false;
    }

    const identifierError = validateAdminIdentifier(trimmedIdentifier);
    if (identifierError) {
      setError(identifierError);
      return false;
    }

    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        normalizeAdminIdentifier(trimmedIdentifier),
        trimmedPassword
      );
      const admin = await loadAdminFlag(credential.user.uid);
      if (!admin) {
        await signOut(auth);
        setError('This account is not allowed to access the admin dashboard.');
        return false;
      }
      setUser(credential.user);
      setIsAdmin(true);
      return true;
    } catch {
      setError('Sign in failed. Check your email and password.');
      return false;
    }
  }, []);

  const requestPasswordReset = useCallback(async (identifier: string) => {
    setError(null);

    const trimmedIdentifier = identifier.trim();
    if (!trimmedIdentifier) {
      setError('Enter your admin email first.');
      return false;
    }

    const identifierError = validateAdminIdentifier(trimmedIdentifier);
    if (identifierError) {
      setError(identifierError);
      return false;
    }

    try {
      await sendPasswordResetEmail(auth, normalizeAdminIdentifier(trimmedIdentifier));
      return true;
    } catch {
      setError('Could not send reset email. Check the admin email address.');
      return false;
    }
  }, []);

  const signOutAdmin = useCallback(async () => {
    await signOut(auth);
    setUser(null);
    setIsAdmin(false);
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo(
    () => ({ user, isAdmin, loading, error, signIn, requestPasswordReset, signOutAdmin, clearError }),
    [user, isAdmin, loading, error, signIn, requestPasswordReset, signOutAdmin, clearError]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used inside AdminAuthProvider.');
  }
  return context;
}
