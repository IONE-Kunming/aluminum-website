# Asset 404 Error Fix - Deployment Guide

## Problem Statement
When accessing the website at `http://ione.live`, the browser console showed 404 errors:
```
GET http://ione.live/aluminum-website/assets/main-CjoVMYvH.css net::ERR_ABORTED 404 (Not Found)
GET http://ione.live/aluminum-website/assets/main-BVaqjn1g.js net::ERR_ABORTED 404 (Not Found)
```

## Root Cause
The website is deployed to the **root** of the `ione.live` custom domain, but the Vite build configuration had:
```javascript
base: '/aluminum-website/'
```

This configuration is correct for GitHub Pages (where the site is at `username.github.io/aluminum-website/`), but incorrect for a custom domain deployment at the root. It caused all asset paths to include the unnecessary `/aluminum-website/` prefix.

## Solution
Made the base path configurable to support both deployment scenarios:

### 1. Custom Domain Deployment (ione.live) - DEFAULT
Assets are served from the root path:
```
http://ione.live/assets/main-xxx.js
http://ione.live/assets/main-xxx.css
```

### 2. GitHub Pages Deployment
Assets are served from a subdirectory:
```
https://username.github.io/aluminum-website/assets/main-xxx.js
https://username.github.io/aluminum-website/assets/main-xxx.css
```

## Implementation Details

### vite.config.js
```javascript
// Use environment variable for base path, defaults to '/' for custom domain deployments
// Set VITE_BASE_PATH=/aluminum-website/ for GitHub Pages deployments
base: process.env.VITE_BASE_PATH || '/',
```

### GitHub Actions Workflow (.github/workflows/deploy.yml)
```yaml
- name: Build
  run: npm run build
  env:
    VITE_BASE_PATH: /aluminum-website/
```

## How to Build

### For Custom Domain (ione.live, etc.)
Simply run:
```bash
npm run build
```
This will use the default base path `/` and assets will be accessible at the root.

### For GitHub Pages
The GitHub Actions workflow automatically sets the correct base path:
```bash
VITE_BASE_PATH=/aluminum-website/ npm run build
```

Or manually:
```bash
VITE_BASE_PATH=/aluminum-website/ npm run build
```

## Verification

### Before Fix
- Asset paths: `/aluminum-website/assets/main-xxx.js`
- Result on ione.live: **404 Not Found** ❌

### After Fix
- Asset paths: `/assets/main-xxx.js`
- Result on ione.live: **200 OK** ✅

## Testing
1. Build the project: `npm run build`
2. Check `dist/index.html` for asset paths
3. Preview locally: `npm run preview`
4. Access at `http://localhost:4173/`
5. Verify assets load without errors

## Deployment Checklist

### Custom Domain Deployment
- [ ] Build with default settings: `npm run build`
- [ ] Deploy `dist/` folder to root of domain
- [ ] Access site and verify no 404 errors in console
- [ ] Verify all pages load correctly

### GitHub Pages Deployment
- [ ] Push to main/master branch
- [ ] GitHub Actions workflow runs automatically
- [ ] Site deploys to `username.github.io/aluminum-website/`
- [ ] Verify no 404 errors in console

## Backward Compatibility
✅ This change is backward compatible:
- GitHub Pages deployment: Still works via workflow environment variable
- Custom domain deployment: Now works correctly with default configuration
- Development mode: Works at `localhost:5173/` (root path)

## Support
For any deployment issues:
1. Check the browser console for 404 errors
2. Verify the asset paths in `dist/index.html` match your deployment structure
3. Ensure the base path configuration matches your hosting setup
