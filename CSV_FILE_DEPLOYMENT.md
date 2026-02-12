# CSV File Deployment Documentation

## Overview
The sample products import CSV file is deployed as a static asset via Firebase Hosting. This document explains the deployment process and service account requirements.

## File Location
- **Source:** `public/sample-products-import.csv`
- **Build Output:** `dist/sample-products-import.csv`
- **Deployed URL:** `https://gen-lang-client-0988357303.web.app/sample-products-import.csv`
- **Download Link:** Referenced in Products page at `/sample-products-import.csv`

## How It Works

### 1. Build Process (Vite)
The CSV file is copied from `public/` to `dist/` during the build process using a custom Vite plugin:

```javascript
// vite.config.js (lines 15-32)
{
  name: 'copy-csv',
  closeBundle() {
    mkdirSync('dist', { recursive: true })
    copyFileSync(
      resolve(__dirname, 'public/sample-products-import.csv'),
      resolve(__dirname, 'dist/sample-products-import.csv')
    )
    console.log('✓ Copied sample-products-import.csv to dist/')
  }
}
```

### 2. GitHub Actions Verification
The deployment workflow verifies the CSV file exists before deploying:

```yaml
# .github/workflows/firebase-hosting.yml (lines 24-37)
- name: Verify CSV file in dist
  run: |
    echo "Verifying CSV file was built correctly..."
    if [ -f "dist/sample-products-import.csv" ]; then
      echo "✓ CSV file found in dist/"
      ls -lh dist/sample-products-import.csv
      echo "CSV file contents (first 3 lines):"
      head -n 3 dist/sample-products-import.csv
    else
      echo "✗ CSV file NOT found in dist/"
      exit 1
    fi
```

### 3. Firebase Hosting
Firebase Hosting serves the CSV file as a static asset with proper headers:

```json
// firebase.json
{
  "hosting": {
    "public": "dist",
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.csv",
        "headers": [
          {
            "key": "Content-Type",
            "value": "text/csv"
          },
          {
            "key": "Content-Disposition",
            "value": "attachment; filename=\"sample-products-import.csv\""
          },
          {
            "key": "Cache-Control",
            "value": "public, max-age=3600"
          }
        ]
      }
    ]
  }
}
```

**Important:** Firebase Hosting serves static files BEFORE evaluating rewrite rules. The CSV file will be served directly even though there's a catch-all rewrite to index.html.

## Service Account Requirements

The deployment uses the `FIREBASE_SERVICE_ACCOUNT` secret which should contain credentials for the **firebase-deploy** service account.

### Required Service Account
**Email:** `firebase-deploy@gen-lang-client-0988357303.iam.gserviceaccount.com`

### Required Permissions
- **Firebase Admin** - For deploying hosting content
- **Cloud Datastore Owner** - For deploying Firestore rules and indexes
- **Service Usage Consumer** - For API usage
- **Storage Admin** - For future storage rules deployment

### Current Service Accounts

1. **firebase-adminsdk-fbsvc** (Admin SDK operations)
   - Firebase Admin SDK Administrator Service Agent
   - Firebase Authentication Admin
   - Firebase Realtime Database Admin
   - Service Account Token Creator
   - Service Usage Consumer
   - Storage Admin

2. **firebase-deploy** (Deployment operations) ✅ Use this for GitHub Actions
   - Cloud Datastore Owner
   - Firebase Admin
   - Service Account User
   - Service Usage Consumer
   - Storage Admin

## Deployment Command
```bash
firebase deploy --only firestore:rules,firestore:indexes,hosting \
  --project gen-lang-client-0988357303 \
  --non-interactive \
  --force
```

The `--force` flag is used to skip Firebase rules validation which requires additional API permissions.

## Verification Steps

### Before Deployment (Local)
```bash
# 1. Verify CSV exists in source
cat public/sample-products-import.csv

# 2. Build the project
npm run build

# 3. Verify CSV was copied to dist
ls -la dist/sample-products-import.csv

# 4. Test locally
npm run preview
curl http://localhost:4173/sample-products-import.csv
```

### After Deployment
1. Wait 2-3 minutes for CDN propagation
2. Access the file: `https://gen-lang-client-0988357303.web.app/sample-products-import.csv`
3. Verify it downloads correctly from the Products page
4. Check in incognito/private mode to avoid cache

## Troubleshooting

### Issue: CSV file returns HTML instead of CSV content
**Cause:** File doesn't exist in dist/ folder  
**Solution:** 
```bash
npm run build
ls -la dist/sample-products-import.csv
```

### Issue: CSV file not found after deployment
**Causes:**
1. **Deployment failed** - Check GitHub Actions logs
2. **CDN caching** - Wait 5-10 minutes, try incognito mode
3. **File not in git** - Verify with `git ls-files public/sample-products-import.csv`
4. **Build didn't copy file** - Check build logs for "Copied sample-products-import.csv"

**Solutions:**
```bash
# Verify file is tracked in git
git ls-files | grep csv

# Force a new build
rm -rf dist node_modules
npm install
npm run build

# Check if file exists in dist
ls -la dist/*.csv
```

### Issue: Service account permission errors
**Cause:** Wrong service account or missing permissions  
**Solution:** Ensure `FIREBASE_SERVICE_ACCOUNT` secret contains the **firebase-deploy** service account key with required permissions listed above.

## Important Notes

1. **DO NOT** add `*.csv` to `.gitignore` - The CSV must be tracked in git
2. **DO NOT** remove the copy plugin from `vite.config.js`
3. **DO NOT** delete the verification step from GitHub Actions workflow
4. **DO** keep the CSV file in `public/` folder (not `src/`)
5. **DO** use the **firebase-deploy** service account for GitHub Actions deployments
6. **CSV is NOT in Firebase Storage** - It's served from Firebase Hosting as a static file

## File Content
The CSV contains sample product data across 30 categories with the following structure:
```csv
Model Number,Category,Subcategory,Price per Meter,Image Path
AL-6061-T6-001,Construction,Exterior Gates,25.50,product1.jpg
AL-6061-T6-002,Construction,Fences,30.75,product2.jpg
...
```

Total: 30 sample products covering all major product categories.

## Related Files
- `public/sample-products-import.csv` - Source file
- `vite.config.js` - Build configuration with copy plugin
- `firebase.json` - Hosting configuration with CSV headers
- `.github/workflows/firebase-hosting.yml` - Deployment workflow
- `public/pages/products.js` - Download link implementation (line 204)
