# IONE AlumaTech Industries - B2B Platform

A lightweight, high-performance B2B e-commerce platform for aluminum construction products, built with vanilla HTML, CSS, and JavaScript for maximum speed and minimal bundle size.

![IONE Platform](https://github.com/user-attachments/assets/5c41a650-71e7-4a06-94f9-93c64f3e2159)

## 🎯 Overview

IONE is a modern B2B platform connecting buyers and sellers in the aluminum manufacturing industry. Built with vanilla JavaScript, Firebase, and a stunning neon-themed UI, it provides a complete solution for product management, orders, invoices, and business operations.

**Performance First**: 90% smaller bundle size compared to React, with 59KB total (11KB gzipped) for blazing fast load times.

## ✨ Features

### Authentication & User Management
- **Email/Password Authentication** - Secure user registration and login
- **Google Sign-In** - One-click authentication with Google
- **Role-Based Access** - Separate experiences for buyers and sellers
- **Protected Routes** - Secure page access based on authentication

### Buyer Features
- **Product Catalog** - Browse and search aluminum products
- **Shopping Cart** - Add products, adjust quantities, checkout
- **Order Management** - Track orders with status updates
- **Invoice Generation** - View and download invoices
- **Seller Directory** - Find and connect with sellers
- **Support System** - Get help and submit tickets

### Seller Features
- **Product Management** - Add, edit, and delete products
- **Order Processing** - Manage customer orders
- **Invoice Creation** - Generate professional invoices
- **Branch Management** - Manage multiple business locations
- **Dashboard Analytics** - View sales and performance metrics

### Shared Features
- **Profile Management** - Update personal and company information
- **Notifications** - Real-time updates and alerts
- **Responsive Design** - Works on all devices
- **Modern UI** - Neon cyan and electric blue theme

## 🚀 Technology Stack

### Frontend
- **Vanilla JavaScript (ES6+)** - No framework overhead
- **Custom SPA Router** - History API-based routing
- **Vite** - Fast build tool and dev server
- **Lucide Icons** - Beautiful icons (via CDN)
- **Custom Toast System** - User notifications

### Backend (Firebase)
- **Firebase Authentication** - User management
- **Cloud Firestore** - NoSQL database
- **Firebase Storage** - File storage
- **Firebase Hosting** - Deployment platform

### Styling
- **CSS3** - Modern CSS with variables
- **Custom Design System** - IONE theme with neon colors
- **Responsive Layout** - Mobile-first approach
- **Google Fonts** - Manrope and Sora typography

## 📁 Project Structure

```
aluminum-website/
├── public/
│   ├── js/                    # JavaScript modules
│   │   ├── app.js            # Main application entry
│   │   ├── router.js         # SPA routing system
│   │   ├── auth.js           # Authentication manager
│   │   ├── config.js         # Firebase configuration
│   │   └── layout.js         # Layout component
│   ├── pages/                # Page modules (19 files)
│   │   ├── landing.js
│   │   ├── login.js
│   │   ├── signup.js
│   │   ├── buyer-dashboard.js
│   │   ├── seller-dashboard.js
│   │   ├── catalog.js
│   │   ├── cart.js
│   │   ├── orders.js
│   │   └── ... (11+ more pages)
│   └── css/                  # Stylesheets
│       ├── main.css
│       ├── LandingPage.css
│       ├── AuthPages.css
│       ├── Dashboard.css
│       ├── Layout.css
│       └── Pages.css
├── index.html               # Main HTML file
├── vite.config.js          # Vite configuration
└── package.json            # Dependencies (minimal)
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Firebase account (for backend services)

### 1. Clone the Repository
```bash
git clone https://github.com/ione2025/aluminum-website.git
cd aluminum-website
```

### 2. Install Dependencies
```bash
npm install
```

Note: Only 2 dev dependencies (Vite and Terser) - no framework dependencies!

### 3. Firebase Configuration
Create a Firebase project at [Firebase Console](https://console.firebase.google.com/):

1. Enable Authentication (Email/Password and Google)
2. Create a Firestore database
3. Enable Firebase Storage
4. Copy your Firebase config

Update `public/js/config.js` with your credentials:
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:5173/](http://localhost:5173/)

### 5. Build for Production

**For custom domain deployment (e.g., ione.live):**
```bash
npm run build
```

**For GitHub Pages deployment:**
```bash
VITE_BASE_PATH=/aluminum-website/ npm run build
```

Production build: 59KB total, 11KB gzipped ⚡

### 6. Preview Production Build
```bash
npm run preview
```

## 🌐 Deployment

### Custom Domain Deployment

The project is configured by default to deploy to a root domain (e.g., `ione.live`). Simply build and deploy the `dist` folder to your hosting provider:

```bash
npm run build
# Deploy the dist folder to your hosting provider
```

### GitHub Pages (Automated)

The project includes a GitHub Actions workflow that automatically deploys to GitHub Pages when you push to the main branch. The workflow is pre-configured with the correct base path.

**Enable GitHub Pages:**
1. Go to repository Settings > Pages
2. Set Source to "GitHub Actions"
3. Push to main branch
4. Your site will be live at `https://[username].github.io/aluminum-website/`

### Firebase Hosting

⚠️ **IMPORTANT**: You MUST build the project before deploying to Firebase!

```bash
# 1. Install dependencies (first time only)
npm install

# 2. Build the project (creates dist/ folder)
npm run build

# 3. Install Firebase CLI (first time only)
npm install -g firebase-tools

# 4. Login to Firebase
firebase login

# 5. Initialize Firebase hosting (first time only)
# When prompted:
# - Select your project: gen-lang-client-0988357303
# - Public directory: dist
# - Single-page app: Yes
# - Overwrite index.html: No
firebase init hosting

# 6. Deploy to Firebase Hosting
firebase deploy --only hosting

# OR deploy everything (hosting + rules)
firebase deploy
```

**Note**: The `dist/` folder is generated by `npm run build` and contains the production-ready files. Firebase serves files from this folder, not from the `public/` folder.

## 🎨 Design System

### Colors
```css
--neon-cyan: #00FFFF
--electric-blue: #0080FF
--dark-bg: #0a0e27
--card-bg: #131829
--border-color: #1e2642
```

### Typography
- **Headings**: Sora (400, 600, 700)
- **Body**: Manrope (300-700)

### Components
- Border radius: 8px (buttons), 12px (cards)
- Transitions: 0.3s ease
- Shadows: Neon glow effects

## 📚 Documentation Files

The repository includes comprehensive documentation:

- **VANILLA_JS_GUIDE.md** - Complete guide for the vanilla JS architecture
- **WEBSITE_REBUILD_PROMPT.md** - Complete technical specifications
- **QUICK_REBUILD_GUIDE.md** - Fast-track implementation guide
- **ARCHITECTURE_DIAGRAM.md** - Visual system architecture
- **DOCUMENTATION_INDEX.md** - Navigation guide for all docs

**Note**: The original React source code is preserved in the `src/` directory for reference.

## 📊 Performance Metrics

### Bundle Size Comparison
| Metric | React Version | Vanilla JS | Improvement |
|--------|--------------|------------|-------------|
| Total Bundle | ~625KB | 59KB | 90% smaller |
| Gzipped | ~195KB | 11KB | 94% smaller |
| Dependencies | 251 packages | 2 packages | 99% fewer |
| Build Time | 6.25s | 0.456s | 93% faster |

### Page Load Performance
- **First Contentful Paint**: <0.5s
- **Time to Interactive**: <1s
- **Total Blocking Time**: Minimal
- **Cumulative Layout Shift**: 0

## 🔐 Firebase Security

### Deploy Security Rules

Deploy both Firestore and Storage security rules:

```bash
# Deploy both Firestore and Storage rules
firebase deploy --only firestore:rules,storage

# Or deploy individually
firebase deploy --only firestore:rules
firebase deploy --only storage
```

### Security Documentation

- **`storage.rules`** - Firebase Storage security rules (seller-specific folders, no generic paths)
- **`STORAGE_RULES_GUIDE.md`** - Complete storage rules documentation
- **`STORAGE_RULES_SOLUTION.md`** - How storage rules work with dynamic categories
- **`FIRESTORE_SECURITY_RULES.md`** - Firestore rules documentation
- **`FIREBASE_RULES_UPDATE.md`** - Latest rules updates and recommendations

### Key Security Features

- ✅ **Seller Isolation** - Each seller can only upload to their own folder
- ✅ **No Generic Paths** - Generic uploads blocked at the rules level
- ✅ **Dynamic Categories** - Categories stored in Firestore, not storage paths
- ✅ **File Validation** - Type and size limits enforced
- ✅ **Role-Based Access** - Proper authentication and authorization
```

## 🧪 Testing

### Manual Testing
1. Sign up with email/password
2. Test Google sign-in
3. Browse product catalog
4. Add items to cart
5. Create orders
6. Test role switching (buyer/seller)

### Test Accounts
Create test accounts in Firebase Console for development.

## 📱 Browser Support

Works in all modern browsers supporting:
- ES6+ JavaScript (const, let, arrow functions, template literals)
- Promises and async/await
- History API
- Fetch API
- CSS Grid and Flexbox

Tested on:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🚀 Why Vanilla JavaScript?

This project was converted from React to vanilla JavaScript to achieve:

1. **Performance**: 90% smaller bundle size = faster load times
2. **Simplicity**: No framework complexity, easier to understand and maintain
3. **Compatibility**: Works everywhere without build steps
4. **Cost**: Lower bandwidth and hosting costs
5. **Learning**: Perfect example of SPA without frameworks

## 🤝 Contributing

This is a demonstration project built from documentation. Feel free to fork and customize for your needs.

## 📄 License

This project is built based on the IONE platform documentation.

## 🆘 Support

For questions or issues:
- Review the documentation files in the repository
- Check Firebase Console for backend issues
- Verify all dependencies are installed correctly

## 🎉 Success Criteria

The platform is ready when you can:
- ✅ Sign up and login (both roles)
- ✅ Navigate all pages without errors
- ✅ View mock data in dashboards
- ✅ Access site on GitHub Pages
- ✅ Responsive on mobile devices

## 📸 Screenshots

### Login Page
![Login Page](https://github.com/user-attachments/assets/55b019d0-3c40-4f90-9d24-b1215aece50a)

### Signup Page
![Signup Page](https://github.com/user-attachments/assets/e6c7b6fd-c4f9-4b84-971a-6343e5ff3721)

---

**Built with ❤️ for the aluminum manufacturing industry**
