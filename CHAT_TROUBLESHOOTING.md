# Chat Troubleshooting Guide

This guide helps you diagnose and fix chat message loading and sending issues.

## Quick Diagnosis

### Step 1: Check Browser Console

1. Open your website
2. Press **F12** to open Developer Tools
3. Go to the **Console** tab
4. Look for log messages starting with `[Buyer Chat]` or `[Seller Chat]`

### Step 2: Try Sending a Message

1. **As Buyer:**
   - Go to `/buyer/chats`
   - Select a seller
   - Type a message
   - Click Send
   
2. **As Seller:**
   - Go to `/seller/chats`
   - Select a buyer
   - Type a message
   - Click Send

### Step 3: Check the Console Logs

You should see logs like this:

**SUCCESSFUL MESSAGE FLOW:**
```
[Buyer Chat] sendMessage called: { message: "Hello", filesCount: 0, sellerId: "abc123" }
[Buyer Chat] Sending message to seller: abc123
[Buyer Chat] Calling dataService.sendChatMessage...
Subscribing to chat messages for chatId: abc123_xyz789
Messages snapshot received: 5 messages
[Buyer Chat] Received messages update: 5 messages
[Buyer Chat] displayMessages called with 5 messages
[Buyer Chat] Current user: xyz789
[Buyer Chat] Rendering 5 messages
[Buyer Chat] Message sent successfully: { success: true, messageId: "msg123" }
```

---

## Common Issues & Solutions

### Issue 1: "Loading messages..." Never Finishes

**Symptoms:**
- Chat window shows "Loading messages..." indefinitely
- No messages appear

**Console Logs to Check:**
```
[Buyer Chat] Loading messages for seller: abc123
[Buyer Chat] Subscribing to chat messages...
```

If you see an error after this, check:

**Possible Cause 1: Firebase Not Initialized**
```
Error: Database not initialized
```

**Solution:**
1. Check that Firebase config is correct in `public/js/config.js`
2. Verify Firebase is loaded: `console.log(window.firebase)` should show an object
3. Deploy to Firebase Hosting or run with `npm run dev`

**Possible Cause 2: User Not Authenticated**
```
Error: User not authenticated
```

**Solution:**
1. Logout and login again
2. Check Firebase Authentication console - verify user exists
3. Clear browser cache and try again

**Possible Cause 3: Firestore Rules Block Access**
```
Error: Missing or insufficient permissions
```

**Solution:**
1. Deploy Firestore rules: `firebase deploy --only firestore:rules`
2. Verify rules in Firebase Console → Firestore Database → Rules
3. Test rules using Rules Playground in Firebase Console

---

### Issue 2: "Failed to send message"

**Symptoms:**
- Message appears as "Sending..." then disappears
- Error toast shown

**Console Logs to Check:**
```
[Buyer Chat] sendMessage called: {...}
Error sending message: [error details]
```

**Possible Causes & Solutions:**

**A. Invalid Seller/Buyer ID**
```
[Buyer Chat] No seller selected
```
**Solution:** The chat wasn't properly selected. Click on a chat from the list first.

**B. Firestore Write Permission Denied**
```
Error: Missing or insufficient permissions
```
**Solution:**
1. Deploy Firestore rules: `firebase deploy --only firestore:rules`
2. Verify in Firestore rules that:
   - Buyers can write messages where `senderId == buyerId`
   - Sellers can write messages where `senderId == sellerId`

**C. File Upload Failed**
```
Error uploading file: image.jpg [error details]
```
**Solution:**
1. Check file size < 10MB
2. Check file type is image, video, or PDF
3. Deploy Storage rules: `firebase deploy --only storage`
4. Verify Storage rules allow participant access

---

### Issue 3: Messages Don't Appear in Real-Time

**Symptoms:**
- Send message successfully
- Message doesn't appear until page refresh
- Other user doesn't receive message in real-time

**Console Logs to Check:**
```
Messages snapshot received: X messages
[Buyer Chat] Received messages update: X messages
```

If you don't see these logs after sending, the real-time listener isn't working.

**Possible Causes & Solutions:**

**A. WebSocket Blocked**
**Solution:**
1. Check firewall/antivirus isn't blocking WebSockets
2. Try different network (mobile hotspot)
3. Disable browser extensions (ad blockers)

**B. Missing Firestore Index**
```
The query requires an index
```
**Solution:**
1. Deploy indexes: `firebase deploy --only firestore:indexes`
2. Wait 5-15 minutes for indexes to build
3. Check Firebase Console → Firestore Database → Indexes
4. All should show "Enabled" status

Note: The code has fallback logic, so this shouldn't completely break functionality.

---

### Issue 4: "Unknown User" or Missing Names

**Symptoms:**
- Chat list shows "Unknown User"
- Names appear as "Buyer" or "Seller" instead of real names

