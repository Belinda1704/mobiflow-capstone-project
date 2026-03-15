import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: __ADMIN_FIREBASE_CONFIG__.apiKey,
  authDomain: __ADMIN_FIREBASE_CONFIG__.authDomain,
  projectId: __ADMIN_FIREBASE_CONFIG__.projectId,
  storageBucket: __ADMIN_FIREBASE_CONFIG__.storageBucket,
  messagingSenderId: __ADMIN_FIREBASE_CONFIG__.messagingSenderId,
  appId: __ADMIN_FIREBASE_CONFIG__.appId,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
  throw new Error('Missing Firebase configuration for admin-dashboard.');
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functionsClient = getFunctions(app, __ADMIN_FIREBASE_CONFIG__.functionsRegion || 'us-central1');
