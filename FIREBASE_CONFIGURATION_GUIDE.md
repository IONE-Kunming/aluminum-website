# Firebase Configuration Guide

This document outlines all Firebase configuration changes needed to fix orders display, chat messages, and implement invoice functionality.

## Overview

This guide covers:
1. **Firestore Indexes** - Required for orders and chat queries
2. **Firestore Security Rules** - Required for orders, messages, chats, and invoices collections
3. **Firestore Collections Structure** - Data models for all collections
4. **Deployment Steps** - How to deploy these changes

---

## 1. Firestore Indexes

The application requires composite indexes for efficient querying. These are already defined in `firestore.indexes.json` but need to be deployed.

### Current Index Definitions

```json
{
  "indexes": [
    {
      "collectionGroup": "orders",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "buyerId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "orders",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "sellerId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "orders",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "messages",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "chatId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

### How to Deploy Indexes

**Option 1: Firebase CLI (Recommended)**
```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy indexes only
firebase deploy --only firestore:indexes
```

**Option 2: Firebase Console**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to Firestore Database → Indexes
4. Create each index manually using the field combinations above

**Note:** The application code has been updated with fallback logic to work without indexes, but performance will be significantly better with indexes deployed. Without indexes, queries will fetch all documents and sort in memory.

---

## 2. Firestore Security Rules

### Required Collections

The application requires these Firestore collections with proper security rules:

1. **orders** - Store customer orders
2. **messages** - Store chat messages between buyers and sellers
3. **chats** - Store chat conversation metadata
4. **invoices** - Store invoice records (NEW)
5. **users** - Store user profiles
6. **products** - Store product listings
7. **notifications** - Store user notifications

### Security Rules for Orders, Messages, and Invoices

Add these rules to your `firestore.rules` file:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId);
    }
    
    // Products collection
    match /products/{productId} {
      allow read: if true; // Public read access
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() && 
        resource.data.sellerId == request.auth.uid;
    }
    
    // Orders collection
    match /orders/{orderId} {
      allow read: if isAuthenticated() && (
        resource.data.buyerId == request.auth.uid ||
        resource.data.sellerId == request.auth.uid
      );
      allow create: if isAuthenticated() && 
        request.resource.data.buyerId == request.auth.uid;
      allow update: if isAuthenticated() && (
        resource.data.buyerId == request.auth.uid ||
        resource.data.sellerId == request.auth.uid
      );
      allow delete: if false; // Never allow deletion
    }
    
    // Messages collection
    match /messages/{messageId} {
      allow read: if isAuthenticated() && (
        resource.data.senderId == request.auth.uid ||
        resource.data.receiverId == request.auth.uid
      );
      allow create: if isAuthenticated() && 
        request.resource.data.senderId == request.auth.uid;
      allow update: if isAuthenticated() && (
        resource.data.senderId == request.auth.uid ||
        resource.data.receiverId == request.auth.uid
      );
      allow delete: if isAuthenticated() && 
        resource.data.senderId == request.auth.uid;
    }
    
    // Chats collection
    match /chats/{chatId} {
      allow read: if isAuthenticated() && 
        request.auth.uid in resource.data.participants;
      allow create, update: if isAuthenticated() && 
        request.auth.uid in request.resource.data.participants;
      allow delete: if false;
    }
    
    // Invoices collection (NEW)
    match /invoices/{invoiceId} {
      allow read: if isAuthenticated() && (
        resource.data.buyerId == request.auth.uid ||
        resource.data.sellerId == request.auth.uid
      );
      allow create: if isAuthenticated() && (
        request.resource.data.buyerId == request.auth.uid ||
        request.resource.data.sellerId == request.auth.uid
      );
      allow update: if isAuthenticated() && 
        resource.data.sellerId == request.auth.uid;
      allow delete: if false; // Never allow deletion
    }
    
    // Notifications collection
    match /notifications/{notificationId} {
      allow read: if isAuthenticated() && 
        resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

### How to Deploy Security Rules

**Firebase CLI:**
```bash
firebase deploy --only firestore:rules
```

**Firebase Console:**
1. Go to Firestore Database → Rules
2. Copy and paste the rules above
3. Click "Publish"

---

## 3. Firestore Data Structure

### Orders Collection

```javascript
{
  "id": "auto-generated",
  "buyerId": "user_uid",
  "buyerName": "John Doe",
  "buyerEmail": "john@example.com",
  "buyerCompany": "Acme Corp",
  "sellerId": "seller_uid",
  "items": [
    {
      "productId": "prod_123",
      "productName": "Aluminum Sheet",
      "seller": "Seller Name",
      "quantity": 100,
      "unit": "m²",
      "pricePerUnit": 25.50,
      "subtotal": 2550.00,
      "dimensions": {
        "length": 2.5,
        "width": 1.5
      }
    }
  ],
  "subtotal": 2550.00,
  "tax": 255.00,
  "total": 2805.00,
  "depositPercentage": 30,
  "depositAmount": 841.50,
  "remainingBalance": 1963.50,
  "paymentMethod": "bank_transfer",
  "status": "pending", // pending, processing, shipped, delivered, cancelled
  "createdAt": "Firestore.Timestamp",
  "updatedAt": "Firestore.Timestamp"
}
```

### Messages Collection

```javascript
{
  "id": "auto-generated",
  "chatId": "buyerId_sellerId", // Consistent ordering: sorted
  "senderId": "user_uid",
  "receiverId": "other_user_uid",
  "message": "Hello, I have a question about the product",
  "attachments": [
    {
      "name": "image.jpg",
      "url": "https://storage.googleapis.com/...",
      "type": "image/jpeg"
    }
  ],
  "read": false,
  "createdAt": "Firestore.Timestamp"
}
```

### Chats Collection

```javascript
{
  "id": "buyerId_sellerId", // Document ID
  "participants": ["buyerId", "sellerId"],
  "buyerId": "buyer_uid",
  "sellerId": "seller_uid",
  "lastMessage": "Hello, I have a question...",
  "lastMessageTime": "Firestore.Timestamp",
  "lastSenderId": "user_uid"
}
```

### Invoices Collection (NEW)

```javascript
{
  "id": "auto-generated",
  "invoiceNumber": "INV-2024-00001", // Auto-generated unique number
  "orderId": "order_id",
  "buyerId": "buyer_uid",
  "buyerName": "John Doe",
  "buyerEmail": "john@example.com",
  "buyerCompany": "Acme Corp",
  "buyerAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "USA"
  },
  "sellerId": "seller_uid",
  "sellerName": "ABC Aluminum",
  "sellerEmail": "seller@example.com",
  "sellerCompany": "ABC Corp",
  "sellerAddress": {
    "street": "456 Industrial Ave",
    "city": "Los Angeles",
    "state": "CA",
    "zip": "90001",
    "country": "USA"
  },
  "items": [
    {
      "productId": "prod_123",
      "productName": "Aluminum Sheet",
      "description": "High-quality aluminum sheet 6061-T6",
      "quantity": 100,
      "unit": "m²",
      "pricePerUnit": 25.50,
      "subtotal": 2550.00
    }
  ],
  "subtotal": 2550.00,
  "tax": 255.00,
  "taxRate": 10, // percentage
  "total": 2805.00,
  "depositPaid": 841.50,
  "remainingBalance": 1963.50,
  "paymentMethod": "bank_transfer",
  "paymentTerms": "30% deposit, 70% on delivery",
  "dueDate": "Firestore.Timestamp",
  "status": "issued", // issued, paid, overdue, cancelled
  "notes": "Thank you for your business",
  "createdAt": "Firestore.Timestamp",
  "updatedAt": "Firestore.Timestamp",
  "paidAt": "Firestore.Timestamp" // null if not paid
}
```

---

## 4. Code Changes Summary

### Fixed Issues

1. **Orders Not Displaying**
   - **Problem:** Query object was modified with `.orderBy()` and reused in fallback, causing the fallback to fail
   - **Fix:** Use separate variable for ordered query to avoid mutation
   - **File:** `public/js/dataService.js` (getOrders method)

2. **Chat Messages Not Appearing**
   - **Problem:** Complex try-catch logic for index handling didn't work with `onSnapshot` callbacks
   - **Fix:** Simplified to always query without orderBy and sort in memory
   - **File:** `public/js/dataService.js` (subscribeToChatMessages method)

### New Features Needed

3. **Invoice Generation**
   - Need to implement invoice creation when order is submitted
   - Need to implement invoice retrieval and display
   - Need to add invoice download/print functionality

---

## 5. Deployment Checklist

### Before Deployment

- [ ] Review and understand all Firestore security rules
- [ ] Ensure Firebase project is created
- [ ] Ensure Firebase CLI is installed: `npm install -g firebase-tools`
- [ ] Login to Firebase: `firebase login`
- [ ] Initialize Firebase in project (if not already): `firebase init`

### Deploy Firestore Configuration

```bash
# Deploy both indexes and rules
firebase deploy --only firestore

