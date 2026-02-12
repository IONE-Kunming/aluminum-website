#!/usr/bin/env node

/**
 * Migrate Product Categories Script
 * 
 * This script updates all products in Firestore to have proper category hierarchy:
 * - mainCategory: The main category (e.g., "Construction")
 * - category: The subcategory (e.g., "Exterior Gates", "Fences")
 * - subcategory: Same as category for consistency
 * 
 * For existing products without proper hierarchy:
 * - Sets mainCategory to "Construction"
 * - Moves the current category field to subcategory
 * - Updates category to match subcategory
 * 
 * Run with: node scripts/migrate-categories.js
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

// Define the category hierarchy
const CATEGORY_HIERARCHY = {
  'Construction': {
    name: 'Construction',
    subcategories: [
      'Exterior Gates',
      'Fences',
      'Balustrades',
      'Barrier Systems',
      'Fencing',
      'Handrails',
      'Gates',
      'Railings',
      'Screens',
      'Partitions',
      'Aluminum',
      'Steel',
      'Glass',
      'Concrete',
      'Tools',
      'Equipment',
      'Hardware',
      'Electrical',
      'Plumbing',
      'Paint',
      'Wood'
    ]
  }
};

function isSubcategory(category) {
  for (const config of Object.values(CATEGORY_HIERARCHY)) {
    if (config.subcategories.includes(category)) {
      return true;
    }
  }
  return false;
}

function getMainCategoryForSubcategory(subcategory) {
  for (const [mainCategory, config] of Object.entries(CATEGORY_HIERARCHY)) {
    if (config.subcategories.includes(subcategory)) {
      return mainCategory;
    }
  }
  return null;
}

/**
 * Main migration function
 */
async function migrateCategories() {
  console.log('🚀 Starting product category migration...\n');
  
  try {
    // Get all products
    const productsSnapshot = await db.collection('products').get();
    const totalProducts = productsSnapshot.size;
    
    console.log(`📦 Found ${totalProducts} products to process\n`);
    
    if (totalProducts === 0) {
      console.log('✅ No products to migrate');
      return;
    }
    
    let processedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // Process products in batches
    const BATCH_SIZE = 500; // Firestore batch write limit
    let batch = db.batch();
    let batchCount = 0;
    
    for (const doc of productsSnapshot.docs) {
      processedCount++;
      const product = doc.data();
      const productId = doc.id;
      
      try {
        // Check if product already has proper structure
        if (product.mainCategory && product.subcategory) {
          console.log(`⏭️  Skipping ${product.modelNumber || productId} - already has proper structure`);
          skippedCount++;
          continue;
        }
        
        // Determine the migration strategy
        let mainCategory = 'Construction'; // Default main category
        let subcategory = product.category || 'Exterior Gates'; // Use current category or default
        
        // If current category is a valid subcategory, use it
        if (product.category && isSubcategory(product.category)) {
          subcategory = product.category;
          const foundMainCategory = getMainCategoryForSubcategory(product.category);
          if (foundMainCategory) {
            mainCategory = foundMainCategory;
          }
        }
        
        // Update product with new structure
        const updates = {
          mainCategory: mainCategory,
          category: subcategory, // Keep category field pointing to subcategory for backward compatibility
          subcategory: subcategory
        };
        
        batch.update(doc.ref, updates);
        batchCount++;
        updatedCount++;
        
        console.log(`✅ Queued update for ${product.modelNumber || productId}: ${mainCategory} > ${subcategory}`);
        
        // Commit batch if it reaches the size limit
        if (batchCount >= BATCH_SIZE) {
          console.log(`\n💾 Committing batch of ${batchCount} updates...`);
          await batch.commit();
          batch = db.batch();
          batchCount = 0;
          console.log('✅ Batch committed successfully\n');
        }
        
      } catch (error) {
        console.error(`❌ Error processing product ${productId}:`, error.message);
        errorCount++;
      }
    }
    
    // Commit remaining batch
    if (batchCount > 0) {
      console.log(`\n💾 Committing final batch of ${batchCount} updates...`);
      await batch.commit();
      console.log('✅ Final batch committed successfully\n');
    }
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary');
    console.log('='.repeat(60));
    console.log(`Total products:     ${totalProducts}`);
    console.log(`Processed:          ${processedCount}`);
    console.log(`Updated:            ${updatedCount}`);
    console.log(`Skipped (already migrated): ${skippedCount}`);
    console.log(`Errors:             ${errorCount}`);
    console.log('='.repeat(60));
    
    if (errorCount > 0) {
      console.log('\n⚠️  Migration completed with some errors');
      process.exit(1);
    } else {
      console.log('\n✅ Migration completed successfully!');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateCategories()
  .then(() => {
    console.log('\n👋 Exiting...');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
