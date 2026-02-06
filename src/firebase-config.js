// Firebase configuration
// Using actual Firebase project: gen-lang-client-0988357303
// Make sure to enable the following in Firebase Console:
// 1. Authentication > Sign-in method > Email/Password
// 2. Authentication > Sign-in method > Google
// 3. Firestore Database
// 4. Storage

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyA2soyxD1Bqe40CmgMDIGnPKmTp6QW2vmM",
  authDomain: "gen-lang-client-0988357303.firebaseapp.com",
  projectId: "gen-lang-client-0988357303",
  storageBucket: "gen-lang-client-0988357303.firebasestorage.app",
  messagingSenderId: "248469969544",
  appId: "1:248469969544:web:460684f506faec8b9b1d3d",
  measurementId: "G-J7L65NCMB5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
