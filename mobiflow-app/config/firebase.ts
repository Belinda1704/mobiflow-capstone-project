// connects app to Firebase - we use auth and Firestore
import Constants from 'expo-constants';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = Constants.expoConfig?.extra?.firebase as Record<string, string> | undefined;
if (!firebaseConfig?.apiKey) {
  throw new Error('Missing Firebase config. Copy .env.example to .env and add your Firebase credentials.');
}

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

export { auth };
export const db = getFirestore(app);
