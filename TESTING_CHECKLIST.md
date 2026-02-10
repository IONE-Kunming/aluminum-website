# Testing Checklist: Chat, Orders & Invoices Functionality

Use this checklist to verify that all features work correctly after Firebase deployment.

---

## Pre-Testing Setup

- [ ] Firebase configurations deployed (`firebase deploy`)
- [ ] Firestore indexes show "Enabled" status in Firebase Console
- [ ] Application built and deployed (`npm run build`)
- [ ] Two test accounts ready:
  - [ ] Buyer account (role: buyer)
  - [ ] Seller account (role: seller)

---

## Test 1: Authentication ✅

**Purpose:** Verify Firebase Authentication works

### Steps:

1. **Buyer Login:**
   - [ ] Navigate to website
   - [ ] Click "Login"
   - [ ] Enter buyer credentials
   - [ ] Successfully logged in
   - [ ] Redirected to buyer dashboard

2. **Seller Login:**
   - [ ] Logout
   - [ ] Click "Login"
   - [ ] Enter seller credentials
   - [ ] Successfully logged in
   - [ ] Redirected to seller dashboard

### Expected Results:
- ✅ Both accounts can log in
- ✅ Correct dashboard shown based on role
- ✅ User name displayed in header
- ✅ Navigation menu shows role-appropriate options

### Troubleshooting:
- Check Firebase Console → Authentication → Users
- Verify accounts exist with correct roles
- Check browser console for errors

---

## Test 2: Order Creation (Buyer) ✅

**Purpose:** Verify orders are created correctly in Firestore

### Steps:

1. **Login as Buyer:**
   - [ ] Login with buyer account

2. **Browse Products:**
   - [ ] Navigate to "Catalog" or "Products"
   - [ ] Browse available products
   - [ ] Note products from different sellers

3. **Add to Cart:**
   - [ ] Click on a product from Seller A
   - [ ] Add to cart (e.g., 10 units)
   - [ ] Go back to catalog
   - [ ] Click on a product from Seller B
   - [ ] Add to cart (e.g., 5 units)
   - [ ] Cart icon shows item count

4. **View Cart:**
   - [ ] Click cart icon or navigate to `/buyer/cart`
   - [ ] See both products
   - [ ] Subtotal calculated correctly
   - [ ] Can update quantities
   - [ ] Can remove items

5. **Proceed to Checkout:**
   - [ ] Click "Proceed to Checkout"
   - [ ] Redirected to checkout page

6. **Complete Checkout:**
   - [ ] See order summary with all items
   - [ ] See subtotal, tax (10%), and total
   - [ ] Select deposit percentage:
     - [ ] Try selecting 5%
     - [ ] Try selecting 30%
     - [ ] Try selecting 65%
   - [ ] Deposit amount updates correctly
   - [ ] Select payment method:
     - [ ] Try "Bank Transfer"
     - [ ] Try "Credit Card"
     - [ ] Try "Cash"
   - [ ] "Confirm Order" button is enabled
   - [ ] Click "Confirm Order"

7. **Order Processing:**
   - [ ] Button shows loading state
   - [ ] Success message appears: "Order placed successfully"
   - [ ] Redirected to "My Orders" page
   - [ ] Wait 2-3 seconds for redirect

### Expected Results:
- ✅ Cart functionality works (add, remove, update)
- ✅ Checkout page displays correctly
- ✅ Deposit calculation is accurate
- ✅ Order submission succeeds
- ✅ Success message shown
- ✅ Redirected to orders page

