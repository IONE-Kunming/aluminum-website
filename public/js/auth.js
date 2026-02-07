// Authentication Manager
import { firebaseConfig } from './config.js';

class AuthManager {
  constructor() {
    this.user = null;
    this.userProfile = null;
    this.listeners = [];
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    
    try {
      // Initialize Firebase
      firebase.initializeApp(firebaseConfig);
      this.auth = firebase.auth();
      this.db = firebase.firestore();
      
      // Listen to auth state changes
      this.auth.onAuthStateChanged(async (user) => {
        this.user = user;
        
        if (user) {
          // Fetch user profile
          try {
            const userDoc = await this.db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
              this.userProfile = userDoc.data();
            }
          } catch (error) {
            console.error('Error fetching user profile:', error);
          }
        } else {
          this.userProfile = null;
        }
        
        this.notifyListeners();
      });
      
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing Firebase:', error);
    }
  }

  // Wait for user profile to be loaded
  async waitForProfile(maxWaitTime = 3000) {
    // If profile is already loaded, return immediately
    if (this.userProfile) {
      return this.userProfile;
    }
    
    // If user is not authenticated, return null
    if (!this.user) {
      return null;
    }
    
    // Create a promise that resolves when profile is loaded
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(this.userProfile);
      }, maxWaitTime);
      
      // Listen for profile changes
      const checkProfile = () => {
        if (this.userProfile) {
          clearTimeout(timeout);
          resolve(this.userProfile);
        }
      };
      
      // Add one-time listener
      const listener = (user, profile) => {
        if (profile) {
          clearTimeout(timeout);
          this.listeners = this.listeners.filter(l => l !== listener);
          resolve(profile);
        }
      };
      
      this.listeners.push(listener);
      
      // Check immediately in case profile loaded while we were setting up
      checkProfile();
    });
  }

  onAuthStateChanged(callback) {
    this.listeners.push(callback);
    // Call immediately with current state
    if (this.initialized) {
      callback(this.user, this.userProfile);
    }
  }

  notifyListeners() {
    this.listeners.forEach(callback => callback(this.user, this.userProfile));
  }

  async signIn(email, password) {
    try {
      const result = await this.auth.signInWithEmailAndPassword(email, password);
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async signUp(email, password, displayName) {
    try {
      const result = await this.auth.createUserWithEmailAndPassword(email, password);
      await result.user.updateProfile({ displayName });
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async signInWithGoogle() {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const result = await this.auth.signInWithPopup(provider);
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async signOut() {
    try {
      await this.auth.signOut();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async updateUserProfile(uid, profileData) {
    try {
      await this.db.collection('users').doc(uid).set(profileData, { merge: true });
      this.userProfile = { ...this.userProfile, ...profileData };
      this.notifyListeners();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getCurrentUser() {
    return this.user;
  }

  getUserProfile() {
    return this.userProfile;
  }

  isAuthenticated() {
    return !!this.user;
  }

  hasRole(role) {
    return this.userProfile && this.userProfile.role === role;
  }
}

const authManager = new AuthManager();
export default authManager;
