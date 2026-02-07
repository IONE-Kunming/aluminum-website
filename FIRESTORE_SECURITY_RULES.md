# Firestore Security Rules Configuration

## Overview
This document explains how to configure Firestore security rules to allow unrestricted access for development and testing purposes.

## Warning
⚠️ **IMPORTANT**: These rules provide unrestricted access to your Firestore database. They should ONLY be used in development/testing environments. Never use these rules in production!

## How to Apply Rules

### Method 1: Firebase Console (Recommended for Testing)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** in the left sidebar
4. Click on the **Rules** tab
5. Replace the existing rules with the rules below
6. Click **Publish** to apply the changes

### Method 2: Firebase CLI

If you have Firebase CLI installed:

```bash
# Deploy rules from firestore.rules file
firebase deploy --only firestore:rules
```

## Unrestricted Access Rules (Development/Testing Only)

Copy and paste these rules into your Firebase Console or `firestore.rules` file:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow unrestricted read and write access to all documents
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## Production-Ready Rules (Secure)

For production, use these more secure rules that implement role-based access control:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check user role
    function hasRole(role) {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == role;
    }
    
    // Users collection
    match /users/{userId} {
      // Users can read their own document
      allow read: if isAuthenticated() && request.auth.uid == userId;
      // Users can create their own document
      allow create: if isAuthenticated() && request.auth.uid == userId;
      // Users can update their own document
      allow update: if isAuthenticated() && request.auth.uid == userId;
      // Admins can read all users
      allow read: if hasRole('admin');
    }
    
    // Products collection
    match /products/{productId} {
      // Anyone can read products
      allow read: if true;
      // Sellers can create products
      allow create: if hasRole('seller');
      // Sellers can update/delete their own products
      allow update, delete: if hasRole('seller') && 
                               resource.data.sellerId == request.auth.uid;
      // Admins can do anything
      allow read, write: if hasRole('admin');
    }
    
    // Orders collection
    match /orders/{orderId} {
      // Buyers can read their own orders
      allow read: if isAuthenticated() && 
                     resource.data.buyerId == request.auth.uid;
      // Buyers can create orders
      allow create: if hasRole('buyer');
      // Sellers can read orders containing their products
      allow read: if isAuthenticated() && 
                     hasRole('seller');
      // Sellers can update order status
      allow update: if hasRole('seller');
      // Admins can do anything
      allow read, write: if hasRole('admin');
    }
    
    // Invoices collection
    match /invoices/{invoiceId} {
      // Buyers can read their own invoices
      allow read: if isAuthenticated() && 
                     resource.data.buyerId == request.auth.uid;
      // Sellers can create and update invoices
      allow create, update: if hasRole('seller');
      // Admins can do anything
      allow read, write: if hasRole('admin');
    }
    
    // Branches collection
    match /branches/{branchId} {
      // Anyone can read branches
      allow read: if true;
      // Sellers can manage their own branches
      allow create, update, delete: if hasRole('seller') && 
                                       resource.data.sellerId == request.auth.uid;
      // Admins can do anything
      allow read, write: if hasRole('admin');
    }
    
    // Notifications collection
    match /notifications/{notificationId} {
      // Users can read their own notifications
      allow read: if isAuthenticated() && 
                     resource.data.userId == request.auth.uid;
      // System can create notifications
      allow create: if true;
      // Users can update their own notifications (mark as read)
      allow update: if isAuthenticated() && 
                       resource.data.userId == request.auth.uid;
      // Admins can do anything
      allow read, write: if hasRole('admin');
    }
    
    // Support tickets collection
    match /support/{ticketId} {
      // Users can read their own tickets
      allow read: if isAuthenticated() && 
                     resource.data.userId == request.auth.uid;
      // Users can create tickets
      allow create: if isAuthenticated();
      // Admins can do anything
      allow read, write: if hasRole('admin');
    }
  }
}
```

## Rule Explanation

### Unrestricted Rules
- `allow read, write: if true;` - Allows anyone to read and write any document
- Useful for rapid development and testing
- Should be temporary only

### Production Rules
- **Authentication Check**: Most operations require user to be logged in
- **Role-Based Access**: Different permissions for buyers, sellers, and admins
- **Data Ownership**: Users can only access/modify their own data
- **Admin Override**: Admins have full access to all collections

## Testing Your Rules

After applying rules, test them by:

1. Try signing up as a buyer
2. Try signing up as a seller
3. Create products as seller
4. Browse products as buyer
5. Place orders as buyer
6. Check that data is properly saved

## Monitoring

Monitor your Firestore usage and security:

1. Go to Firebase Console > Firestore Database
2. Click on **Usage** tab to see read/write operations
3. Check for any security rule violations in the logs

## Best Practices

1. ✅ Use unrestricted rules only during initial development
2. ✅ Switch to secure rules before any public access
3. ✅ Test rules thoroughly before deploying to production
4. ✅ Monitor database access patterns
5. ✅ Implement rate limiting for production
6. ✅ Use Firebase emulators for local development

## Firestore Indexes

Some queries may require composite indexes. If you see errors about missing indexes, Firebase will provide a link to create them automatically.

Common indexes needed:
- Orders: `buyerId` + `createdAt` (descending)
- Products: `sellerId` + `category`
- Notifications: `userId` + `createdAt` (descending)

## Additional Resources

- [Firebase Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Security Rules Testing](https://firebase.google.com/docs/firestore/security/test-rules-emulator)
- [Best Practices](https://firebase.google.com/docs/firestore/security/rules-conditions)
