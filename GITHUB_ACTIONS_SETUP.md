# GitHub Actions Setup Guide

This guide explains how to configure GitHub Actions for automatic deployment of Firebase resources.

## Firebase Deployment Workflow

The `.github/workflows/firebase-hosting.yml` workflow automatically deploys the following to Firebase when code is pushed to the `main` branch:

- **Firebase Hosting** - The built website
- **Firestore Rules** - Database security rules
- **Firestore Indexes** - Database query indexes
- **Storage Rules** - Cloud Storage security rules

## Setup Instructions

### 1. Generate Firebase CI Token

Run this command locally (requires Firebase CLI):

```bash
firebase login:ci
```

This will:
1. Open a browser for authentication
2. Generate a CI token after successful login
3. Display the token in your terminal

**Important:** Save this token securely - you'll need it for the next step.

### 2. Add Token to GitHub Secrets

1. Go to your GitHub repository
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the secret:
   - **Name:** `FIREBASE_TOKEN`
   - **Value:** (paste the token from step 1)
5. Click **Add secret**

### 3. Verify Setup

After adding the secret:

1. Push a change to the `main` branch
2. Go to the **Actions** tab in your GitHub repository
3. Check that the "Deploy to Firebase" workflow runs successfully
4. Verify your changes are deployed to Firebase

## Workflow Triggers

The Firebase deployment workflow runs when:

- Code is pushed to the `main` branch AND
- Changes are made to any of these files/folders:
  - `public/**`
  - `index.html`
  - `vite.config.js`
  - `package.json`
  - `package-lock.json`
  - `firebase.json`
  - `firestore.rules`
  - `firestore.indexes.json`
  - `storage.rules`
  - `.github/workflows/firebase-hosting.yml`

You can also trigger it manually:
1. Go to **Actions** tab
2. Select "Deploy to Firebase" workflow
3. Click "Run workflow"

## Manual Deployment (Alternative)

If you prefer manual deployment, you can still use:

```bash
# Deploy everything
npm run deploy:all

# Deploy only hosting
npm run deploy

# Deploy specific services
firebase deploy --only firestore
firebase deploy --only storage
firebase deploy --only hosting
```

## Dual Deployment Setup

This project maintains two separate deployments:

1. **GitHub Pages** (`.github/workflows/jekyll-gh-pages.yml`)
   - URL: https://ione-kunming.github.io/aluminum-website/
   - Base path: `/aluminum-website/`
   - Static hosting only (no backend)

2. **Firebase Hosting** (`.github/workflows/firebase-hosting.yml`)
   - Base path: `/`
   - Full stack deployment (hosting + backend rules)
   - Includes Firestore rules and indexes

Both workflows run independently and deploy to their respective platforms.

## Troubleshooting

### Deployment Fails with Authentication Error

**Problem:** Workflow fails with "Authentication error" or "Invalid token"

**Solution:**
1. Regenerate the Firebase CI token: `firebase login:ci`
2. Update the `FIREBASE_TOKEN` secret in GitHub
3. Re-run the workflow

### Firestore Rules Not Updating

**Problem:** Changes to `firestore.rules` don't appear in Firebase Console

**Solution:**
1. Check the workflow run logs in the Actions tab
2. Verify the deployment step completed successfully
3. Check Firebase Console → Firestore → Rules to confirm update timestamp
4. Rules may take 1-2 minutes to propagate globally

### Workflow Not Triggering

**Problem:** Push to main branch doesn't trigger deployment

**Solution:**
1. Verify changes were made to files listed in the `paths` filter
2. Check that you pushed to the `main` branch (not a different branch)
3. Check the Actions tab for any errors or restrictions

## Security Notes

- Keep your `FIREBASE_TOKEN` secret secure
- Never commit the token to the repository
- Rotate the token periodically for security
- Use Firebase security rules to protect your data

## Additional Resources

- [Firebase CLI Documentation](https://firebase.google.com/docs/cli)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
