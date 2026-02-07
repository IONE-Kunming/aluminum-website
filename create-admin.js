/**
 * Script to create an admin account in Firebase
 * Run this with: node create-admin.js
 * 
 * ⚠️⚠️⚠️ SECURITY WARNING ⚠️⚠️⚠️
 * 
 * This file contains hardcoded Firebase credentials and admin passwords.
 * 
 * *** DELETE THIS FILE IMMEDIATELY AFTER CREATING THE ADMIN ACCOUNT ***
 * 
 * To remove this file from your repository:
 * 1. git rm create-admin.js
 * 2. git commit -m "Remove admin creation script for security"
 * 3. git push
 * 
 * This file should NEVER remain in your repository after use.
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA2soyxD1Bqe40CmgMDIGnPKmTp6QW2vmM",
  authDomain: "gen-lang-client-0988357303.firebaseapp.com",
  projectId: "gen-lang-client-0988357303",
  storageBucket: "gen-lang-client-0988357303.firebasestorage.app",
  messagingSenderId: "248469969544",
  appId: "1:248469969544:web:460684f506faec8b9b1d3d",
  measurementId: "G-J7L65NCMB5"
};

// Admin credentials
const ADMIN_EMAIL = 'admin@ionealumatech.com';
const ADMIN_PASSWORD = 'Admin@2026!Secure';
const ADMIN_DISPLAY_NAME = 'IONE Admin';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdminAccount() {
  try {
    console.log('Creating admin account...');
    console.log('Email:', ADMIN_EMAIL);
    
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      ADMIN_EMAIL,
      ADMIN_PASSWORD
    );
    
    const user = userCredential.user;
    console.log('User created successfully with UID:', user.uid);
    
    // Update display name
    await updateProfile(user, {
      displayName: ADMIN_DISPLAY_NAME
    });
    console.log('Display name updated');
    
    // Create user profile in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: ADMIN_EMAIL,
      displayName: ADMIN_DISPLAY_NAME,
      role: 'admin',
      createdAt: new Date().toISOString(),
      companyName: 'IONE AlumaTech Industries',
      phoneNumber: '+1-800-IONE-ADM',
      address: 'Head Office, IONE Tower',
      country: 'United States',
      isActive: true,
      isEmailVerified: true
    });
    console.log('User profile created in Firestore');
    
    console.log('\n✅ Admin account created successfully!');
    console.log('\n=== Admin Credentials ===');
    console.log('Email:', ADMIN_EMAIL);
    console.log('Password:', ADMIN_PASSWORD);
    console.log('Role: admin');
    console.log('========================\n');
    console.log('⚠️  IMPORTANT: Save these credentials securely!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin account:', error.message);
    
    if (error.code === 'auth/email-already-in-use') {
      console.log('\nℹ️  The admin account already exists. Use these credentials:');
      console.log('\n=== Admin Credentials ===');
      console.log('Email:', ADMIN_EMAIL);
      console.log('Password:', ADMIN_PASSWORD);
      console.log('========================\n');
    }
    
    process.exit(1);
  }
}

createAdminAccount();
