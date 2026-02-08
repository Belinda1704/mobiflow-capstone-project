// login, signup, logout - all the auth stuff
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

import { auth, db } from '../config/firebase';

export async function signIn(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function signUp(email: string, password: string): Promise<void> {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  try {
    await setDoc(doc(db, 'users', cred.user.uid), {
      email: email.trim(),
      createdAt: new Date().toISOString(),
    });
  } catch {
    // non-blocking if Firestore rules block the write
  }
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export function getAuthErrorMessage(code: string, fallback: string): string {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/invalid-email':
    case 'auth/wrong-password':
      return 'Invalid email or password.';
    case 'auth/email-already-in-use':
      return 'This email is already registered.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    default:
      return fallback;
  }
}
