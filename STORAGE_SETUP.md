# Firebase Storage Setup Guide

## Current Status

The Firebase Storage rules are defined in `storage.rules` but are **not deployed automatically** by the CI/CD pipeline to avoid deployment errors.

## Why Storage Isn't Deployed

The deployment was failing with error:
```
Error: Request to https://firebasestorage.googleapis.com/v1alpha/projects/gen-lang-client-0988357303/defaultBucket had HTTP Error: 403, Permission 'firebasestorage.defaultBucket.get' denied
```

This typically means:
1. Firebase Storage is not enabled for the project
2. The default storage bucket doesn't exist
3. The service account lacks necessary permissions

## How to Enable Firebase Storage

### Step 1: Enable Firebase Storage in Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `gen-lang-client-0988357303`
3. Navigate to **Storage** in the left sidebar
4. Click **Get Started**
5. Follow the prompts to create a default bucket
6. Choose a location (should match your Firestore location)
7. Click **Done**

### Step 2: Verify Service Account Permissions

The service account needs these permissions:
- `Firebase Rules Admin` or `Storage Admin`
- `Cloud Storage for Firebase Admin`

To check/add permissions:
1. Go to [Google Cloud Console IAM](https://console.cloud.google.com/iam-admin/iam)
2. Select project: `gen-lang-client-0988357303`
3. Find the service account used for deployment
4. Click **Edit** (pencil icon)
5. Add role: **Firebase Rules Admin**
6. Add role: **Cloud Storage for Firebase Admin**
7. Click **Save**

### Step 3: Deploy Storage Rules

Once storage is enabled and permissions are set, deploy the rules:

```bash
# Deploy storage rules manually
firebase deploy --only storage --project gen-lang-client-0988357303
```

Or update `.github/workflows/firebase-hosting.yml` to include storage:

```yaml
# Change this line:
firebase deploy --only firestore:rules,firestore:indexes,hosting --project gen-lang-client-0988357303 --non-interactive

# To this:
firebase deploy --only firestore:rules,firestore:indexes,storage,hosting --project gen-lang-client-0988357303 --non-interactive
```

## What Storage Is Used For

The storage rules in `storage.rules` control access to:

1. **Product Images** (`/products/{sellerId}/*`)
   - Sellers can upload images to their own folders
   - Public read access for catalog display
   - 5MB size limit

2. **CAD Files** (`/cad/{sellerId}/*`)
   - Technical drawings and 3D models
   - Authenticated read access only
   - 50MB size limit

3. **Profile Pictures** (`/profiles/{userId}/*`)
   - User profile images
   - Public read access
   - 2MB size limit

## Current Workaround

The application currently works without deployed storage rules because:
- Firebase Storage has default rules that are fairly permissive
- The app-level checks in the client code provide some protection
- Product images are likely served from external URLs or a different storage

However, for production security, you should:
1. Enable Firebase Storage
2. Deploy the storage rules
3. Ensure all uploads go through the proper paths defined in `storage.rules`

## Testing Storage Rules Locally

Before deploying to production:

```bash
# Start Firebase emulators with storage
firebase emulators:start --only storage

# Test uploads and downloads
# Check that rules enforce proper access control
```

## References

- [Firebase Storage Security Rules](https://firebase.google.com/docs/storage/security)
- [IAM Roles for Firebase](https://firebase.google.com/docs/projects/iam/roles-predefined-product)
- Storage rules file: `storage.rules`
- Firebase configuration: `firebase.json`
