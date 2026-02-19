// Authentication Manager
import { firebaseConfig } from './config.js';

class AuthManager {
  constructor() {
    this.user = null;
    this.userProfile = null;
    this.listeners = [];
    this.initialized = false;
    this.authStateResolved = false;
    this.authStateResolvers = [];
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
        const currentUserUid = user ? user.uid : null;
        this.user = user;
        
        if (user) {
          // Fetch user profile
          try {
            const userDoc = await this.db.collection('users').doc(user.uid).get();
            // Only update profile if this is still the current user
            // This prevents race conditions when multiple users log in simultaneously
            if (this.user && this.user.uid === currentUserUid) {
              if (userDoc.exists) {
                // Include the UID in the profile data for tracking
                this.userProfile = { uid: user.uid, ...userDoc.data() };
              } else {
                // User document doesn't exist in Firestore - set to null
                this.userProfile = null;
              }
            }
          } catch (error) {
            console.error('Error fetching user profile:', error);
            // Set profile to null on error to avoid stale data
            if (this.user && this.user.uid === currentUserUid) {
              this.userProfile = null;
            }
          }
        } else {
          this.userProfile = null;
        }
        
        // Mark auth state as resolved on first callback
        if (!this.authStateResolved) {
          this.authStateResolved = true;
          this.authStateResolvers.forEach(resolve => resolve());
          this.authStateResolvers = [];
        }
        
        this.notifyListeners();
      });
      
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing Firebase:', error);
    }
  }

  /**
   * Wait for the initial authentication state to be determined
   * This ensures Firebase has had a chance to restore any existing session
   * @param {number} maxWaitTime - Maximum time to wait in milliseconds (default: 5000ms)
   * @returns {Promise<boolean>} True when auth state is successfully determined, false on timeout.
   * Note: Even on timeout (returns false), the auth check will proceed, which is safe as it will
   * correctly identify unauthenticated users if Firebase truly couldn't restore a session.
   */
  async waitForAuthState(maxWaitTime = 5000) {
    // If auth state is already resolved, return immediately
    if (this.authStateResolved) {
      return true;
    }
    
    // Wait for the auth state to be determined
    return new Promise((resolve) => {
      // Add resolver to be called when auth state is determined
      const wrappedResolve = () => {
        clearTimeout(timeout);
        resolve(true);
      };
      
      const timeout = setTimeout(() => {
        // Check again if auth state was resolved while timeout was executing
        if (this.authStateResolved) {
          resolve(true);
          return;
        }
        
        // Remove resolver if still present
        this.authStateResolvers = this.authStateResolvers.filter(r => r !== wrappedResolve);
        this.authStateResolved = true;
        resolve(false);
      }, maxWaitTime);
      
      this.authStateResolvers.push(wrappedResolve);
    });
  }

  /**
   * Wait for user profile to be loaded from Firestore
   * @param {number} maxWaitTime - Maximum time to wait in milliseconds (default: 3000ms)
   * @returns {Promise<Object|null>} The user profile or null if not loaded within timeout
   */
  async waitForProfile(maxWaitTime = 3000) {
    // If user is not authenticated, return null
    if (!this.user) {
      return null;
    }
    
    // Store the current user UID to verify we get the correct profile
    const expectedUid = this.user.uid;
    
    // If profile is already loaded for this user, return immediately
    if (this.userProfile && this.userProfile.uid === expectedUid) {
      return this.userProfile;
    }
    
    // Create a promise that resolves when the correct profile is loaded
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        // Remove listener if still present
        this.listeners = this.listeners.filter(l => l !== listener);
        // Return the profile if it matches the expected user, null otherwise
        resolve(this.userProfile && this.userProfile.uid === expectedUid ? this.userProfile : null);
      }, maxWaitTime);
      
      // Add one-time listener
      const listener = (user, profile) => {
        // Only resolve if profile is loaded and belongs to the expected user
        if (profile && profile.uid === expectedUid) {
          clearTimeout(timeout);
          this.listeners = this.listeners.filter(l => l !== listener);
          resolve(profile);
        }
      };
      
      this.listeners.push(listener);
      
      // Check immediately in case profile loaded while we were setting up
      if (this.userProfile && this.userProfile.uid === expectedUid) {
        clearTimeout(timeout);
        this.listeners = this.listeners.filter(l => l !== listener);
        resolve(this.userProfile);
      }
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
      // Preserve uid field when merging profile data
      this.userProfile = { ...this.userProfile, ...profileData, uid: this.userProfile?.uid || uid };
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

  /**
   * Update user profile information (email, phone, displayName, etc.)
   * @param {Object} updates - Object containing fields to update (email, phoneNumber, displayName)
   * @returns {Promise<Object>} Result object with success status
   */
  async updateProfileFields(updates) {
    try {
      if (!this.user) {
        throw new Error('User not authenticated');
      }

      const updateData = {};
      
      // Handle display name update in Firebase Auth
      if (updates.displayName !== undefined && updates.displayName !== (this.user.displayName || '')) {
        try {
          await this.user.updateProfile({ displayName: updates.displayName });
          updateData.displayName = updates.displayName;
        } catch (error) {
          console.error('Error updating display name in Auth:', error);
          throw new Error('Failed to update display name: ' + error.message);
        }
      }
      
      // Handle email update (requires re-authentication for security)
      if (updates.email !== undefined && updates.email !== this.user.email) {
        // Note: Email updates require recent authentication
        // Firebase will throw an error if the user hasn't recently signed in
        try {
          await this.user.updateEmail(updates.email);
          updateData.email = updates.email;
        } catch (error) {
          // If re-authentication is required, throw a specific error
          if (error.code === 'auth/requires-recent-login') {
            throw new Error('For security reasons, please log out and log back in before changing your email address.');
          }
          throw error;
        }
      }
      
      if (updates.phoneNumber !== undefined) {
        updateData.phoneNumber = updates.phoneNumber;
      }
      
      if (updates.preferredLanguage !== undefined) {
        updateData.preferredLanguage = updates.preferredLanguage;
      }
      
      // Update Firestore user document if there are changes
      if (Object.keys(updateData).length > 0) {
        await this.db.collection('users').doc(this.user.uid).update(updateData);
        
        // Update local profile and preserve uid field
        this.userProfile = { ...this.userProfile, ...updateData, uid: this.userProfile?.uid || this.user.uid };
        this.notifyListeners();
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    }
  }
}

const authManager = new AuthManager();
export default authManager;
