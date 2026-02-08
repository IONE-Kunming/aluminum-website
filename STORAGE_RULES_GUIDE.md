# Firebase Storage Rules Guide

## Overview
This document explains the Firebase Storage security rules for the aluminum website and how they ensure proper access control without using generic or mock data.

## Key Security Principles

### 1. Path-Based Access Control
Firebase Storage rules are **path-based**, not data-based. This means:
- Rules validate based on the file path structure
- Rules cannot query Firestore to check categories or other metadata
- Access control is enforced through the folder structure

### 2. Seller Isolation
Each seller can only upload files to their own folder:
```
/products/{sellerId}/{fileName}
```
Where `{sellerId}` must match the authenticated user's UID.

### 3. Category Management
Categories are **not** stored in the storage path. Instead:
- Categories are stored in the Firestore `products` collection as document fields
- When a seller adds a product with a new category, it's saved in Firestore
- The `getCategories()` function in `dataService.js` dynamically extracts unique categories from all products
- Storage rules validate **who** can upload (the seller), not **what category** they're uploading to

## Storage Path Structure

### Product Images
```
/products/{sellerId}/{timestamp}_{filename}
```
**Example:** `/products/abc123/1707389123456_door.jpg`

**Security:**
- ✅ Seller `abc123` can upload to `/products/abc123/...`
- ❌ Seller `abc123` cannot upload to `/products/xyz789/...`
- ✅ Anyone can read (public access for catalog display)

### CAD Files
```
/cad/{sellerId}/{filename}
```
**Example:** `/cad/abc123/window-design.dxf`

**Security:**
- ✅ Seller `abc123` can upload to `/cad/abc123/...`
- ✅ Only authenticated users can read CAD files
- ❌ Unauthenticated users cannot access CAD files

### Profile Pictures
```
/profiles/{userId}/{filename}
```
**Example:** `/profiles/user456/avatar.jpg`

**Security:**
- ✅ User `user456` can upload to `/profiles/user456/...`
- ✅ Anyone can read (public access for user profiles)

## How Categories Work

### Category Storage Flow

1. **Seller uploads a product image:**
   ```javascript
   const imageRef = storage.ref(`products/${user.uid}/${Date.now()}_${imageFile.name}`);
   await imageRef.put(imageFile);
   const imageUrl = await imageRef.getDownloadURL();
   ```

2. **Seller creates product with category:**
   ```javascript
   const productData = {
     modelNumber: "AL-001",
     category: "Aluminum Doors",  // Category is stored in Firestore, not storage path
     pricePerMeter: 50,
     imageUrl: imageUrl,
     sellerId: user.uid
   };
   await dataService.addProduct(productData);
   ```

3. **Categories are retrieved dynamically:**
   ```javascript
   // This queries Firestore products collection, not storage
   const categories = await dataService.getCategories(sellerId);
   // Returns: ["Aluminum Doors", "Windows", "Frames", ...]
   ```

### Why Not Store Categories in Storage Paths?

❌ **Bad Approach:** `/products/{sellerId}/{category}/{filename}`
- Would require reorganizing files when category changes
- Storage rules cannot validate against dynamic Firestore data
- Would create complex path structures
- Difficult to maintain and refactor

✅ **Current Approach:** `/products/{sellerId}/{filename}` + Firestore metadata
- Simple, flat storage structure
- Categories are flexible and can be changed without moving files
- Storage rules focus on access control (who can upload)
- Firestore handles metadata and categorization

## Rule Details

### Products Rule
```javascript
match /products/{sellerId}/{allPaths=**} {
  // Public read access (anyone can view product images)
  allow read: if true;
  
  // Only the seller can upload to their own folder
  allow write: if isAuthenticated() && 
                  isOwner(sellerId) && 
                  isValidImage();
}
```

**What this prevents:**
- Generic uploads: ❌ Users cannot upload to `/products/generic/...`
- Cross-seller uploads: ❌ Seller A cannot upload to Seller B's folder
- Unauthenticated uploads: ❌ Anonymous users cannot upload
- Oversized files: ❌ Files over 5MB are rejected
- Wrong file types: ❌ Non-image files are rejected

**What this allows:**
- ✅ Seller can upload to their own folder
- ✅ Any category name (stored in Firestore, not path)
- ✅ Anyone can view images (needed for public catalog)

## Deploying Storage Rules

### Method 1: Firebase Console (Recommended)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Storage** in the left sidebar
4. Click on the **Rules** tab
5. Copy the contents of `storage.rules` file
6. Paste into the editor
7. Click **Publish**

### Method 2: Firebase CLI
```bash
# Make sure you have firebase.json configured
firebase deploy --only storage

# Or deploy both Firestore and Storage rules together
firebase deploy --only firestore:rules,storage
```

### Method 3: Using firebase.json
If you don't have a `firebase.json` file, create one:

