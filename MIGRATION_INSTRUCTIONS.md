# Database Migration Instructions

This guide explains how to migrate your existing Firestore products to the new category hierarchy system.

## Overview

The system has been updated to support 30 main categories with multiple subcategories each. All existing products need to be migrated to include both `mainCategory` and `subcategory` fields.

## New Category Structure

The system now supports the following main categories:
- Construction
- Apparel & Accessories
- Automobiles & Motorcycles
- Business Services
- Chemicals
- Computer Products & Office Electronics
- Consumer Electronics
- Electrical Equipment & Supplies
- Electronics Components & Supplies
- Energy
- Environment
- Food & Beverage
- Furniture
- Gifts, Sports & Toys
- Hardware
- Health & Beauty
- Home & Garden
- Home Appliances
- Industry Laser Equipment
- Lights & Lighting
- Luggage, Bags & Cases
- Machinery
- Measurement & Analysis Instruments
- Metallurgy, Mineral & Energy
- Packaging & Printing
- Security & Protection
- Shoes & Accessories
- Textiles & Leather Products
- Transportation

Each main category has 10-15 relevant subcategories.

## Prerequisites

1. **Firebase Service Account Key**: You need a Firebase Admin SDK service account key file.
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Save the file as `serviceAccountKey.json` in the project root directory

2. **Node.js**: Ensure Node.js is installed (version 14 or higher)

3. **Dependencies**: Install required packages
   ```bash
   npm install firebase-admin
   ```

## Running the Migration

### Step 1: Prepare the Service Account Key

Place your `serviceAccountKey.json` file in the root directory of the project:
```
aluminum-website/
├── serviceAccountKey.json  ← Place here
├── scripts/
│   └── migrate-categories.js
└── ...
```

**Important**: The `serviceAccountKey.json` file is already in `.gitignore` and will not be committed to version control.

### Step 2: Review the Migration Script

Open `scripts/migrate-categories.js` and verify:
- The category hierarchy matches your requirements
- The default main category is correct (currently set to "Construction")

### Step 3: Backup Your Database

**CRITICAL**: Always backup your Firestore database before running migrations!

Use Firebase Console:
1. Go to Firestore Database
2. Click on "Import/Export"
3. Export your entire database to Google Cloud Storage
4. Save the export location for potential restoration

### Step 4: Run the Migration Script

Execute the migration:
```bash
node scripts/migrate-categories.js
```

The script will:
1. Fetch all products from Firestore
2. Skip products that already have proper structure (mainCategory + subcategory)
3. For products without proper structure:
   - If the current `category` is a valid subcategory, it will determine the correct main category
   - Otherwise, it will default to "Construction" main category and use the current category as subcategory
4. Update products in batches (500 at a time for performance)
5. Display progress and a final summary

### Step 5: Verify the Migration

After the script completes successfully:

1. Check the summary output:
   ```
   ================================================================================
   📊 Migration Summary
   ================================================================================
   Total products:     150
   Processed:          150
   Updated:            145
   Skipped (already migrated): 5
   Errors:             0
   ================================================================================
   ```

2. Verify in Firebase Console:
   - Go to Firestore Database → products collection
   - Check a few product documents
   - Ensure they have:
     - `mainCategory`: e.g., "Construction"
     - `category`: The subcategory (e.g., "Exterior Gates")
     - `subcategory`: Same as category (e.g., "Exterior Gates")

3. Test in the application:
   - Navigate to Product Catalog
   - Verify main categories display correctly
   - Click on a main category → verify subcategories show
   - Click on a subcategory → verify sellers and products display

## What the Migration Does

### For Each Product:

**Before Migration:**
```json
{
  "id": "abc123",
  "modelNumber": "AL-6061-T6-001",
  "category": "Exterior Gates",
  "price": 25.50,
  ...
}
```

**After Migration:**
```json
{
  "id": "abc123",
  "modelNumber": "AL-6061-T6-001",
  "mainCategory": "Construction",
  "category": "Exterior Gates",
  "subcategory": "Exterior Gates",
  "price": 25.50,
  ...
}
```

### Migration Logic:

1. **If product already has `mainCategory` and `subcategory`**: Skip (already migrated)

2. **If current `category` is a valid subcategory in hierarchy**:
   - Find its parent main category
   - Set `mainCategory` to the parent
   - Set `subcategory` to current category
   - Keep `category` field unchanged (for backward compatibility)

3. **If current `category` is NOT in hierarchy**:
   - Default `mainCategory` to "Construction"
   - Set `subcategory` to current category (or "Exterior Gates" if empty)
   - Keep `category` field unchanged

## Troubleshooting

### Error: Service account key not found
```
❌ Service account key not found.
```
**Solution**: Place `serviceAccountKey.json` in the project root directory.

### Error: Permission denied
```
❌ Error: Missing or insufficient permissions
```
**Solution**: Ensure your service account has Firestore read/write permissions.

### Error: Batch write limit exceeded
The script automatically handles batching (500 products per batch). If you see this error, the batch size might need adjustment in the script.

### Some products not migrated
Check the error count in the summary. Review console output for specific error messages about which products failed.

## Rolling Back

If you need to roll back the migration:

1. Restore from your Firebase backup:
   - Go to Firebase Console → Firestore → Import/Export
   - Click "Import" and select your backup

2. Or, manually revert products:
   ```javascript
   // Remove the new fields from products
   db.collection('products').get().then(snapshot => {
     const batch = db.batch();
     snapshot.docs.forEach(doc => {
       batch.update(doc.ref, {
         mainCategory: admin.firestore.FieldValue.delete(),
         subcategory: admin.firestore.FieldValue.delete()
       });
     });
     return batch.commit();
   });
   ```

## Post-Migration

After successful migration:

1. **Deploy the updated application** with the new category hierarchy
2. **Test all category navigation** flows
3. **Verify product uploads** work with the new structure
4. **Test bulk import** with the updated CSV template
5. **Update any external systems** that may rely on the old category structure

## Support

If you encounter issues:
1. Check the console output for specific error messages
2. Verify your Firebase permissions
3. Ensure the service account key is valid and not expired
4. Review the Firestore security rules to ensure the service account has access

For additional help, contact: contactus@ione.live
