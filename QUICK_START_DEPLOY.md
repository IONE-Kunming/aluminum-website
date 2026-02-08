# Quick Start - Deploy to Firebase

## 🚀 Quick Deploy (Single Command)

If you just want to deploy quickly without reading all the documentation:

```bash
./deploy.sh
```

This script will:
1. Install dependencies if needed
2. Build the project
3. Check Firebase authentication
4. Deploy to Firebase Hosting

## 📋 Manual Steps (If you prefer)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Build the Project
```bash
npm run build
```

### Step 3: Deploy to Firebase
```bash
# Deploy hosting only
firebase deploy --only hosting

# OR deploy everything (hosting + rules)
firebase deploy
```

## 🔍 Verify Deployment

After deployment, open your website:
- Primary URL: https://gen-lang-client-0988357303.web.app
- Secondary URL: https://gen-lang-client-0988357303.firebaseapp.com

Check browser console (F12) for any errors.

## ⚠️ Troubleshooting

### "vite: not found"
```bash
npm install
npm run build
```

### "Cannot GET /" or blank page
The site wasn't built before deployment. Run:
```bash
npm run build
firebase deploy --only hosting
```

### Firebase authentication error
```bash
firebase login
```

### Wrong Firebase project
Check `.firebaserc` file - it should show:
```json
{
  "projects": {
    "default": "gen-lang-client-0988357303"
  }
}
```

## 📚 Need More Help?

Read the comprehensive guide:
- `FIREBASE_DEPLOYMENT_GUIDE.md` - Complete deployment documentation
- `README.md` - General project documentation

## 🔐 Security Rules

To deploy Firestore and Storage security rules:
```bash
firebase deploy --only firestore:rules,storage
```

Or deploy everything at once:
```bash
firebase deploy
```

## 🎯 Summary

**The most common issue**: Deploying without building first!

**Always remember:**
1. ✅ `npm install` (first time only)
2. ✅ `npm run build` (creates the dist/ folder)
3. ✅ `firebase deploy --only hosting` (deploys the dist/ folder)

That's it! 🎉
