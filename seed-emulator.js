#!/usr/bin/env node
/**
 * Script to seed Firebase Emulator with test data
 * Run this after starting the emulators
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin with emulator settings
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

admin.initializeApp({
  projectId: 'demo-project'
});

const db = admin.firestore();
const auth = admin.auth();

async function seedData() {
  console.log('🌱 Starting to seed emulator data...\n');

  try {
    // Load seed data
    const seedDataPath = path.join(__dirname, 'emulator-seed-data.json');
    const seedData = JSON.parse(fs.readFileSync(seedDataPath, 'utf8'));

    // Create Auth users first
    console.log('👤 Creating Auth users...');
    const authUsers = [
      { uid: 'admin123', email: 'admin@test.com', password: 'admin123', displayName: 'Test Admin' },
      { uid: 'buyer123', email: 'buyer@test.com', password: 'buyer123', displayName: 'Test Buyer' },
      { uid: 'seller123', email: 'seller@test.com', password: 'seller123', displayName: 'Test Seller' },
      { uid: 'inactive-seller', email: 'inactive@test.com', password: 'inactive123', displayName: 'Inactive Seller' }
    ];

    for (const user of authUsers) {
      try {
        await auth.createUser({
          uid: user.uid,
          email: user.email,
          password: user.password,
          displayName: user.displayName,
          emailVerified: true
        });
        console.log(`  ✓ Created user: ${user.email}`);
      } catch (error) {
        if (error.code === 'auth/uid-already-exists') {
          console.log(`  - User already exists: ${user.email}`);
        } else {
          console.error(`  ✗ Error creating user ${user.email}:`, error.message);
        }
      }
    }

    // Seed Firestore collections
    console.log('\n📦 Seeding Firestore collections...');

    // Users collection
    console.log('  Adding users...');
    for (const [userId, userData] of Object.entries(seedData.users)) {
      await db.collection('users').doc(userId).set(userData);
      console.log(`    ✓ Added user: ${userData.displayName}`);
    }

    // Products collection
    console.log('  Adding products...');
    for (const [productId, productData] of Object.entries(seedData.products)) {
      await db.collection('products').doc(productId).set(productData);
      console.log(`    ✓ Added product: ${productData.name}`);
    }

    // Orders collection
    console.log('  Adding orders...');
    for (const [orderId, orderData] of Object.entries(seedData.orders)) {
      await db.collection('orders').doc(orderId).set(orderData);
      console.log(`    ✓ Added order: ${orderId}`);
    }

    console.log('\n✅ Seeding completed successfully!');
    console.log('\n📝 Test Accounts:');
    console.log('  Admin:  admin@test.com / admin123');
    console.log('  Buyer:  buyer@test.com / buyer123');
    console.log('  Seller: seller@test.com / seller123');
    console.log('\n🌐 Access Emulator UI at: http://localhost:4000');
    
  } catch (error) {
    console.error('\n❌ Error seeding data:', error);
    process.exit(1);
  }

  process.exit(0);
}

seedData();
