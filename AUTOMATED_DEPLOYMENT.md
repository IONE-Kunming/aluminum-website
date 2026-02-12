# Automated Deployment and Migration Guide

This guide explains how to automatically migrate the database and deploy the application using GitHub Actions.

## Quick Start - Automated Migration & Deployment

### Option 1: Full Deployment with Migration (Recommended)

1. **Go to GitHub Actions:**
   - Navigate to your repository on GitHub
   - Click on the "Actions" tab
   - Find "Deploy with Category Migration" workflow

2. **Run the workflow:**
   - Click "Run workflow" button
   - Select the branch: `copilot/update-dashboard-and-filters`
   - Check "Run database migration before deployment": `✓ Yes`
   - Click "Run workflow"

3. **Monitor progress:**
   - Watch the workflow execution in real-time
   - Migration will run first, then deployment
   - Total time: ~5-10 minutes

4. **Verify deployment:**
   - Check workflow logs for success messages
   - Visit: https://gen-lang-client-0988357303.web.app
   - Test category navigation and product features

### Option 2: Run Migration Only (No Deployment)

If you only want to migrate the database without deploying:

1. **Go to GitHub Actions:**
   - Navigate to Actions tab
   - Find "Migrate Product Categories" workflow

2. **Run the workflow:**
   - Click "Run workflow" button
   - Select the branch
   - Click "Run workflow"

3. **Check results:**
   - View logs to see migration summary
   - Verify in Firebase Console

## What Each Workflow Does

### Deploy with Category Migration

**Steps:**
1. ✅ Checks out code
2. 🗃️ Runs database migration script
   - Updates all products with mainCategory and subcategory
   - Processes in batches of 500
   - Shows detailed progress
3. 📦 Installs dependencies
4. 🔨 Builds application with Vite
5. 🚀 Deploys to Firebase Hosting
6. ✅ Confirms successful deployment

**Use when:** You want to migrate database AND deploy code changes together.

### Migrate Product Categories

**Steps:**
1. ✅ Checks out code
2. 📦 Installs firebase-admin
3. 🗃️ Runs migration script
4. 📊 Shows migration summary

**Use when:** You only want to update the database without deploying code changes.

## Migration Details

The migration script will:
- ✅ Update all products with proper category structure
- ✅ Add `mainCategory` field (e.g., "Construction")
- ✅ Add `subcategory` field (e.g., "Exterior Gates")
- ✅ Keep existing `category` field for backward compatibility
- ✅ Skip products already migrated
- ✅ Process in batches for performance
- ✅ Show detailed progress and summary

## Post-Deployment Verification

After deployment completes, verify:

1. **Category Navigation:**
   - Go to Product Catalog
   - Verify 30 main categories appear
   - Click Construction → verify subcategories
   - Click a subcategory → verify sellers display

2. **Product Upload:**
   - Go to My Products (seller account)
   - Try bulk import with sample CSV
   - Verify validation works for categories

3. **Dashboard:**
   - Check Total Spent tile displays correctly
   - Verify invoice filters work

4. **Support:**
   - Test support form submission
   - Verify mailto link opens email client

## Troubleshooting

### Migration fails
- Check workflow logs for specific errors
- Verify Firebase service account permissions
- Ensure all products have required fields

### Deployment fails
- Check build logs for errors
- Verify all dependencies installed
- Check Firebase hosting configuration

### Categories not showing
- Verify migration completed successfully
- Check browser console for errors
- Clear browser cache and reload

## Manual Deployment (Alternative)

If you prefer manual deployment:

```bash
# 1. Build the application
npm run build

# 2. Deploy to Firebase
firebase deploy --only hosting
```

For manual migration, see `MIGRATION_INSTRUCTIONS.md`.

## Support

- Workflow logs: GitHub Actions tab
- Firebase Console: https://console.firebase.google.com
- Application: https://gen-lang-client-0988357303.web.app

For issues, check the workflow logs first, then contact: contactus@ione.live