# Or deploy separately
firebase deploy --only firestore:indexes
firebase deploy --only firestore:rules
```

### Verify Deployment

1. **Check Indexes**
   - Go to Firebase Console → Firestore Database → Indexes
   - Verify all indexes show "Enabled" status
   - Wait for indexes to finish building (may take a few minutes)

2. **Test Security Rules**
   - Go to Firebase Console → Firestore Database → Rules
   - Use the "Rules Playground" to test read/write permissions
   - Test scenarios:
     - Buyer can read their own orders
     - Seller can read orders where they are the seller
     - User cannot read other users' orders
     - Buyer can create messages
     - User can read messages they sent or received

3. **Test Application**
   - Create a test order
   - Verify order appears in buyer's orders page
   - Verify order appears in seller's orders page
   - Send a chat message
   - Verify message appears in chat window

---

## 6. Performance Considerations

### With Indexes Deployed
- Queries are fast and efficient
- Firestore uses indexes for filtering and sorting
- Cost: ~$0.06 per 100,000 index entries

### Without Indexes (Current Fallback)
- Queries fetch all matching documents
- Sorting happens in client memory
- Slower for large datasets
- Higher bandwidth usage
- More read operations = higher costs

**Recommendation:** Deploy indexes for production use. The fallback is only for development/testing.

---

## 7. Monitoring and Troubleshooting

### Check Firestore Usage
```bash
# View Firestore usage
firebase firestore:usage
```

### Common Issues

**Issue:** "The query requires an index"
- **Solution:** Deploy Firestore indexes using `firebase deploy --only firestore:indexes`
- **Temporary:** The code will fallback to in-memory sorting

**Issue:** "Permission denied" errors
- **Solution:** Check and deploy Firestore security rules
- **Debug:** Use Firebase Console Rules Playground to test permissions

**Issue:** Orders not appearing
- **Check:** Browser console for errors
- **Check:** User is authenticated
- **Check:** Orders exist in Firestore with correct buyerId/sellerId
- **Check:** Security rules allow read access

**Issue:** Chat messages not appearing
- **Check:** Browser console for subscription errors
- **Check:** Messages exist in Firestore with correct chatId
- **Check:** Real-time listeners are working (not blocked by browser/firewall)

### Enable Debug Logging

The application has extensive console logging. Check browser console for:
- "Messages snapshot received" - Indicates subscription is working
- "Calling callback with messages" - Indicates messages are being processed
- "Error fetching orders" - Indicates query error
- "Firestore index not available" - Indicates fallback to in-memory sorting

---

## 8. Next Steps for Invoice Implementation

To complete the invoice functionality:

1. **Create Invoice Generation Function**
   - Add `createInvoice()` method to dataService.js
   - Auto-generate invoice numbers
   - Populate invoice data from order

2. **Trigger Invoice Creation**
   - Modify checkout.js to create invoice after order submission
   - Or create invoices when order status changes to "delivered"

3. **Implement Invoice Display**
   - Update invoices.js to fetch and display buyer's invoices
   - Update seller-invoices.js to fetch and display seller's invoices
   - Add invoice detail view

4. **Add Invoice Actions**
   - Download as PDF
   - Print invoice
   - Email invoice
   - Mark as paid (seller only)

See the separate document `INVOICE_IMPLEMENTATION_GUIDE.md` for detailed implementation steps.

---

## Support

For questions or issues:
1. Check Firebase Console for errors
2. Review browser console logs
3. Verify all deployment steps were completed
4. Check Firestore security rules are deployed correctly
5. Verify indexes are built and enabled

---

## References

- [Firestore Indexes Documentation](https://firebase.google.com/docs/firestore/query-data/indexing)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
- [Firestore Data Modeling](https://firebase.google.com/docs/firestore/data-model)