```json
{
  "storage": {
    "rules": "storage.rules"
  },
  "firestore": {
    "rules": "firestore.rules"
  }
}
```

Then deploy:
```bash
firebase deploy --only storage
```

## Testing Storage Rules

### Test 1: Seller Upload to Own Folder
```javascript
// ✅ Should succeed
const storage = firebase.storage();
const user = firebase.auth().currentUser;
const ref = storage.ref(`products/${user.uid}/test.jpg`);
await ref.put(imageFile);
```

### Test 2: Seller Upload to Another Seller's Folder
```javascript
// ❌ Should fail with permission denied
const storage = firebase.storage();
const ref = storage.ref(`products/different-seller-id/test.jpg`);
await ref.put(imageFile); // Error: Permission denied
```

### Test 3: Unauthenticated Upload
```javascript
// ❌ Should fail
await firebase.auth().signOut();
const storage = firebase.storage();
const ref = storage.ref(`products/any-seller/test.jpg`);
await ref.put(imageFile); // Error: Permission denied
```

### Test 4: Public Read Access
```javascript
// ✅ Should succeed even when not authenticated
await firebase.auth().signOut();
const storage = firebase.storage();
const ref = storage.ref(`products/seller-id/existing-image.jpg`);
const url = await ref.getDownloadURL(); // Success!
```

## Adding New Categories

When a seller adds a product with a new category:

### Step 1: Seller creates product
```javascript
const newProduct = {
  modelNumber: "NEW-001",
  category: "Brand New Category",  // New category!
  pricePerMeter: 75,
  sellerId: currentUser.uid,
  imageUrl: "https://storage.googleapis.com/..."
};
await dataService.addProduct(newProduct);
```

### Step 2: Category automatically appears
```javascript
// Next time categories are fetched, the new category will appear
const categories = await dataService.getCategories();
// Returns: [...existing categories, "Brand New Category"]
```

### Step 3: No storage rule changes needed!
- Storage rules don't care about category names
- Storage rules only validate that the seller is uploading to their own folder
- Category data lives in Firestore, not in the storage path

## Security Checklist

- [x] Sellers can only upload to their own folders
- [x] Generic paths like `/products/generic/...` are blocked
- [x] File size limits enforced (5MB for images, 50MB for CAD)
- [x] File type validation (only images for products)
- [x] Public read access for product images (catalog requirement)
- [x] Categories stored in Firestore, not storage paths
- [x] No hardcoded or mock category names in rules
- [x] Path-based access control enforced
- [x] Unauthenticated uploads blocked

## Common Questions

### Q: Why not validate categories in storage rules?
**A:** Storage rules cannot query Firestore data. They only have access to:
- `request.auth` (current user)
- `request.resource` (file being uploaded)
- Path variables (e.g., `{sellerId}`)

Categories are dynamic business data that should live in Firestore.

### Q: How do I add a new category?
**A:** Just create a product with the new category name in Firestore. The `getCategories()` function will automatically pick it up.

### Q: Can sellers upload to any category?
**A:** Yes, but the category is stored in Firestore, not the storage path. Storage rules ensure sellers can only upload to their own folder, regardless of category.

### Q: What if I want to restrict certain categories?
**A:** That validation should be done in your application code or Cloud Functions, not in storage rules. Storage rules focus on path-based access control.

## Related Files

- `/storage.rules` - Storage security rules
- `/public/js/dataService.js` - Contains `getCategories()` function
- `/public/pages/products.js` - Product upload implementation
- `/FIRESTORE_SECURITY_RULES.md` - Firestore rules documentation

## Best Practices

1. **Keep storage paths simple** - Use flat structures like `/products/{sellerId}/{filename}`
2. **Store metadata in Firestore** - Categories, descriptions, prices, etc. belong in Firestore
3. **Use path variables for access control** - Validate `{userId}` or `{sellerId}` matches `request.auth.uid`
4. **Test rules thoroughly** - Use Firebase emulator or manual testing
5. **Monitor usage** - Check Firebase console for unauthorized access attempts
6. **Keep rules documented** - Maintain this guide as rules evolve

## Troubleshooting

### Error: "Permission denied"
- Check that the user is authenticated
- Verify the path includes the user's UID
- Confirm file size and type are valid

### Error: "Object does not exist"
- The file may not have been uploaded
- Check the exact path used for upload vs. download
- Verify storage bucket configuration

### Categories not appearing
- Check that products exist in Firestore
- Verify `category` field is set on product documents
- Clear cache and refresh the page

## Migration Notes

If you have existing products uploaded before these rules:
1. Existing files remain accessible (read access is public)
2. Files in old paths should be migrated to the new structure
3. Use Firebase Admin SDK to bulk move files if needed
4. Update `imageUrl` fields in Firestore after moving files