### Verify in Firestore:
- [ ] Go to Firebase Console → Firestore Database
- [ ] Check `orders` collection
- [ ] **Two orders created** (one per seller)
- [ ] Each order has:
  - [ ] Correct `buyerId` (your user ID)
  - [ ] Correct `sellerId` (seller's user ID)
  - [ ] Correct `items` array with products
  - [ ] Correct `total`, `subtotal`, `tax`
  - [ ] Correct `depositAmount`, `depositPercentage`
  - [ ] `status` is "pending"
  - [ ] `createdAt` timestamp exists

---

## Test 3: Order Viewing (Buyer) ✅

**Purpose:** Verify buyers can view their orders

### Steps:

1. **View Orders:**
   - [ ] Navigate to "My Orders" (`/buyer/orders`)
   - [ ] See list of orders
   - [ ] Orders sorted by date (newest first)

2. **Check Order Details:**
   - [ ] Each order shows:
     - [ ] Order ID
     - [ ] Date
     - [ ] Seller name
     - [ ] Items list
     - [ ] Total amount
     - [ ] Status badge
     - [ ] Deposit info

3. **Multiple Orders:**
   - [ ] See both orders from previous checkout
   - [ ] Each order has different seller
   - [ ] Each order has correct items

### Expected Results:
- ✅ Orders page loads without errors
- ✅ Both orders visible
- ✅ All order details accurate
- ✅ No permission errors

### Troubleshooting:
- Check browser console for errors
- Verify Firestore index for orders is "Enabled"
- Check security rules allow buyer to read their orders

---

## Test 4: Order Viewing (Seller) ✅

**Purpose:** Verify sellers can view orders for their products

### Steps:

1. **Login as Seller:**
   - [ ] Logout from buyer account
   - [ ] Login with seller account

2. **View Orders:**
   - [ ] Navigate to "Orders" (`/seller/orders`)
   - [ ] See list of orders for seller's products
   - [ ] Orders from test above should appear

3. **Check Order Details:**
   - [ ] Each order shows:
     - [ ] Order ID
     - [ ] Date
     - [ ] Buyer name
     - [ ] Buyer company
     - [ ] Items list (seller's products only)
     - [ ] Total amount
     - [ ] Status with color coding
     - [ ] Update status buttons

4. **Update Order Status:**
   - [ ] Find the test order
   - [ ] Click status dropdown or buttons
   - [ ] Change status to "Processing"
   - [ ] Status updates successfully
   - [ ] Try changing to "Shipped"
   - [ ] Try changing to "Delivered"

### Expected Results:
- ✅ Seller sees orders containing their products
- ✅ Seller does NOT see orders for other sellers
- ✅ Order details are complete
- ✅ Status can be updated
- ✅ Status changes persist after page refresh

### Verify in Firestore:
- [ ] Check `orders` collection
- [ ] Find the updated order
- [ ] `status` field changed
- [ ] `updatedAt` timestamp changed

---

## Test 5: Invoice Generation ✅

**Purpose:** Verify invoices are automatically created after orders

### Steps:

1. **Check as Buyer:**
   - [ ] Login as buyer
   - [ ] Navigate to "Invoices" (`/buyer/invoices`)
   - [ ] See invoices for the orders placed

2. **Check Invoice Details:**
   - [ ] Each invoice shows:
     - [ ] Invoice number (format: INV-2024-00001)
     - [ ] Invoice date
     - [ ] Order ID
     - [ ] Seller name
     - [ ] Seller company
     - [ ] Items list
     - [ ] Subtotal, tax, total
     - [ ] Deposit paid
     - [ ] Remaining balance
     - [ ] Payment terms
     - [ ] Status badge

3. **Invoice Numbers:**
   - [ ] Invoice numbers are unique
   - [ ] Invoice numbers are sequential
   - [ ] Format is correct (INV-YYYY-#####)

### Expected Results:
- ✅ Two invoices created (one per order)
- ✅ Invoice numbers are unique
- ✅ All invoice details are accurate
- ✅ Status is "issued"

### Verify in Firestore:
- [ ] Check `invoices` collection
- [ ] Two invoice documents exist
- [ ] Each has unique `invoiceNumber`
- [ ] Each has correct `buyerId` and `sellerId`
- [ ] Each has correct `orderId` reference
- [ ] Check `_counters/invoices` document:
  - [ ] `lastNumber` incremented
  - [ ] `year` is current year

---

## Test 6: Invoice Management (Seller) ✅

**Purpose:** Verify sellers can manage invoices

### Steps:

1. **Login as Seller:**
   - [ ] Login with seller account

2. **View Invoices:**
   - [ ] Navigate to "Invoices" (`/seller/invoices`)
   - [ ] See invoices for seller's orders
   - [ ] Both test invoices visible

3. **Invoice Details:**
   - [ ] Click on an invoice
   - [ ] See detailed invoice view
   - [ ] Buyer information displayed
   - [ ] Items list with prices
   - [ ] Payment information

4. **Mark as Paid:**
   - [ ] Find "Mark as Paid" button
   - [ ] Click button
   - [ ] Confirmation appears
   - [ ] Status changes to "Paid"
   - [ ] Payment date shown
   - [ ] Button disabled/removed

5. **Refresh Page:**
   - [ ] Refresh the page
   - [ ] Invoice still marked as paid
   - [ ] Payment date persists

### Expected Results:
- ✅ Seller sees their invoices only
- ✅ Can mark invoices as paid
- ✅ Status change persists
- ✅ Payment date recorded

### Verify in Firestore:
- [ ] Check the invoice document
- [ ] `status` changed to "paid"
- [ ] `paidAt` timestamp exists
- [ ] `updatedAt` timestamp changed

---

## Test 7: Chat - Start Conversation ✅

**Purpose:** Verify buyers can initiate chat with sellers

### Steps:

1. **Login as Buyer:**
   - [ ] Login with buyer account

2. **Start Chat:**
   - [ ] Navigate to "Chats" (`/buyer/chats`)
   - [ ] See list of sellers (or empty if no chats)
   - [ ] Click on a seller to start/open chat
   - [ ] Chat window opens

3. **Chat Interface:**
   - [ ] See seller name at top
   - [ ] See seller company name
   - [ ] See "Seller" badge
   - [ ] Empty chat (if new) or existing messages
   - [ ] Text input box at bottom
   - [ ] Send button
   - [ ] File upload button

### Expected Results:
- ✅ Chat page loads without errors
- ✅ Can select/start chat with seller
- ✅ Chat interface displays correctly
- ✅ No permission errors

---

## Test 8: Chat - Send Text Message ✅

**Purpose:** Verify text messaging works with real-time updates

### Steps:

1. **As Buyer (keep logged in):**
   - [ ] In chat with seller
   - [ ] Type a message: "Hello, I have a question about my order"
   - [ ] Click Send or press Enter
   - [ ] Message appears immediately
   - [ ] Message has "sending" indicator
   - [ ] Indicator disappears when sent

2. **As Seller (open in another browser/incognito):**
   - [ ] Login as seller
   - [ ] Navigate to "Chats" (`/seller/chats`)
   - [ ] See buyer in chat list
   - [ ] **Unread badge** appears
   - [ ] Click on buyer
   - [ ] See buyer's message
   - [ ] Message timestamp shown

3. **Reply (as Seller):**
   - [ ] Type reply: "Hi! I'm happy to help. What's your question?"
   - [ ] Send message
   - [ ] Message appears immediately

4. **Receive (as Buyer):**
   - [ ] Check buyer's browser
   - [ ] Seller's reply appears **automatically** (no refresh)
   - [ ] Notification sound/indicator (if implemented)

### Expected Results:
- ✅ Messages send successfully
- ✅ Messages appear in real-time (no page refresh needed)
- ✅ Timestamps are accurate
- ✅ Unread indicators work
- ✅ Message order is correct

### Verify in Firestore:
- [ ] Check `messages` collection
- [ ] Messages exist with correct:
  - [ ] `chatId` (format: buyer_seller with sorted IDs)
  - [ ] `senderId` and `receiverId`
  - [ ] `message` text
  - [ ] `createdAt` timestamp
  - [ ] `read` status
- [ ] Check `chats` collection
- [ ] Chat document exists with:
  - [ ] Both user IDs in `participants` array
  - [ ] `lastMessage` text
  - [ ] `lastMessageTime` timestamp

---

## Test 9: Chat - Upload Files ✅

**Purpose:** Verify file attachments work correctly

### Steps:

1. **Upload Image (as Buyer):**
   - [ ] Click file upload/attach button
   - [ ] Select an image (JPG/PNG, < 10MB)
   - [ ] Image thumbnail appears
   - [ ] Click Send
   - [ ] Image uploads
   - [ ] Progress indicator shown
   - [ ] Message with image appears

2. **View Image (as Seller):**
   - [ ] Switch to seller's browser
   - [ ] See message with image
   - [ ] Image thumbnail displayed
   - [ ] Click image or download button
   - [ ] Image opens/downloads
   - [ ] Image is correct file

3. **Upload PDF (as Seller):**
   - [ ] Click attach button
   - [ ] Select a PDF file (< 10MB)
   - [ ] File name shown
   - [ ] Send message
   - [ ] PDF uploads successfully
   - [ ] Message with PDF appears

4. **Download PDF (as Buyer):**
   - [ ] See message with PDF
   - [ ] File name and size shown
   - [ ] Click download button
   - [ ] PDF downloads
   - [ ] PDF opens correctly

5. **Upload Video (as Buyer):**
   - [ ] Try uploading a video (MP4, < 10MB)
   - [ ] Video uploads
   - [ ] Video playable or downloadable

6. **Test File Size Limit:**
   - [ ] Try uploading file > 10MB
   - [ ] Upload rejected
   - [ ] Error message shown

7. **Test Invalid File Type:**
   - [ ] Try uploading .exe or .zip
   - [ ] Upload rejected
   - [ ] Error message shown

### Expected Results:
- ✅ Images upload and display correctly
- ✅ PDFs upload and download correctly
- ✅ Videos upload and play/download correctly
- ✅ File size limit enforced (10MB)
- ✅ File type validation works
- ✅ Download links work for both participants

### Verify in Firebase Storage:
- [ ] Go to Firebase Console → Storage
- [ ] Check `/chats/{chatId}/` folder
- [ ] Files uploaded with correct names
- [ ] Files accessible (not 403 error)
- [ ] Files NOT accessible to non-participants

### Verify in Firestore:
- [ ] Check message documents
- [ ] `attachments` array exists
- [ ] Each attachment has:
  - [ ] `name` (file name)
  - [ ] `url` (Storage download URL)
  - [ ] `type` (MIME type)
  - [ ] `size` (file size in bytes)

---

## Test 10: Chat - Real-Time Sync ✅

**Purpose:** Verify messages sync in real-time

### Steps:

1. **Rapid Messaging:**
   - [ ] As buyer, send 3 messages quickly
   - [ ] As seller, immediately check chat
   - [ ] All 3 messages appear
   - [ ] Messages in correct order

2. **Concurrent Messaging:**
   - [ ] Buyer and seller both type at same time
   - [ ] Both send messages
   - [ ] Both messages appear
   - [ ] No messages lost
   - [ ] Correct chronological order

3. **Unread Indicators:**
   - [ ] As buyer, send message
   - [ ] As seller, see unread badge on chat list
   - [ ] Open chat
   - [ ] Badge disappears
   - [ ] Message marked as read

4. **Multiple Chats:**
   - [ ] Start chat with different seller
   - [ ] Send messages
   - [ ] Switch between chats
   - [ ] Each chat maintains separate conversation
   - [ ] No message mixing

### Expected Results:
- ✅ Real-time updates work instantly
- ✅ No message loss
- ✅ Correct message ordering
- ✅ Unread tracking works
- ✅ Multiple chats work independently

---

## Test 11: Security Rules Verification ✅

**Purpose:** Verify data is properly protected

### Steps:

1. **Orders Security:**
   - [ ] As buyer, can read own orders
   - [ ] Cannot read other buyers' orders (check Firestore)
   - [ ] As seller, can read orders with their products
   - [ ] Cannot read orders for other sellers

2. **Invoices Security:**
   - [ ] As buyer, can read own invoices
   - [ ] Cannot read other buyers' invoices
   - [ ] As seller, can read invoices for their orders
   - [ ] Cannot read invoices for other sellers
   - [ ] Buyer cannot mark invoices as paid
   - [ ] Seller CAN mark invoices as paid

3. **Chat Security:**
   - [ ] Can read messages in own chats
   - [ ] Cannot read messages in other users' chats
   - [ ] Can send messages only with senderId = own UID
   - [ ] Cannot impersonate other users

4. **Storage Security:**
   - [ ] Can upload files to own chats
   - [ ] Cannot upload to other users' chat folders
   - [ ] Can download files from own chats
   - [ ] Cannot access files from other users' chats

### Test Using Firebase Console:

1. **Firestore Rules Playground:**
   - [ ] Go to Firestore Database → Rules
   - [ ] Click "Rules Playground"
   - [ ] Test scenarios:
     - [ ] Read own order: ✅ Allow
     - [ ] Read other's order: ❌ Deny
     - [ ] Create order with own buyerId: ✅ Allow
     - [ ] Create order with other's buyerId: ❌ Deny

### Expected Results:
- ✅ Users can only access their own data
- ✅ Sellers can only access their own products/orders
- ✅ Buyers can only access their own orders/invoices
- ✅ Chat participants can only access their chats
- ✅ Security rules prevent unauthorized access

---

## Test 12: Performance & Error Handling ✅

**Purpose:** Verify application handles edge cases

### Steps:

1. **Network Issues:**
   - [ ] Open DevTools → Network tab
   - [ ] Throttle to "Slow 3G"
   - [ ] Try sending a message
   - [ ] Loading indicator appears
   - [ ] Message eventually sends
   - [ ] Or timeout error shown

2. **Missing Indexes:**
   - [ ] Check browser console
   - [ ] If indexes not deployed, see fallback message
   - [ ] Data still loads (slower)
   - [ ] No critical errors

3. **Empty States:**
   - [ ] New user with no orders: See empty state message
   - [ ] New user with no invoices: See empty state message
   - [ ] New user with no chats: See instructions or seller list

4. **Large Data:**
   - [ ] Create 20+ orders (if possible)
   - [ ] Orders page loads without freezing
   - [ ] Pagination or scrolling works
   - [ ] Performance is acceptable

### Expected Results:
- ✅ Graceful degradation on slow networks
- ✅ Fallback logic works without indexes
- ✅ Empty states have helpful messages
- ✅ No crashes or freezes

---

## Final Verification

### Firebase Console Checks:

1. **Firestore Database:**
   - [ ] Collections exist: users, products, orders, invoices, messages, chats
   - [ ] Documents have correct structure
   - [ ] Timestamps are accurate
   - [ ] User IDs are correct

2. **Indexes:**
   - [ ] All indexes show "Enabled" status
   - [ ] No indexes in "Building" or "Error" state

3. **Storage:**
   - [ ] Files organized in correct folders
   - [ ] File sizes within limits
   - [ ] No orphaned files

4. **Authentication:**
   - [ ] Test users exist
   - [ ] Roles are correct (custom claims or in Firestore)

### Browser Console Checks:

- [ ] No critical errors
- [ ] No permission denied errors
- [ ] No missing index warnings (or fallback working)
- [ ] No CORS errors
- [ ] No 403 errors

---

## Testing Summary

After completing all tests:

| Feature | Status | Notes |
|---------|--------|-------|
| Authentication | ⬜ Pass / ⬜ Fail | |
| Order Creation | ⬜ Pass / ⬜ Fail | |
| Order Viewing (Buyer) | ⬜ Pass / ⬜ Fail | |
| Order Viewing (Seller) | ⬜ Pass / ⬜ Fail | |
| Invoice Generation | ⬜ Pass / ⬜ Fail | |
| Invoice Management | ⬜ Pass / ⬜ Fail | |
| Chat - Text Messages | ⬜ Pass / ⬜ Fail | |
| Chat - File Uploads | ⬜ Pass / ⬜ Fail | |
| Chat - Real-Time | ⬜ Pass / ⬜ Fail | |
| Security Rules | ⬜ Pass / ⬜ Fail | |
| Performance | ⬜ Pass / ⬜ Fail | |

**Overall Status:** ⬜ All Tests Pass ⬜ Some Tests Fail

**Notes:**
```
(Add any issues found, suggestions, or additional testing needed)
```

---

## If Tests Fail

1. **Check Deployment:**
   ```bash
   firebase deploy --only firestore
   firebase deploy --only storage
   ```

2. **Check Indexes:**
   - Firebase Console → Firestore Database → Indexes
   - Wait for all indexes to show "Enabled"

3. **Check Console Logs:**
   - Browser console for JavaScript errors
   - Firebase Console for security rule violations

4. **Re-run Failed Tests:**
   - After fixes, re-run specific failed tests
   - Update status above

5. **Get Help:**
   - Review FIREBASE_VERIFICATION.md
   - Check Firebase documentation
   - Review security rules in firestore.rules

---

## Next Steps After Successful Testing

✅ **Application is ready for use!**

1. **Monitor:**
   - Check Firebase Console regularly
   - Monitor usage and costs
   - Review error logs

2. **Optimize:**
   - Add more indexes if needed
   - Optimize images for faster loading
   - Consider caching strategies

3. **Enhance:**
   - Add PDF export for invoices
   - Add email notifications
   - Add advanced search/filters

4. **Document:**
   - Create user guides
   - Document admin procedures
   - Record any custom configurations

---

**Testing Completed By:** ___________________

**Date:** ___________________

**Environment:** ⬜ Development ⬜ Staging ⬜ Production

**Firebase Project:** gen-lang-client-0988357303