**Console Logs to Check:**
```
Fetched user data for chat: { userId: "abc123", userData: {...} }
No displayName found for user, using role: abc123
```

**Possible Causes & Solutions:**

**A. User Profile Missing displayName**

**Solution - Option 1 (For Existing Users):**
Update user document in Firestore manually:
1. Go to Firebase Console → Firestore Database
2. Find `users` collection
3. Find user document (by UID)
4. Add field: `displayName` = "User's Name"
5. Add field: `companyName` = "Company Name"

**Solution - Option 2 (For New Users):**
Ensure signup process saves displayName:
- This is already fixed in the code
- New signups will save `displayName` and `companyName`

**B. Fallback to Email**

If displayName is missing, the code will:
1. Try `displayName` field
2. Try `name` field (alternative)
3. Extract name from email (part before @)
4. Use "Buyer" or "Seller" as last resort

**To Fix Existing Data:**
Run this in Firebase Console (Firestore → Queries):
```javascript
// Get all users without displayName
db.collection('users')
  .where('displayName', '==', null)
  .get()
  .then(snapshot => {
    snapshot.forEach(doc => {
      const data = doc.data();
      const name = data.email ? data.email.split('@')[0] : 'User';
      doc.ref.update({ displayName: name });
      console.log(`Updated ${doc.id} with displayName: ${name}`);
    });
  });
```

---

### Issue 5: Chat List Empty

**Symptoms:**
- Chat list shows "No conversations yet"
- You know conversations exist

**Console Logs to Check:**
```
Error getting user chats: [error details]
```

**Solution:**
1. Check Firestore rules allow reading `chats` collection
2. Verify `chats` documents have `participants` array
3. Check user UID is in `participants` array

---

## Firestore Database Structure

### Messages Collection

Each message should have:
```javascript
{
  chatId: "buyerId_sellerId",  // Sorted alphabetically
  senderId: "user-id",
  receiverId: "other-user-id",
  senderName: "User Name",      // Sender's display name
  message: "Message text",
  originalLanguage: "en",
  attachments: [
    {
      name: "file.jpg",
      url: "https://storage.googleapis.com/...",
      type: "image/jpeg",
      size: 12345
    }
  ],
  read: false,
  createdAt: Timestamp
}
```

### Chats Collection

Each chat should have:
```javascript
{
  // Document ID: "buyerId_sellerId" (sorted)
  participants: ["buyerId", "sellerId"],
  buyerId: "buyer-uid",
  sellerId: "seller-uid",
  lastMessage: "Last message text",
  lastMessageTime: Timestamp,
  lastSenderId: "user-id"
}
```

### Users Collection

Each user should have:
```javascript
{
  // Document ID: user UID
  uid: "user-id",
  displayName: "John Doe",      // REQUIRED for chat
  companyName: "Acme Corp",
  email: "user@example.com",
  role: "buyer" or "seller",
  phoneNumber: "+1234567890",
  createdAt: "ISO date string"
}
```

---

## Manual Testing Checklist

### Test as Buyer

- [ ] **Login** as buyer account
- [ ] **Navigate** to `/buyer/chats`
- [ ] **Open Console** (F12 → Console tab)
- [ ] **Select** a seller from chat list
- [ ] **Check logs**: Should see `[Buyer Chat] Loading messages...`
- [ ] **Type** a message: "Test message 1"
- [ ] **Send** message
- [ ] **Check logs**: Should see `Message sent successfully`
- [ ] **Verify**: Message appears in chat window
- [ ] **Check**: Message shows your name, not "User" or "Unknown"

### Test as Seller

- [ ] **Login** as seller account (different browser/incognito)
- [ ] **Navigate** to `/seller/chats`
- [ ] **Open Console** (F12 → Console tab)
- [ ] **Select** the buyer from chat list
- [ ] **Check logs**: Should see `[Seller Chat] Loading messages...`
- [ ] **Verify**: Buyer's message appears ("Test message 1")
- [ ] **Check**: Buyer's name shows correctly
- [ ] **Type** reply: "Test reply 1"
- [ ] **Send** message
- [ ] **Check logs**: Should see `Message sent successfully`
- [ ] **Verify**: Reply appears in chat window

### Test Real-Time Updates

- [ ] **Keep both** browser windows open (buyer and seller)
- [ ] **As buyer**: Send "Message 2"
- [ ] **As seller**: Message should appear **automatically** (no refresh)
- [ ] **As seller**: Send "Reply 2"
- [ ] **As buyer**: Reply should appear **automatically**

---

## Firestore Security Rules Check

### Required Rules for Chat

