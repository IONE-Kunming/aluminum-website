// Firebase configuration
// ⚠️ IMPORTANT: Replace these demo credentials with your actual Firebase project credentials
// Get them from Firebase Console > Project Settings > Your apps
// 
// For production:
// 1. Create a Firebase project at https://console.firebase.google.com/
// 2. Enable Authentication (Email/Password + Google Sign-In)
// 3. Create a Firestore database
// 4. Enable Firebase Storage
// 5. Copy your config values here
// 
// NOTE: Consider using environment variables for sensitive data:
// - Create a .env file with VITE_FIREBASE_* variables
// - Use import.meta.env.VITE_FIREBASE_API_KEY instead of hardcoded values
// - Add .env to .gitignore to prevent committing secrets

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
  measurementId: "G-XXXXXXXXXX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
