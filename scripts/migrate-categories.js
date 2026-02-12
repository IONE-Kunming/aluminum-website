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

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalents for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
let serviceAccount;
try {
  // Try to load service account from environment or file
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
    if (fs.existsSync(serviceAccountPath)) {
      // Use fs.readFileSync to load JSON file in ES modules
      const serviceAccountData = fs.readFileSync(serviceAccountPath, 'utf8');
      serviceAccount = JSON.parse(serviceAccountData);
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

// Define the category hierarchy - must match categoryHierarchy.js
const CATEGORY_HIERARCHY = {
  'Construction': ['Exterior Gates', 'Fences', 'Balustrades', 'Barrier Systems', 'Fencing', 'Handrails', 'Gates', 'Railings', 'Screens', 'Partitions', 'Aluminum', 'Steel', 'Glass', 'Concrete', 'Tools', 'Equipment', 'Hardware', 'Electrical', 'Plumbing', 'Paint', 'Wood'],
  'Apparel & Accessories': ['Jewelry', 'Watches & Eyewear', 'Bags & Wallets', 'Scarves & Shawls', 'Belts', 'Headwear', 'Gloves', 'Footwear Accessories', 'Ties & Bow Ties', "Men's Clothing", "Women's Clothing", "Children's Clothing", 'Activewear', 'Formal Wear', 'Traditional Wear'],
  'Automobiles & Motorcycles': ['Engine Components', 'Transmission & Drivetrain', 'Suspension & Steering', 'Brake Systems', 'Electrical & Ignition', 'Exhaust & Emissions', 'Cooling Systems', 'Fuel Systems', 'Body Parts & Accessories', 'Wheels & Tires', 'Lighting & Lamps', 'Interior Accessories', 'Motorcycle Parts'],
  'Business Services': ['Consulting & Advisory', 'IT Consulting', 'Financial Advisory', 'HR Consulting', 'Legal Services', 'Accounting & Auditing', 'Marketing Services', 'Design & Engineering', 'Cloud Computing', 'Cybersecurity', 'Recruitment & Staffing', 'Business Process Outsourcing', 'Data Analytics'],
  'Chemicals': ['Industrial Chemicals', 'Organic Chemicals', 'Inorganic Chemicals', 'Petrochemicals', 'Agricultural Chemicals', 'Specialty Chemicals', 'Adhesives & Sealants', 'Paints & Coatings', 'Cleaning Chemicals', 'Laboratory Chemicals'],
  'Computer Products & Office Electronics': ['Desktop Computers', 'Laptops', 'Tablets', 'Computer Accessories', 'Monitors', 'Printers & Scanners', 'Keyboards & Mice', 'External Storage', 'Networking Equipment', 'Office Phones', 'Projectors', 'Office Furniture'],
  'Consumer Electronics': ['Smartphones', 'Audio Equipment', 'Video Equipment', 'Gaming Devices', 'Smart Home Devices', 'Wearables', 'Cameras', 'Headphones & Earbuds', 'Speakers', 'TVs', 'Streaming Devices', 'VR Headsets'],
  'Electrical Equipment & Supplies': ['Wiring & Cables', 'Circuit Breakers', 'Switches & Sockets', 'Transformers', 'Motors & Generators', 'Power Distribution', 'Batteries', 'Solar Equipment', 'Electrical Tools', 'Safety Equipment'],
  'Electronics Components & Supplies': ['Semiconductors', 'Integrated Circuits', 'Capacitors', 'Resistors', 'Connectors', 'Sensors', 'PCB Boards', 'Displays', 'Modules', 'Passive Components'],
  'Energy': ['Solar Energy', 'Wind Energy', 'Hydroelectric', 'Generators', 'Power Plants', 'Energy Storage', 'Fuel Cells', 'Batteries', 'Renewable Energy', 'Energy Management'],
  'Environment': ['Water Treatment', 'Air Purification', 'Waste Management', 'Recycling Equipment', 'Pollution Control', 'Environmental Testing', 'Renewable Resources', 'Conservation Equipment', 'Eco-friendly Products', 'Sustainability Solutions'],
  'Food & Beverage': ['Fresh Food', 'Processed Food', 'Beverages', 'Snacks & Confectionery', 'Dairy Products', 'Meat & Seafood', 'Bakery Products', 'Food Ingredients', 'Food Processing Equipment', 'Packaging'],
  'Furniture': ['Living Room Furniture', 'Bedroom Furniture', 'Dining Room Furniture', 'Office Furniture', 'Outdoor Furniture', 'Kitchen Furniture', 'Children Furniture', 'Commercial Furniture', 'Antique Furniture', 'Custom Furniture'],
  'Gifts, Sports & Toys': ['Action Figures', 'Educational Toys', 'Outdoor Play Equipment', 'Sports Equipment', 'Fitness Equipment', 'Board Games', 'Puzzles', 'Gift Items', 'Party Supplies', 'Crafts & Hobbies'],
  'Hardware': ['Hand Tools', 'Power Tools', 'Fasteners', 'Locks & Keys', 'Hinges', 'Door Hardware', 'Window Hardware', 'Cabinet Hardware', 'Building Hardware', 'Tool Storage'],
  'Health & Beauty': ['Skincare', 'Hair Care', 'Makeup & Cosmetics', 'Fragrances', 'Personal Care', 'Health Supplements', 'Medical Devices', 'Fitness & Wellness', 'Oral Care', 'Beauty Tools'],
  'Home & Garden': ['Garden Furniture', 'Outdoor Decor', 'Gardening Tools', 'Plants & Seeds', 'Lawn Care', 'Grills & Outdoor Cooking', 'Fire Pits', 'Sheds & Storage', 'Pools & Spas', 'Greenhouses'],
  'Home Appliances': ['Kitchen Appliances', 'Laundry Appliances', 'Refrigerators & Freezers', 'Vacuum Cleaners', 'Air Conditioners', 'Heaters', 'Water Heaters', 'Small Appliances', 'Built-in Appliances', 'Smart Appliances'],
  'Industry Laser Equipment': ['Laser Cutting Machines', 'Laser Engraving Machines', 'Laser Welding Equipment', 'Laser Marking Systems', 'Laser Measuring Tools', 'CO2 Lasers', 'Fiber Lasers', 'Laser Components', 'Laser Safety Equipment', 'Laser Accessories'],
  'Lights & Lighting': ['LED Lights', 'Indoor Lighting', 'Outdoor Lighting', 'Commercial Lighting', 'Decorative Lighting', 'Street Lights', 'Industrial Lighting', 'Emergency Lighting', 'Smart Lighting', 'Lighting Accessories'],
  'Luggage, Bags & Cases': ['Suitcases', 'Travel Bags', 'Backpacks', 'Laptop Bags', 'Camera Cases', 'Tool Cases', 'Cosmetic Cases', 'Sports Bags', 'Briefcases', 'Protective Cases'],
  'Machinery': ['Construction Machinery', 'Mining Equipment', 'Agricultural Machinery', 'Manufacturing Equipment', 'Material Handling', 'Packaging Machinery', 'Textile Machinery', 'Food Processing', 'CNC Machines', 'Industrial Robots'],
  'Measurement & Analysis Instruments': ['Testing Equipment', 'Laboratory Instruments', 'Analytical Instruments', 'Flow Meters', 'Temperature Sensors', 'Pressure Gauges', 'Precision Instruments', 'Surveying Equipment', 'Quality Control Tools', 'Inspection Devices'],
  'Metallurgy, Mineral & Energy': ['Metal Processing', 'Mineral Processing', 'Mining Equipment', 'Smelting Equipment', 'Casting Equipment', 'Rolling Mills', 'Ore Processing', 'Metal Fabrication', 'Metallurgy Tools', 'Refining Equipment'],
  'Packaging & Printing': ['Packaging Materials', 'Printing Machinery', 'Labels & Tags', 'Boxes & Containers', 'Flexible Packaging', 'Printing Supplies', 'Packaging Design', 'Protective Packaging', 'Industrial Printing', 'Packaging Equipment'],
  'Security & Protection': ['Security Cameras', 'Alarm Systems', 'Access Control', 'Fire Protection', 'Personal Protective Equipment', 'Security Doors & Gates', 'Surveillance Systems', 'Safety Equipment', 'Security Services', 'Cybersecurity Products'],
  'Shoes & Accessories': ["Men's Shoes", "Women's Shoes", "Children's Shoes", 'Athletic Shoes', 'Formal Shoes', 'Casual Shoes', 'Boots', 'Sandals', 'Shoe Care', 'Shoe Accessories'],
  'Textiles & Leather Products': ['Fabrics', 'Yarn', 'Textile Materials', 'Home Textiles', 'Technical Textiles', 'Leather Products', 'Synthetic Leather', 'Textile Machinery', 'Dyeing & Finishing', 'Textile Accessories'],
  'Transportation': ['Logistics Services', 'Freight Services', 'Shipping & Cargo', 'Warehousing', 'Vehicle Transport', 'Air Freight', 'Sea Freight', 'Land Transport', 'Express Delivery', 'Supply Chain Solutions']
};

function isSubcategory(category) {
  for (const subcategories of Object.values(CATEGORY_HIERARCHY)) {
    if (subcategories.includes(category)) {
      return true;
    }
  }
  return false;
}

function getMainCategoryForSubcategory(subcategory) {
  for (const [mainCategory, subcategories] of Object.entries(CATEGORY_HIERARCHY)) {
    if (subcategories.includes(subcategory)) {
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
