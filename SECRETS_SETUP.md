# Firebase Service Account Setup Guide

This document explains how to securely configure Firebase service account credentials for GitHub Actions, Copilot, and Codespaces.

## ⚠️ Security Warning

**NEVER commit service account credentials directly to the repository!** Always use GitHub Secrets for sensitive data.

## Required Secret

### Secret Name: `FIREBASE_SERVICE_ACCOUNT`

This secret contains the complete Firebase service account JSON credential.

## How to Update GitHub Secrets

### Method 1: GitHub Web UI (Recommended for beginners)

1. Go to your repository on GitHub: `https://github.com/IONE-Kunming/aluminum-website`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** (or edit existing `FIREBASE_SERVICE_ACCOUNT`)
4. Name: `FIREBASE_SERVICE_ACCOUNT`
5. Value: Paste the complete JSON service account (see format below)
6. Click **Add secret** or **Update secret**

### Method 2: GitHub CLI

```bash
# Set the secret using GitHub CLI
gh secret set FIREBASE_SERVICE_ACCOUNT --body '{
  "type": "service_account",
  "project_id": "gen-lang-client-0988357303",
  "private_key_id": "YOUR_PRIVATE_KEY_ID",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@gen-lang-client-0988357303.iam.gserviceaccount.com",
  "client_id": "YOUR_CLIENT_ID",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40gen-lang-client-0988357303.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}'
```

Or load from a file:

```bash
gh secret set FIREBASE_SERVICE_ACCOUNT < path/to/service-account.json
```

## Codespaces Secrets

To make the secret available in Codespaces:

1. Go to: `https://github.com/settings/codespaces`
2. Click **New secret**
3. Name: `FIREBASE_SERVICE_ACCOUNT`
4. Value: Paste the complete JSON service account
5. Select repositories: Choose `IONE-Kunming/aluminum-website`
6. Click **Add secret**

## Copilot/Workspace Secrets

For local development or Copilot workspace:

1. **Do not commit** service account files to the repository
2. Create a local file: `serviceAccountKey.json` (already in `.gitignore`)
3. Place your service account JSON in this file
4. The scripts will automatically detect and use it

## Service Account JSON Format

```json
{
  "type": "service_account",
  "project_id": "gen-lang-client-0988357303",
  "private_key_id": "YOUR_PRIVATE_KEY_ID_HERE",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@gen-lang-client-0988357303.iam.gserviceaccount.com",
  "client_id": "YOUR_CLIENT_ID_HERE",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40gen-lang-client-0988357303.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
```

## Where Secrets Are Used

The `FIREBASE_SERVICE_ACCOUNT` secret is used in:

1. **`.github/workflows/firebase-hosting.yml`** - Main deployment workflow
2. **`.github/workflows/deploy-with-migration.yml`** - Deployment with database migration
3. **`.github/workflows/migrate-categories.yml`** - Standalone database migration

## Verification

After updating the secret:

1. Go to **Actions** tab in GitHub
2. Run one of the workflows manually (if applicable)
3. Check the logs to ensure authentication succeeds
4. Look for errors like "invalid credentials" or "authentication failed"

## Troubleshooting

### Error: "Service account key not found"
- Ensure the secret name is exactly `FIREBASE_SERVICE_ACCOUNT`
- Verify the secret exists in Settings → Secrets and variables → Actions

### Error: "Invalid credentials"
- Check that the JSON is valid (no extra spaces, correct formatting)
- Ensure the private key includes `\n` for line breaks
- Verify the service account has necessary permissions in Firebase Console

### Error: "Permission denied"
- Verify the service account has these roles in Firebase Console:
  - Firebase Admin SDK Administrator Service Agent
  - Cloud Datastore User (for Firestore access)

## Security Best Practices

1. ✅ **DO**: Use GitHub Secrets for all sensitive data
2. ✅ **DO**: Add credential files to `.gitignore`
3. ✅ **DO**: Rotate credentials regularly
4. ✅ **DO**: Use separate service accounts for different environments
5. ❌ **DON'T**: Commit credentials to the repository
6. ❌ **DON'T**: Share credentials in chat or emails
7. ❌ **DON'T**: Store credentials in code comments
8. ❌ **DON'T**: Log or print credentials in console/logs

## Need Help?

If you encounter issues:
1. Check the GitHub Actions logs for specific error messages
2. Verify the service account JSON format
3. Ensure the service account has proper permissions in Firebase Console
4. Test locally with `node scripts/migrate-categories.js` after setting up local credentials
