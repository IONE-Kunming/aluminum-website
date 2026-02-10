# Firebase Integration Verification Guide

This guide helps you verify that your Firebase services are properly configured and working for chat, invoices, and orders functionality.

## Quick Status Check

✅ **Current Status of Your Application:**

### 1. Firebase Configuration Files
- ✅ `firebase.json` - Firebase project configuration is present
- ✅ `firestore.rules` - Firestore security rules are defined
- ✅ `firestore.indexes.json` - Required indexes are defined
- ✅ `storage.rules` - Storage security rules are defined
- ✅ `public/js/config.js` - Firebase SDK configuration is present

### 2. Application Features Status

| Feature | Implementation Status | Firebase Services Used |
|---------|----------------------|------------------------|
| **Chat** | ✅ Fully Implemented | Firestore (messages, chats), Storage (attachments), Authentication |
| **Orders** | ✅ Fully Implemented | Firestore (orders), Authentication |
| **Invoices** | ✅ Fully Implemented | Firestore (invoices, _counters), Authentication |

## Required Deployment Steps

To ensure everything works correctly, you need to deploy your Firebase configurations.

### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase

```bash
firebase login
```

This will open your browser to authenticate with your Google account.

### Step 3: Verify Project Connection

```bash
firebase projects:list
```

Make sure your project `gen-lang-client-0988357303` is listed.

### Step 4: Deploy All Firebase Configurations

```bash
# Deploy everything at once (recommended for first-time setup)
firebase deploy

# OR deploy individually:
firebase deploy --only firestore:rules    # Deploy security rules
firebase deploy --only firestore:indexes  # Deploy database indexes
firebase deploy --only storage            # Deploy storage rules
firebase deploy --only hosting            # Deploy the website
```

### Step 5: Wait for Index Building

After deploying indexes, Firebase needs time to build them. You can check the status:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `gen-lang-client-0988357303`
3. Navigate to **Firestore Database → Indexes**
4. Wait until all indexes show **"Enabled"** status (may take 5-15 minutes)

## Verification Checklist

After deployment, verify each feature:

### ✅ Authentication (Already Working)

**Required Service:** Firebase Authentication

**How to Verify:**
1. Go to your website
2. Try to log in with your buyer or seller account
3. Check that you're redirected to the appropriate dashboard

**Expected Result:** Users can log in and access their dashboard.

---

### ✅ Chat Functionality

**Required Services:**
- Firestore Database (collections: `messages`, `chats`, `notifications`)
- Firebase Storage (path: `/chats/{chatId}/`)
- Authentication

**Firestore Indexes Required:**
```json
{
  "collectionGroup": "messages",
  "fields": [
    { "fieldPath": "chatId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "ASCENDING" }
  ]
},
{
  "collectionGroup": "chats",
  "fields": [
    { "fieldPath": "participants", "arrayConfig": "CONTAINS" },
    { "fieldPath": "lastMessageTime", "order": "DESCENDING" }
  ]
}
```

**How to Verify:**

1. **As a Buyer:**
   - Log in as a buyer
   - Navigate to **Chats** (menu or `/buyer/chats`)
   - Click on a seller to start a conversation
   - Send a text message
   - Try uploading an image, PDF, or video (max 10MB)

2. **As a Seller:**
   - Log in as a seller
   - Navigate to **Chats** (menu or `/seller/chats`)
   - You should see the message from the buyer
   - Reply to the message
   - Verify the buyer receives it in real-time

**Expected Results:**
- ✅ Messages appear instantly (real-time)
- ✅ File attachments upload successfully
- ✅ Download buttons appear for attachments
- ✅ Unread message indicators work
- ✅ Chat list shows most recent message
- ✅ Translation button appears if messages are in different languages

**Storage Rules Check:**
- Files are uploaded to `/chats/{chatId}/` in Firebase Storage
- Only chat participants can read/write to their chat folder
- File size limit: 10MB
- Allowed types: images, videos, PDFs

---

### ✅ Orders Functionality

**Required Services:**
- Firestore Database (collection: `orders`)
- Authentication

