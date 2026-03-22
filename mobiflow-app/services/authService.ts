// Auth: login, signup, logout. Phone as id (phone@mobiflow.phone in Firebase).
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword as firebaseUpdatePassword,
  updateEmail,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

import { auth, db } from '../config/firebase';
import { phoneToAuthId } from '../utils/phoneUtils';
import { authTrace } from '../utils/authTrace';

export async function signIn(phone: string, password: string): Promise<void> {
  const authId = phoneToAuthId(phone);
  if (!authId) throw new Error('Invalid phone number');
  authTrace('signIn called', { authId });
  await signInWithEmailAndPassword(auth, authId, password);
  authTrace('signIn success', { uid: auth.currentUser?.uid ?? null });
}

export async function signUp(phone: string, password: string): Promise<void> {
  const authId = phoneToAuthId(phone);
  if (!authId) throw new Error('Invalid phone number');
  const cred = await createUserWithEmailAndPassword(auth, authId, password);
  try {
    await setDoc(doc(db, 'users', cred.user.uid), {
      phone: phone.trim(),
      createdAt: new Date().toISOString(),
    });
  } catch {
    // Firestore fail doesn’t fail signup
  }
}

export async function signOutUser(): Promise<void> {
  authTrace('signOutUser called', {
    uidBefore: auth.currentUser?.uid ?? null,
  });
  await signOut(auth);
  authTrace('signOutUser finished', {
    uidAfter: auth.currentUser?.uid ?? null,
  });
}

// Delete account (must be signed in recently).
export async function deleteAccount(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in');
  await deleteUser(user);
}

export async function updatePassword(currentPassword: string, newPassword: string): Promise<void> {
  const user = auth.currentUser;
  if (!user?.email) throw new Error('Not signed in or no email');
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await firebaseUpdatePassword(user, newPassword);
}

// Change phone (login id). Reauth then update Auth + users doc.
export async function updatePhoneNumber(currentPassword: string, newPhone: string): Promise<void> {
  const user = auth.currentUser;
  if (!user?.email) throw new Error('Not signed in or no email');
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  const newAuthId = phoneToAuthId(newPhone);
  if (!newAuthId) throw new Error('Invalid phone number');
  await updateEmail(user, newAuthId);
  const userRef = doc(db, 'users', user.uid);
  try {
    await setDoc(userRef, { phone: newPhone.trim() }, { merge: true });
  } catch {
    // Firestore fail doesn’t block
  }
}

// Save profile photo URL to Firebase (after upload to Storage).
export async function updateProfilePhoto(photoURL: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in');
  await updateProfile(user, { photoURL });
}

export function isEmailPasswordUser(): boolean {
  const user = auth.currentUser;
  if (!user) return false;
  return user.providerData.some((p) => p.providerId === 'password');
}

export function getAuthErrorMessage(code: string, fallback: string): string {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/invalid-email':
    case 'auth/wrong-password':
      return 'Invalid phone number or password.';
    case 'auth/email-already-in-use':
      return 'This phone number is already registered.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    default:
      return fallback;
  }
}
