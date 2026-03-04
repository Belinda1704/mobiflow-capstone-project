// Firebase: auth, Firestore, Storage. Config from .env via app.config.js
import Constants from 'expo-constants';
import { initializeApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = Constants.expoConfig?.extra?.firebase as Record<string, string> | undefined;
if (!firebaseConfig?.apiKey) {
  throw new Error('Missing Firebase config. Copy .env.example to .env and add your Firebase credentials.');
}

const app = initializeApp(firebaseConfig);

// keep login after app close – use AsyncStorage so user stays signed in across app restarts
let auth: Auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  try {
    const rnAuth = require('@firebase/auth');
    auth = rnAuth.initializeAuth(app, {
      persistence: rnAuth.getReactNativePersistence(AsyncStorage),
    });
  } catch (err: unknown) {
    // already init (e.g. hot reload)
    if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'auth/already-initialized') {
      auth = getAuth(app);
    } else {
      throw err;
    }
  }
}

const storage = getStorage(app);

export { auth };

export const db = getFirestore(app);

// Firestore offline cache – IndexedDB is web-only; on Android/iOS the JS SDK uses in-memory cache (no enableIndexedDbPersistence)
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