**Firestore Indexes Required:**
```json
{
  "collectionGroup": "orders",
  "fields": [
    { "fieldPath": "buyerId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "orders",
  "fields": [
    { "fieldPath": "sellerId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

**How to Verify:**

1. **Create an Order (as Buyer):**
   - Log in as a buyer
   - Navigate to **Catalog**
   - Add products to cart from different sellers
   - Go to **Cart** and click **Checkout**
   - Select deposit percentage (5%, 30%, or 65%)
   - Select payment method
   - Click **Confirm Order**
   - Wait for success message

2. **View Orders (as Buyer):**
   - Navigate to **My Orders** (`/buyer/orders`)
   - You should see your recent order(s)
   - Each order shows: Order ID, date, seller, items, total, status

3. **View Orders (as Seller):**
   - Log in as a seller
   - Navigate to **Orders** (`/seller/orders`)
   - You should see orders from buyers for your products
   - You can view order details and update status

**Expected Results:**
- ✅ Multiple orders created (one per seller) from a single checkout
- ✅ Orders appear on buyer's orders page
- ✅ Orders appear on seller's orders page
- ✅ Order details are complete and accurate
- ✅ Status can be updated (for sellers)

**Order Data Structure:**
Each order includes:
- Buyer information (ID, name, email, company)
- Seller information (ID, name)
- Items with quantities, prices, dimensions
- Totals (subtotal, tax, total)
- Deposit information (percentage, amount, remaining balance)
- Payment method
- Status (pending → processing → shipped → delivered)
- Timestamps (created, updated)

---

### ✅ Invoices Functionality

**Required Services:**
- Firestore Database (collections: `invoices`, `_counters`)
- Authentication

**Firestore Indexes Required:**
```json
{
  "collectionGroup": "invoices",
  "fields": [
    { "fieldPath": "buyerId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "invoices",
  "fields": [
    { "fieldPath": "sellerId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

**How to Verify:**

1. **Automatic Invoice Creation:**
   - Place an order (as described above)
   - Invoices are automatically created after checkout
   - One invoice per order (one per seller)

2. **View Invoices (as Buyer):**
   - Navigate to **Invoices** (`/buyer/invoices`)
   - You should see invoices for your orders
   - Click on an invoice to view details
   - Invoice number format: `INV-YYYY-XXXXX`

3. **View Invoices (as Seller):**
   - Log in as a seller
   - Navigate to **Invoices** (`/seller/invoices`)
   - You should see invoices for orders of your products
   - You can mark invoices as "Paid"
   - Paid invoices show payment date

**Expected Results:**
- ✅ Invoices created automatically after order placement
- ✅ Unique invoice numbers generated (INV-2024-00001, etc.)
- ✅ Invoice numbers are sequential and never duplicate
- ✅ Buyers can view their invoices
- ✅ Sellers can view and manage their invoices
- ✅ Sellers can mark invoices as paid
- ✅ Invoice includes all order details, company info, payment terms

**Invoice Counter Mechanism:**
- Uses Firestore transactions for atomic counter increment
- Counter stored in `_counters/invoices` document
- Format: `INV-{YEAR}-{NUMBER}` (e.g., INV-2024-00001)
- Counter resets each year automatically
- Thread-safe: prevents duplicate invoice numbers

---

## Firestore Security Rules Verification

### Check Rules in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `gen-lang-client-0988357303`
3. Navigate to **Firestore Database → Rules**
4. Verify these collections have proper rules:

#### Orders Collection Rules
```
✅ Buyers can read their own orders (where buyerId == auth.uid)
✅ Sellers can read orders for their products (where sellerId == auth.uid)
✅ Buyers can create orders (where buyerId == auth.uid)
✅ Sellers can update order status
❌ Nobody can delete orders (audit trail)
```

#### Messages Collection Rules
```
✅ Users can read messages they sent or received
✅ Users can send messages (create with senderId == auth.uid)
✅ Users can update messages (mark as read)
❌ Users cannot delete others' messages
```

#### Chats Collection Rules
```
✅ Participants can read their chats
✅ Participants can create/update chats
✅ Non-participants cannot access chats
```

#### Invoices Collection Rules
```
✅ Buyers can read their own invoices
✅ Sellers can read their own invoices
✅ Buyers can create invoices during checkout
✅ Sellers can create and update invoices
✅ Sellers can mark invoices as paid
❌ Nobody can delete invoices (audit trail)
```

#### _counters Collection Rules
```
✅ Authenticated users can access the invoices counter
✅ Used only during invoice creation
✅ Prevents unauthorized access to counters
```

### Test Security Rules

Use the **Rules Playground** in Firebase Console:

1. Set authenticated user UID: `test-user-123`
2. Try these operations:

**Test 1: Read own order**
```
Operation: get
Path: /orders/order-abc
Data: { buyerId: "test-user-123", sellerId: "seller-456", total: 100 }
Expected: ✅ Allow
```

**Test 2: Read other's order**
```
Operation: get
Path: /orders/order-xyz
Data: { buyerId: "other-user", sellerId: "seller-789", total: 200 }
Expected: ❌ Deny
```

**Test 3: Create message**
```
Operation: create
Path: /messages/msg-123
Data: { senderId: "test-user-123", receiverId: "user-456", message: "Hello" }
Expected: ✅ Allow
```

---

## Firebase Storage Verification

### Check Storage Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `gen-lang-client-0988357303`
3. Navigate to **Storage → Rules**

### Storage Paths Used by Application

#### Chat Attachments
```
Path: /chats/{chatId}/{fileName}
Rules:
  ✅ Participants can read/write (chatId must contain their UID)
  ✅ File types: images/*, video/*, application/pdf
  ✅ Size limit: 10MB
  ❌ Non-participants cannot access
```

#### Product Images
```
Path: /products/{sellerId}/{fileName}
Rules:
  ✅ Anyone can read (public catalog)
  ✅ Only seller can write to their own folder
  ✅ File types: image/*
  ✅ Size limit: 5MB
```

#### Profile Pictures
```
Path: /profiles/{userId}/{fileName}
Rules:
  ✅ Anyone can read (public profiles)
  ✅ Only user can write to their own folder
  ✅ File types: image/*
  ✅ Size limit: 2MB
```

### Verify Storage in Action

1. **Upload Chat Attachment:**
   - Send a message with an image
   - Check Firebase Console → Storage
   - File should be at: `/chats/{buyerId}_{sellerId}/{timestamp}-{filename}`
   - Verify file size < 10MB
   - Verify file type is allowed

2. **Check Access Control:**
   - Logged-in chat participant can download file
   - Non-participant cannot access the file URL (403 error)

---

## Common Issues and Solutions

### Issue 1: "The query requires an index"

**Symptom:**
- Error in browser console
- Orders or messages don't load
- Error mentions missing Firestore index

**Solution:**
```bash
firebase deploy --only firestore:indexes
```

Wait for indexes to build (5-15 minutes). Check status in Firebase Console → Firestore Database → Indexes.

**Temporary Workaround:**
The application has fallback logic that sorts data in memory. It will work but slower.

---

### Issue 2: "Permission denied" errors

**Symptom:**
- Cannot read/write to Firestore
- Error: "Missing or insufficient permissions"

**Solution:**
```bash
firebase deploy --only firestore:rules
```

Verify rules in Firebase Console → Firestore Database → Rules.

**Check:**
- User is authenticated (check browser console)
- User has the correct role (buyer/seller)
- User ID matches the document's buyer/seller ID

---

### Issue 3: Chat files won't upload

**Symptom:**
- File upload fails
- Error in console about Storage rules

**Solution:**
```bash
firebase deploy --only storage
```

**Check:**
- File size is under 10MB
- File type is image, video, or PDF
- User is authenticated
- User is a participant in the chat

---

### Issue 4: Invoices not created

**Symptom:**
- Order placed successfully
- No invoice appears in invoices page

**Solution:**

1. Check browser console for errors
2. Verify Firestore rules allow invoice creation:
   ```bash
   firebase deploy --only firestore:rules
   ```
3. Check that `_counters/invoices` document exists:
   - Go to Firebase Console → Firestore Database
   - Look for `_counters` collection
   - If missing, create manually:
     ```json
     {
       "lastNumber": 0,
       "year": 2024
     }
     ```

4. Verify checkout.js creates invoices (line 352-377)

---

### Issue 5: Orders not appearing

**Symptom:**
- Order created successfully
- Order doesn't show on orders page

**Solution:**

1. Check browser console for errors
2. Verify indexes are deployed and built:
   ```bash
   firebase deploy --only firestore:indexes
   ```
3. Go to Firebase Console → Firestore Database → orders collection
4. Verify order documents have correct `buyerId` or `sellerId`
5. Verify user is logged in with correct account

**Debug:**
- Open browser console
- Look for "Error fetching orders" messages
- Check network tab for failed Firestore requests

---

### Issue 6: Real-time chat not working

**Symptom:**
- Messages don't appear instantly
- Page refresh needed to see new messages

**Solution:**

1. Check browser console for WebSocket errors
2. Verify Firestore real-time listeners are not blocked:
   - Check firewall settings
   - Check browser extensions (ad blockers)
   - Try different network

3. Verify messages collection has proper index:
   ```bash
   firebase deploy --only firestore:indexes
   ```

4. Test with browser console open:
   - Look for "Messages snapshot received" log
   - Look for "Calling callback with messages" log

---

## Performance Monitoring

### Check Firestore Usage

```bash
# View current usage
firebase firestore:usage

# View quota limits
firebase projects:list
```

### Monitor Costs

1. Go to Firebase Console → Usage and billing
2. Check:
   - Document reads/writes
   - Storage usage
   - Bandwidth (egress)
   - Storage operations

### Optimize Costs

**Tips:**
- ✅ Firestore indexes are deployed (reduces document reads)
- ✅ Security rules prevent unauthorized access
- ✅ Application uses caching for products
- ✅ Chat uses real-time listeners (more efficient than polling)
- ✅ Batch writes used for orders (atomic + efficient)

---

## Testing Checklist

Use this checklist to verify everything works:

### As a Buyer:

- [ ] Log in to buyer account
- [ ] Browse products in catalog
- [ ] Add products from different sellers to cart
- [ ] Proceed to checkout
- [ ] Select deposit percentage
- [ ] Select payment method
- [ ] Complete order
- [ ] Verify order appears in "My Orders"
- [ ] Verify invoice appears in "Invoices"
- [ ] Open chat with a seller
- [ ] Send text message
- [ ] Upload an image
- [ ] Verify seller receives messages in real-time

### As a Seller:

- [ ] Log in to seller account
- [ ] View orders for my products
- [ ] Update order status
- [ ] View invoices for my orders
- [ ] Mark an invoice as paid
- [ ] Open chat with a buyer
- [ ] Send text message
- [ ] Upload a PDF document
- [ ] Verify buyer receives messages in real-time

---

## Next Steps

If all verification steps pass:

1. ✅ Your Firebase services are properly configured
2. ✅ Chat, orders, and invoices are working correctly
3. ✅ Security rules are protecting your data
4. ✅ Application is ready for production use

**Recommended Actions:**

1. **Set up monitoring:**
   - Enable Firebase Analytics
   - Set up error reporting (e.g., Sentry)
   - Monitor Firestore usage and costs

2. **Backup strategy:**
   - Export Firestore data regularly
   - Set up automated backups

3. **Performance:**
   - Monitor page load times
   - Optimize images for web
   - Use CDN for static assets

4. **Security:**
   - Review Firestore rules periodically
   - Implement rate limiting for sensitive operations
   - Add reCAPTCHA for form submissions

---

## Support Resources

- **Firebase Console:** https://console.firebase.google.com/
- **Firebase Documentation:** https://firebase.google.com/docs
- **Firestore Pricing:** https://firebase.google.com/pricing
- **Firebase Status:** https://status.firebase.google.com/

For application-specific issues:
- Check browser console for errors
- Review application logs
- Check Firestore security rules
- Verify indexes are built
