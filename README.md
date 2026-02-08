# I ONE Construction - Aluminum Trading Platform

A modern B2B construction products trading platform built with Vanilla JavaScript, Vite, and Firebase.

## 🚀 Dual Deployment Setup

This project supports **two separate deployments** that work simultaneously:

### 1. GitHub Pages Deployment
- **URL**: https://ione-kunming.github.io/aluminum-website/
- **Base Path**: `/aluminum-website/`
- **Automated**: Via GitHub Actions on push to `main` branch
- **Configuration**: `.github/workflows/jekyll-gh-pages.yml`

### 2. Firebase Hosting Deployment
- **Base Path**: `/` (root)
- **Manual**: Run `npm run deploy` to deploy
- **Configuration**: `firebase.json`

## 📦 How It Works

The project uses Vite's `base` configuration to support different base paths:

```javascript
// vite.config.js
base: process.env.VITE_BASE_PATH || '/'
```

- **GitHub Pages**: Built with `VITE_BASE_PATH=/aluminum-website/` (automatic via GitHub Actions)
- **Firebase**: Built with default `/` base path (no environment variable)

Each deployment builds independently with the correct base path, so **both deployments work correctly**.

## 🛠️ Development

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
# For Firebase (root path)
npm run build

# For GitHub Pages (with /aluminum-website/ prefix)
VITE_BASE_PATH=/aluminum-website/ npm run build
```

### Clean Build Directory
```bash
npm run clean
```

## 🔥 Firebase Deployment

### Deploy to Firebase Hosting
```bash
npm run deploy
```

This command:
1. Builds the project with `/` as base path
2. Deploys to Firebase Hosting

### Deploy All Firebase Services
```bash
npm run deploy:all
```

Deploys hosting, Firestore rules, and Storage rules.

## 📝 Project Structure

```
aluminum-website/
├── public/              # Static assets and application code
│   ├── js/              # JavaScript modules
│   ├── css/             # Stylesheets
│   ├── pages/           # Page-specific modules
│   └── 404.html         # GitHub Pages SPA fallback
├── dist/                # Build output directory (gitignored)
├── index.html           # Main HTML file
├── vite.config.js       # Vite configuration
├── firebase.json        # Firebase configuration
├── firestore.rules      # Firestore security rules
└── storage.rules        # Cloud Storage security rules
```

## 🔐 Firebase Configuration

The project uses Firebase for:
- **Authentication**: User login and registration
- **Firestore**: Database for products, orders, users
- **Cloud Storage**: Image uploads for products
- **Hosting**: Static site hosting

## 📱 Features

- Multi-seller marketplace
- Product catalog with categories
- Shopping cart functionality
- Order management
- User authentication (Buyer/Seller roles)
- Admin dashboard
- Invoice generation
- Responsive design

## 🧪 Testing

The project includes Firebase emulators for local development and testing.

## 📄 License

This project is private and proprietary.
