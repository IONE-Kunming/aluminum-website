#!/usr/bin/env node

/**
 * Fix Chat IDs Script
 * 
 * This script fixes inconsistent chatId values in the messages collection.
 * It ensures all messages have the correct chatId based on their chat's participants.
 * 
 * Run with: node scripts/fix-chat-ids.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
let serviceAccount;
try {
  // Try to load service account from environment or file
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
    if (fs.existsSync(serviceAccountPath)) {
      serviceAccount = require(serviceAccountPath);
    } else {
      console.error('❌ Service account key not found.');
      console.error('Please provide serviceAccountKey.json or set FIREBASE_SERVICE_ACCOUNT environment variable.');
      process.exit(1);
    }
  }
} catch (error) {
  console.error('❌ Error loading service account:', error.message);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/**
 * Generate consistent chatId from two user IDs
 */
function generateChatId(userId1, userId2) {
  return [userId1, userId2].sort().join('_');
}

/**
 * Main function to fix chat IDs
 */
async function fixChatIds() {
  console.log('🔧 Starting Chat ID Fix Process...\n');
  
  let totalChatsProcessed = 0;
  let totalMessagesFixed = 0;
  
  try {
    // Get all chats
    console.log('📋 Fetching all chats...');
    const chatsSnapshot = await db.collection('chats').get();
    console.log(`✓ Found ${chatsSnapshot.size} chats\n`);
    
    for (const chatDoc of chatsSnapshot.docs) {
      totalChatsProcessed++;
      const chatData = chatDoc.data();
      const chatDocId = chatDoc.id;
      const participants = chatData.participants || [];
      
      if (participants.length !== 2) {
        console.log(`⚠️  Chat ${chatDocId}: Invalid participants count (${participants.length})`);
        continue;
      }
      
      // Calculate what the correct chatId should be
      const correctChatId = generateChatId(participants[0], participants[1]);
      
      console.log(`\n📝 Chat ${totalChatsProcessed}/${chatsSnapshot.size}: ${chatDocId}`);
      console.log(`   Participants: ${participants.join(' ↔ ')}`);
      console.log(`   Correct chatId: ${correctChatId}`);
      
      if (chatDocId !== correctChatId) {
        console.log(`   ⚠️  WARNING: Chat document ID doesn't match expected chatId!`);
        console.log(`   This chat document may need to be recreated manually.`);
      }
      
      // Find all messages where both sender and receiver are in the participants
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
        
        // Verify both sender and receiver are in the participants
        const senderInChat = participants.includes(messageData.senderId);
        const receiverInChat = participants.includes(messageData.receiverId);
        
        if (senderInChat && receiverInChat) {
          // This message belongs to this chat
          
          if (currentChatId !== correctChatId) {
            console.log(`   🔧 Fixing message ${messageDoc.id}:`);
            console.log(`      Old chatId: ${currentChatId}`);
            console.log(`      New chatId: ${correctChatId}`);
            
            batch.update(messageDoc.ref, { chatId: correctChatId });
            fixedCount++;
            batchCount++;
            
            // Commit batch if it reaches max size
            if (batchCount >= MAX_BATCH_SIZE) {
              await batch.commit();
              console.log(`   ✅ Committed batch of ${batchCount} updates`);
              batchCount = 0;
              batch = db.batch(); // Create new batch instance
            }
          }
        }
      }
      
      // Commit any remaining updates in the batch
      if (batchCount > 0) {
        await batch.commit();
        console.log(`   ✅ Committed final batch of ${batchCount} updates`);
      }
      
      if (fixedCount > 0) {
        console.log(`   ✅ Fixed ${fixedCount} messages for this chat`);
        totalMessagesFixed += fixedCount;
      } else {
        console.log(`   ℹ️  No messages needed fixing for this chat`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ CHAT ID FIX COMPLETE!');
    console.log('='.repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   Total chats processed: ${totalChatsProcessed}`);
    console.log(`   Total messages fixed: ${totalMessagesFixed}`);
    console.log('='.repeat(60));
    
    if (totalMessagesFixed === 0) {
      console.log('\n✨ No issues found! All chatIds are already correct.');
    } else {
      console.log('\n✨ Database cleanup complete! Chat messages should now display correctly.');
    }
    
  } catch (error) {
    console.error('\n❌ Error during chat ID fix:', error);
    throw error;
  }
}

/**
 * Verification function - checks for remaining issues
 */
async function verifyChatIds() {
  console.log('\n\n🔍 Verifying chat IDs...\n');
  
  const chatsSnapshot = await db.collection('chats').get();
  let issuesFound = 0;
  
  for (const chatDoc of chatsSnapshot.docs) {
    const chatData = chatDoc.data();
    const participants = chatData.participants || [];
    
    if (participants.length !== 2) continue;
    
    const correctChatId = generateChatId(participants[0], participants[1]);
    
    // Find messages with incorrect chatId
    const messagesQuery = db.collection('messages')
      .where('senderId', 'in', participants);
    
    const messagesSnapshot = await messagesQuery.get();
    
    for (const messageDoc of messagesSnapshot.docs) {
      const messageData = messageDoc.data();
      const senderInChat = participants.includes(messageData.senderId);
      const receiverInChat = participants.includes(messageData.receiverId);
      
      if (senderInChat && receiverInChat && messageData.chatId !== correctChatId) {
        if (issuesFound === 0) {
          console.log('⚠️  Issues found:');
        }
        issuesFound++;
        console.log(`   Message ${messageDoc.id}: has chatId "${messageData.chatId}", should be "${correctChatId}"`);
      }
    }
  }
  
  if (issuesFound === 0) {
    console.log('✅ Verification passed! No issues found.');
  } else {
    console.log(`\n⚠️  Found ${issuesFound} messages with incorrect chatIds.`);
  }
  
  return issuesFound;
}

// Main execution
(async () => {
  try {
    // Run the fix
    await fixChatIds();
    
    // Verify the fix
    const issuesRemaining = await verifyChatIds();
    
    if (issuesRemaining > 0) {
      console.log('\n⚠️  Some issues remain. You may need to run this script again.');
      process.exit(1);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
})();
