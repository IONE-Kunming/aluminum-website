# Firebase Service Account Permissions Guide

This guide explains how to grant the necessary permissions to your Firebase service account so that GitHub Actions can deploy Firestore rules successfully.

## Current Issue

The deployment is failing with this error:
```
Error: Request to https://firebaserules.googleapis.com/v1/projects/gen-lang-client-0988357303:test had HTTP Error: 403, The caller does not have permission
```

This means the service account stored in `FIREBASE_SERVICE_ACCOUNT` GitHub secret doesn't have permission to test/deploy Firebase Rules.

## Two Solutions

### Solution 1: Grant Additional Permissions (Recommended)

Grant the service account the necessary permissions to deploy Firestore rules.

#### Step-by-Step Instructions:

1. **Go to Google Cloud Console**
   - Navigate to: https://console.cloud.google.com/
   - Select your project: `gen-lang-client-0988357303`

2. **Navigate to IAM**
   - In the left sidebar, click **IAM & Admin** → **IAM**
   - Or go directly to: https://console.cloud.google.com/iam-admin/iam?project=gen-lang-client-0988357303

3. **Find Your Service Account**
   - Look for the service account that's used in GitHub Actions
   - It should look like: `github-actions@gen-lang-client-0988357303.iam.gserviceaccount.com`
   - Or similar to: `firebase-adminsdk-xxxxx@gen-lang-client-0988357303.iam.gserviceaccount.com`

4. **Edit Permissions**
   - Click the **pencil icon (Edit)** next to the service account
   - In the "Edit permissions" panel, click **Add Another Role**

5. **Add Required Role**
   
   **Option A - Specific Role (More Secure):**
   - Add role: **Firebase Rules Admin**
   - This grants permission to manage Firebase Rules only
   
   **Option B - Broader Role (Simpler):**
   - Add role: **Firebase Admin**
   - This grants full Firebase permissions (includes rules, hosting, etc.)
   
   **Option C - Individual APIs (Most Granular):**
   - Add role: **Firebase Rules System**
   - Or enable the API: **Firebase Rules API** in the APIs & Services console

6. **Save Changes**
   - Click **Save**
   - Wait 1-2 minutes for permissions to propagate

7. **Re-run Deployment**
   - Go to your GitHub repository
   - Navigate to **Actions** tab
   - Re-run the failed workflow
   - Or push a new commit to trigger deployment

#### Required API

Make sure the **Firebase Rules API** is enabled:

1. Go to: https://console.cloud.google.com/apis/library?project=gen-lang-client-0988357303
2. Search for: **Firebase Rules API**
3. Click on it and ensure it's **ENABLED**
4. If not enabled, click **ENABLE**

### Solution 2: Deploy Without Rules (Current Workaround)

This is what we've implemented as a temporary fix. The workflow now skips Firestore rules deployment:

```bash
firebase deploy --only firestore:indexes,hosting --project gen-lang-client-0988357303 --non-interactive
```

**Pros:**
- Works immediately without permission changes
- No Google Cloud Console access required

**Cons:**
- Firestore rules must be deployed manually
- Security rules won't auto-update from code changes
- Requires manual deployment when rules change

#### Manual Rules Deployment

When you need to update Firestore rules:

```bash
# Install Firebase CLI locally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy rules only
firebase deploy --only firestore:rules --project gen-lang-client-0988357303
```

## How to Check Current Service Account Permissions

1. Go to Google Cloud Console
2. Navigate to **IAM & Admin** → **IAM**
3. Find your service account
4. Look at the "Role" column to see current permissions

Common roles you might see:
- `Editor` - Has broad Google Cloud permissions. While it may technically work, it's overly permissive and not recommended for production. Use specific Firebase roles instead.
- `Firebase Admin` - Has all Firebase permissions including rules. Recommended if service account needs access to multiple Firebase services.
- `Firebase Hosting Admin` - Can deploy hosting. Does NOT include Firebase Rules API access.
- `Firebase Rules Admin` - Can manage Firebase Rules specifically. **Recommended** for this use case (principle of least privilege).

## Recommended Approach

**For Production:**
1. Use **Solution 1** - Grant proper permissions
2. This ensures your security rules are always in sync with your code
3. Automated deployments include rule updates

**For Testing/Development:**
1. **Solution 2** works fine as a temporary measure
2. Remember to manually deploy rules when needed

## Security Best Practices

1. **Principle of Least Privilege**
   - Only grant the minimum permissions needed
   - Use `Firebase Rules Admin` instead of `Editor` or `Owner`

2. **Service Account Management**
   - Regularly audit service account permissions
   - Rotate service account keys periodically
   - Keep service account keys secure (never commit to git)

3. **Separate Environments**
   - Consider separate service accounts for dev/staging/production
   - Use different Firebase projects for different environments

## Verifying the Fix

After granting permissions:

1. **Check API Access:**
   ```bash
   # Test if the API is accessible
   curl -H "Authorization: Bearer $(gcloud auth print-access-token)" \
     https://firebaserules.googleapis.com/v1/projects/gen-lang-client-0988357303:test
   ```
   
2. **Test Deployment:**
   - Push a commit or manually trigger the GitHub Action
   - Check the deployment logs
   - Verify no 403 errors appear

3. **Verify Rules in Console:**
   - Go to Firebase Console → Firestore Database → Rules
   - Check that rules match your `firestore.rules` file
   - Check the "Last deployed" timestamp

## Alternative: Using Firebase Token Instead of Service Account

If you prefer, you can use a Firebase CI token instead:

1. **Generate Token:**
   ```bash
   firebase login:ci
   ```

2. **Update GitHub Secret:**
   - Name: `FIREBASE_TOKEN`
   - Value: (paste the generated token)

3. **Update Workflow:**
   - Remove the service account setup
   - Use: `firebase deploy --token ${{ secrets.FIREBASE_TOKEN }}`

**Note:** Firebase tokens have full permissions and don't require IAM configuration.

## Troubleshooting

### Still Getting 403 After Granting Permissions

1. Wait 5-10 minutes for permissions to propagate globally
2. Check that you edited the correct service account
3. Verify the API is enabled in Cloud Console
4. Try re-generating the service account key

### Can't Find Service Account in IAM

1. Check if it exists: Go to **IAM & Admin** → **Service Accounts**
2. If it doesn't exist, create a new one:
   - Click **Create Service Account**
   - Name: `github-actions`
   - Grant role: `Firebase Admin`
   - Create and download the JSON key
   - Add the JSON key content to GitHub secret: `FIREBASE_SERVICE_ACCOUNT`

### Don't Have Access to Google Cloud Console

If you don't have access to the Google Cloud Console:
1. Contact your Firebase/GCP project administrator
2. Request they grant `Firebase Rules Admin` role to the service account
3. Or request they add you as an IAM admin for the project

## Summary

**Quick Fix (5 minutes):**
- Keep using current workaround (Solution 2)
- Deploy rules manually when needed

**Proper Fix (10 minutes):**
- Grant `Firebase Rules Admin` role to service account (Solution 1)
- Enable Firebase Rules API
- Update workflow to include `firestore:rules` in deployment

Choose the approach that best fits your team's workflow and security requirements.
