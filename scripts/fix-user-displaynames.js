/**
 * Utility Script: Fix User Display Names in Firestore
 * 
 * Run this in Firebase Console to ensure all users have displayName
 */

async function fixUserDisplayNames() {
  console.log('Starting user displayName fix...');
  
  const db = firebase.firestore();
  const usersSnapshot = await db.collection('users').get();
  
  console.log(`Found ${usersSnapshot.docs.length} users to check`);
  
  let updatedCount = 0;
  let skippedCount = 0;
  
  for (const doc of usersSnapshot.docs) {
    const userId = doc.id;
    const userData = doc.data();
    
    if (userData.displayName && userData.displayName.trim() !== '') {
      console.log(`✓ User ${userId} already has displayName: ${userData.displayName}`);
      skippedCount++;
      continue;
    }
    
    console.log(`⚠ User ${userId} missing displayName, fixing...`);
    
    let newDisplayName = null;
    
    if (userData.name && userData.name.trim() !== '') {
      newDisplayName = userData.name.trim();
    } else if (userData.email) {
      const emailUsername = userData.email.split('@')[0];
      newDisplayName = emailUsername
        .replace(/[._-]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    } else {
      const role = userData.role || 'user';
      newDisplayName = role.charAt(0).toUpperCase() + role.slice(1);
    }
    
    await doc.ref.update({ 
      displayName: newDisplayName,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    console.log(`✓ Updated user ${userId} with displayName: ${newDisplayName}`);
    updatedCount++;
  }
  
  console.log('\n========================================');
  console.log('Fix Complete!');
  console.log(`Total: ${usersSnapshot.docs.length}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log(`Updated: ${updatedCount}`);
  console.log('========================================\n');
}

fixUserDisplayNames();
