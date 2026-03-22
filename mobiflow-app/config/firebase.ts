// Firebase setup: auth, Firestore, Storage. Config comes from .env in app.config.js
import Constants from 'expo-constants';
import { initializeApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = Constants.expoConfig?.extra?.firebase as Record<string, string> | undefined;
if (!firebaseConfig?.apiKey) {
  throw new Error('Missing Firebase config. Add .env with your keys (see README / docs/LOCAL_ENV_SETUP.md).');
}

const app = initializeApp(firebaseConfig);

// On native, AsyncStorage is used so login persists after closing the app. @firebase/auth is required so the bundler picks the react-native build with getReactNativePersistence.
let auth: Auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  const rnAuth = require('@firebase/auth');
  try {
    auth = rnAuth.initializeAuth(app, {
      persistence: rnAuth.getReactNativePersistence(AsyncStorage),
    });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'auth/already-initialized') {
      auth = rnAuth.getAuth(app);
    } else {
      throw err;
    }
  }
}

const storage = getStorage(app);

export { auth };

export const db = getFirestore(app);

// Firestore offline cache: only on web (IndexedDB). On Android/iOS the SDK uses in-memory only.
if (Platform.OS === 'web') {
  enableIndexedDbPersistence(db).catch((err: { code: string }) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore persistence already enabled in another tab');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore persistence not available on this platform');
    } else {
      console.warn('Firestore persistence error:', err);
    }
  });
}

export { storage };