```javascript
// Messages collection
match /messages/{messageId} {
  // Users can read messages they sent or received
  allow read: if isAuthenticated() && (
    resource.data.senderId == request.auth.uid ||
    resource.data.receiverId == request.auth.uid
  );
  
  // Users can send messages
  allow create: if isAuthenticated() && 
    request.resource.data.senderId == request.auth.uid;
  
  // Users can update messages (mark as read)
  allow update: if isAuthenticated() && (
    resource.data.senderId == request.auth.uid ||
    resource.data.receiverId == request.auth.uid
  );
}

// Chats collection
match /chats/{chatId} {
  // Participants can read their chats
  allow read: if isAuthenticated() && 
    request.auth.uid in resource.data.participants;
  
  // Participants can create/update chats
  allow create, update: if isAuthenticated() && 
    request.auth.uid in request.resource.data.participants;
}
```

### Deploy Rules

```bash
firebase deploy --only firestore:rules
```

---

## Storage Security Rules Check

### Required Rules for Chat Files

```javascript
match /chats/{chatId}/{allPaths=**} {
  function isParticipant(chatId) {
    let parts = chatId.split('_');
    return parts.size() == 2 && 
           (parts[0] == request.auth.uid || parts[1] == request.auth.uid);
  }
  
  // Participants can read chat files
  allow read: if isAuthenticated() && isParticipant(chatId);
  
  // Participants can upload files
  allow write: if isAuthenticated() &&
                  isParticipant(chatId) &&
                  (request.resource.contentType.matches('image/.*') ||
                   request.resource.contentType.matches('video/.*') ||
                   request.resource.contentType == 'application/pdf') &&
                  request.resource.size < 10 * 1024 * 1024; // 10MB
}
```

### Deploy Storage Rules

```bash
firebase deploy --only storage
```

---

## Performance Tips

### Optimize Message Loading

1. **Limit Initial Load:**
   - Consider loading only last 50 messages
   - Add "Load More" button for history

2. **Debounce Read Status:**
   - Already implemented (1 second delay)
   - Reduces Firestore writes

3. **Optimize Re-renders:**
   - Already using incremental rendering
   - Only new messages are added to DOM

### Monitor Firestore Usage

```bash
# Check usage
firebase firestore:usage

# View in Firebase Console
# → Firestore Database → Usage
```

---

## Still Having Issues?

### Collect Debug Information

1. **Browser Console Logs:**
   - Copy all `[Buyer Chat]` / `[Seller Chat]` logs
   - Include any error messages

2. **Network Tab:**
   - F12 → Network tab
   - Filter by "firestore" or "googleapis"
   - Check for failed requests (red)
   - Look for 403 (permissions) or 404 (not found)

3. **Firestore Console:**
   - Check `messages` collection
   - Verify messages are being created
   - Check timestamps and data

4. **Authentication:**
   - Verify user is logged in
   - Check user UID matches in console logs

### Report Issue

Include:
- Browser console logs
- Network tab screenshot
- Firestore data screenshot
- User role (buyer/seller)
- Steps to reproduce

---

## Quick Fixes

### Clear Everything and Start Fresh

```bash
# 1. Clear browser cache
# Chrome: Settings → Privacy → Clear browsing data

# 2. Logout and login again

# 3. Redeploy Firebase
firebase deploy

# 4. Wait 5-10 minutes for indexes to build

# 5. Test again
```

### Reset a Chat Conversation

In Firebase Console:
1. Go to Firestore Database
2. Find `chats` collection
3. Find chat document (e.g., `buyer_seller`)
4. Delete the document
5. Find `messages` collection  
6. Delete messages for that `chatId`
7. Start new conversation

---

## Success Indicators

✅ **Chat is Working Correctly When:**

1. **Names Display:**
   - See real names, not "Unknown User"
   - Company names show as subtitle
   
2. **Message Loading:**
   - Opens chat → messages load within 2 seconds
   - No "Loading..." stuck state
   
3. **Message Sending:**
   - Type message → Send
   - Appears immediately (optimistic UI)
   - "Sending..." changes to timestamp
   
4. **Real-Time Updates:**
   - Other user sends message
   - Appears automatically (no refresh)
   - Within 1-2 seconds
   
5. **Console Logs:**
   - No red error messages
   - See "Message sent successfully"
   - See "Received messages update"

---

## Deployment Checklist

Before testing, ensure:

- [ ] Code deployed: `npm run build` + `firebase deploy --only hosting`
- [ ] Rules deployed: `firebase deploy --only firestore:rules`
- [ ] Storage deployed: `firebase deploy --only storage`
- [ ] Indexes deployed: `firebase deploy --only firestore:indexes`
- [ ] Indexes status: "Enabled" (not "Building")
- [ ] Browser cache cleared
- [ ] User logged out and back in

---

## Contact Support

If issues persist after trying all solutions:

1. Export Firestore data (Console → Export)
2. Check Firebase Status: https://status.firebase.google.com/
3. Review Firebase documentation: https://firebase.google.com/docs/firestore
4. Check application logs in Firebase Console

---

**Last Updated:** 2024
**Version:** 2.0
