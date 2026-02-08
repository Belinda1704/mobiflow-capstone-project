// connects app to Firebase - we use auth and Firestore
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBl6QRy9IdrrdXmqnNTpMiQXR0BmLSTllY',
  authDomain: 'mobiflow-app.firebaseapp.com',
  projectId: 'mobiflow-app',
  storageBucket: 'mobiflow-app.firebasestorage.app',
  messagingSenderId: '542152592847',
  appId: '1:542152592847:web:78dbf4b6a06591a77ad6ba',
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

export { auth };
export const db = getFirestore(app);
