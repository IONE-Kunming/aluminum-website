# Chat Database Cleanup Guide

## Issues Identified

### 1. ✅ FIXED: Firestore Security Rules
**Problem**: Users couldn't read other users' profiles, causing "Unknown User" to display in chats.

**Solution**: Added `allow get: if isAuthenticated();` to the users collection rules in `firestore.rules`.

**Status**: ✅ Committed and ready for deployment

---

### 2. ⚠️ REQUIRES MANUAL CLEANUP: Inconsistent chatId in Messages

**Problem**: Some messages in the database have incorrect `chatId` values that don't match the chat document they belong to.

**Example from your data**:
- **Chat Document** participants: `["wQY9kz0SzvRpZTBvfMu54PInuGS2", "EuezXczTNkhOUEW9YMyJg1tVT8Y2"]`
  - Correct chatId should be: `"EuezXczTNkhOUEW9YMyJg1tVT8Y2_wQY9kz0SzvRpZTBvfMu54PInuGS2"` (sorted alphabetically)
  
- **Message Document** has: `chatId: "dfhuqIQeY2QlkOWMFpUt7xn3bgL2_wQY9kz0SzvRpZTBvfMu54PInuGS2"`
  - The user ID `dfhuqIQeY2QlkOWMFpUt7xn3bgL2` is NOT in the chat's participants array!

**Impact**: Messages with incorrect chatIds won't be displayed in the chat window because:
1. The query in `subscribeToChatMessages()` searches for `chatId == correctChatId`
2. Messages with wrong chatIds are never returned
3. This causes "No messages yet" to appear even though messages exist in Firebase

---

## How to Fix the Database

### Option 1: Fix via Firebase Console (Recommended for Small Number of Messages)

1. Go to Firebase Console → Firestore Database
2. Navigate to the `messages` collection
3. For each message with an incorrect chatId:
   - Click on the message document
   - Edit the `chatId` field
   - Change it to the correct value (both user IDs sorted alphabetically with `_` separator)
   - Example: If participants are `["userA", "userB"]`, chatId should be `"userA_userB"` (sorted)

### Option 2: Fix via Script (Recommended for Many Messages)

Create a Cloud Function or run this script locally with Firebase Admin SDK:

```javascript
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

async function fixChatIds() {
  // Get all chats
  const chatsSnapshot = await db.collection('chats').get();
  
  for (const chatDoc of chatsSnapshot.docs) {
    const chatData = chatDoc.data();
    const correctChatId = chatDoc.id; // The chat document ID is the correct chatId
    const participants = chatData.participants;
    
    console.log(`\nProcessing chat: ${correctChatId}`);
    console.log(`Participants: ${participants.join(', ')}`);
    
    // Find all messages that should belong to this chat
    // Query by senderId first, then filter by receiverId in code
    // (Firestore doesn't support multiple 'in' clauses in one query)
    const messagesQuery = db.collection('messages')
      .where('senderId', 'in', participants);
    
    const messagesSnapshot = await messagesQuery.get();
    
    let fixedCount = 0;
    let batch = db.batch();
    let batchCount = 0;
    const MAX_BATCH_SIZE = 500; // Firestore batch limit
    
    for (const messageDoc of messagesSnapshot.docs) {
      const messageData = messageDoc.data();
      const currentChatId = messageData.chatId;
      
      // Check if both senderId and receiverId are in the participants
      const senderInChat = participants.includes(messageData.senderId);
      const receiverInChat = participants.includes(messageData.receiverId);
      
      if (senderInChat && receiverInChat && currentChatId !== correctChatId) {
        console.log(`  Fixing message ${messageDoc.id}: "${currentChatId}" → "${correctChatId}"`);
        batch.update(messageDoc.ref, { chatId: correctChatId });
        fixedCount++;
        batchCount++;
        
        // Commit batch if it reaches max size
        if (batchCount >= MAX_BATCH_SIZE) {
          await batch.commit();
          console.log(`  ✅ Committed batch of ${batchCount} updates`);
          batchCount = 0;
          batch = db.batch(); // Create new batch instance
        }
      }
    }
    
    // Commit any remaining updates
    if (batchCount > 0) {
      await batch.commit();
      console.log(`  ✅ Fixed ${fixedCount} messages for chat ${correctChatId}`);
    } else if (fixedCount === 0) {
      console.log(`  ℹ️  No messages needed fixing for chat ${correctChatId}`);
    }
  }
  
  console.log('\n✅ All chat IDs fixed!');
}

fixChatIds().catch(console.error);
```

### Option 3: Quick Manual Fix for Your Specific Case

Based on your data:

1. **Chat Document ID**: Should be `"EuezXczTNkhOUEW9YMyJg1tVT8Y2_wQY9kz0SzvRpZTBvfMu54PInuGS2"`
   - Participants: `["wQY9kz0SzvRpZTBvfMu54PInuGS2", "EuezXczTNkhOUEW9YMyJg1tVT8Y2"]`

2. **Find messages** where:
   - `senderId` = `"dfhuqIQeY2QlkOWMFpUt7xn3bgL2"` OR `"EuezXczTNkhOUEW9YMyJg1tVT8Y2"` OR `"wQY9kz0SzvRpZTBvfMu54PInuGS2"`
   - AND `receiverId` = any of those three IDs
   - AND where both IDs are in the participants array of a chat

3. **Update** each message's `chatId` to match the correct chat document ID

---

## Verification Steps

After fixing the chatIds:

1. **Check Chat List**:
   - Log in as a buyer
   - Go to `/buyer/chats`
   - Verify that chat list shows real user names (not "Unknown User")
   - Verify company names are displayed correctly

2. **Check Messages**:
   - Click on a conversation
   - Verify that all messages are displayed
   - Verify that "No messages yet" is NOT shown when messages exist
   - Verify that sender names are displayed correctly in each message

3. **Test New Messages**:
   - Send a new message
   - Verify it appears immediately (optimistic UI)
   - Verify it's saved to Firebase with correct chatId
   - Verify other user can see the message

---

## Prevention

The code has been fixed to always generate consistent chatIds:
- Method: `[userId1, userId2].sort().join('_')`
- This ensures alphabetical ordering regardless of who is buyer/seller
- Both `sendChatMessage()` and `subscribeToChatMessages()` use the same method

Future messages will automatically have the correct chatId. Only old/existing messages need manual cleanup.

---

## Deployment Checklist

- [x] Update `firestore.rules` to allow reading user profiles
- [ ] Deploy updated Firestore rules to Firebase
- [ ] Run database cleanup script (if needed)
- [ ] Test chat functionality end-to-end
- [ ] Verify user names display correctly
- [ ] Verify message history displays correctly

---

## Testing After Deployment

### Test Case 1: Chat List Display
```
✓ User names should display correctly (not "Unknown User")
✓ Company names should display under user names
✓ Role badges (Buyer/Seller) should be visible
✓ Last message preview should be accurate
✓ Timestamps should be formatted correctly
```

### Test Case 2: Chat Messages
```
✓ Click on a chat → messages should load
✓ All historical messages should be displayed
✓ Messages should be in chronological order
✓ Sender names should be correct for each message
✓ "No messages yet" should NOT appear when messages exist
```

### Test Case 3: Send Message
```
✓ Type and send a message → should appear immediately
✓ Message should be saved with correct chatId
✓ Other user should receive the message in real-time
✓ Chat list should update with latest message
```

---

## Support

If you continue to see "Unknown User" or missing messages after deploying the rules:
1. Clear your browser cache
2. Log out and log back in
3. Check browser console for any errors
4. Verify the Firestore rules were deployed successfully
5. Check that messages have correct chatIds in Firebase Console
