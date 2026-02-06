# Complete Website Rebuild Prompt - IONE AlumaTech Industries B2B Platform

This document provides a comprehensive guide to rebuild the IONE AlumaTech Industries B2B e-commerce platform from scratch with all features, functionality, and technical specifications.

---

## 🎯 Project Overview

### Business Purpose
Build a modern B2B e-commerce platform for aluminum construction products that connects buyers and sellers globally. The platform enables:
- **Buyers**: Browse products, place orders, manage invoices, track shipments, and communicate with sellers
- **Sellers**: List products, manage inventory, process orders, and handle customer relationships
- **Platform**: Facilitate secure transactions, provide analytics, and ensure seamless B2B operations

### Project Name
**IONE AlumaTech Industries** - Global B2B CRM & E-Commerce Platform for Aluminum Manufacturing

### Live Domain
`ione.live` (with HTTPS configured)

---

## 🏗️ Technology Stack

### Frontend
- **Framework**: React 19.2.4 (Single Page Application)
- **Router**: React Router DOM 7.13.0
- **Build Tool**: Vite 7.3.1
- **Styling**: CSS3 with CSS Variables (no CSS frameworks)
- **Fonts**: Google Fonts - Manrope (300-700) and Sora (400-700)
- **Icons**: Lucide React 0.563.0
- **Notifications**: Sonner 2.0.7 (toast notifications)

### Backend
- **Runtime**: Node.js with Express.js 4.18.2
- **Database**: PostgreSQL 8.11.3
- **Authentication**: JSON Web Tokens (JWT) 9.0.2 + bcrypt 5.1.1
- **Security**: Helmet 7.1.0, CORS 2.8.5, Express Rate Limit 7.1.5
- **Logging**: Morgan 1.10.0

### Firebase Integration
- **Authentication**: Email/Password + Google Sign-In
- **Database**: Cloud Firestore (NoSQL)
- **Storage**: Firebase Storage (for product images and CAD files)
- **Analytics**: Firebase Analytics
- **Hosting**: Firebase Hosting with custom domain

### 3D CAD Viewer
- **Rendering**: Three.js (for 3D visualization)
- **CAD Parsing**: 
  - @mlightcad/libredwg-web 0.6.6 (DWG files)
  - dxf-parser 1.1.2 (DXF files)
  - three-dxf-loader 5.2.0 (3D rendering)

### Development Tools
- **Concurrent Execution**: Concurrently 8.2.2 (run frontend + backend)
- **Hot Reload**: Nodemon 3.0.2 (backend development)
- **Environment Variables**: dotenv 16.3.1

---

## 📁 Project Structure

```
ALUMINUMFRAMEWORK/
├── index.html                    # Main entry (redirects to React app)
├── index-react.html              # React SPA entry point
├── buyer_files/                  # Production build output
│   ├── index-react-*.js         # Main React bundle (395KB)
│   ├── react-vendor-*.js        # React libraries (46KB)
│   ├── firebase-vendor-*.js     # Firebase SDK (357KB)
│   ├── icons-*.js               # Lucide icons (9.72KB)
│   └── index-react-*.css        # Compiled styles (161KB)
├── src/                         # React source code
│   ├── App.jsx                  # Main app router
│   ├── main.jsx                 # React entry point
│   ├── pages/                   # Page components (15 files)
│   │   ├── BuyerDashboard.jsx
│   │   ├── SellerDashboard.jsx
│   │   ├── LoginPage.jsx
│   │   ├── SignupPage.jsx
│   │   ├── OrdersPage.jsx
│   │   ├── InvoicesPage.jsx
│   │   ├── ProfilePage.jsx
│   │   ├── SellersPage.jsx
│   │   ├── BranchesPage.jsx
│   │   ├── SupportPage.jsx
│   │   ├── NotificationsPage.jsx
│   │   ├── CatalogPage.jsx
│   │   ├── ProfileSelectionPage.jsx
│   │   └── SellerOrdersPage.jsx
│   ├── components/              # Reusable components
│   │   ├── Layout.jsx           # Main layout wrapper
│   │   └── ProtectedRoute.jsx   # Route authentication
│   ├── context/                 # React Context providers
│   │   ├── AuthContext.jsx      # Auth state management
│   │   └── FirebaseContext.jsx  # Firebase initialization
│   ├── styles/                  # CSS modules
│   └── utils/                   # Utility functions
├── backend/                     # Express.js backend
│   ├── src/
│   │   ├── server.js           # Express server
│   │   ├── config/             # Database, JWT config
│   │   ├── controllers/        # Business logic
│   │   ├── middleware/         # Auth, validation
│   │   ├── models/             # PostgreSQL models
│   │   ├── routes/             # API endpoints
│   │   └── utils/              # Helper functions
│   └── package.json            # Backend dependencies
├── firebase-config.js          # Firebase credentials
├── firebase-service.js         # Firestore/Storage operations
├── cad-viewer.js              # 3D CAD viewer class
├── firestore.rules            # Security rules
├── storage.rules              # Storage security
├── firebase.json              # Hosting configuration
├── .htaccess                  # Apache rewrites
├── vite.config.js             # Vite build config
├── package.json               # Frontend dependencies
└── .env.example               # Environment template
```

---

## 🎨 UI/UX Design Specifications

### Design System

#### Color Palette
```css
--neon-cyan: #00FFFF;         /* Primary accent */
--electric-blue: #0080FF;     /* Secondary accent */
--dark-bg: #0a0e27;           /* Main background */
--card-bg: #131829;           /* Card background */
--border-color: #1e2539;      /* Borders */
--text-primary: #ffffff;      /* Primary text */
--text-secondary: #94a3b8;    /* Secondary text */
--success: #10b981;           /* Success states */
--error: #ef4444;             /* Error states */
--warning: #f59e0b;           /* Warning states */
```

#### Typography
```css
/* Primary Font */
font-family: 'Sora', sans-serif;

/* Secondary Font */
font-family: 'Manrope', sans-serif;

/* Weights: 300, 400, 500, 600, 700 */
```

#### Component Styles

**Buttons**
- Primary: Gradient background (cyan to blue)
- Hover: Glow effect with box-shadow
- Border-radius: 8px
- Padding: 12px 24px
- Transition: 0.3s all

**Cards**
- Background: card-bg
- Border: 1px solid border-color
- Border-radius: 12px
- Box-shadow: Subtle shadow
- Hover: Lift effect

**Forms**
- Input background: Dark with border
- Focus: Cyan border glow
- Border-radius: 8px
- Padding: 12px 16px

**Sidebar**
- Width: 280px (desktop), collapsible on mobile
- Fixed position
- Dark background with gradient overlay
- Smooth transitions

### Layout Structure

**Dashboard Layout**
```
┌─────────────────────────────────────────┐
│ Header (Logo + User Profile + Actions) │
├─────────┬───────────────────────────────┤
│         │                               │
│ Sidebar │   Main Content Area          │
│ Nav     │   (Dashboard Cards/Tables)   │
│ Menu    │                               │
│         │                               │
└─────────┴───────────────────────────────┘
```

**Login/Signup Pages**
```
┌─────────────────────────────────────────┐
│                                         │
│         [LOGO]                          │
│                                         │
│    ┌─────────────────────┐             │
│    │   Login/Signup      │             │
│    │   Form              │             │
│    │                     │             │
│    │   [Google Button]   │             │
│    └─────────────────────┘             │
│                                         │
└─────────────────────────────────────────┘
```

### Responsive Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

---

## 🔐 Authentication & Authorization

### User Roles
1. **Buyer** - Browse products, place orders, manage invoices
2. **Seller** - List products, manage inventory, process orders
3. **Admin** - Full platform access (optional future enhancement)

### Authentication Flow

#### Email/Password Signup
1. User enters: Name, Email, Password, Role (Buyer/Seller)
2. Create Firebase Auth account
3. Create Firestore user document with role
4. Redirect to appropriate dashboard

#### Google Sign-In
1. Authenticate with Google OAuth
2. Check Firestore for existing user document
3. If exists: Load role and redirect to dashboard
4. If new: Show profile selection page (Buyer/Seller)
5. Create user document and redirect

#### Login Flow
1. Authenticate with Firebase (email or Google)
2. Fetch user document from Firestore
3. Verify role exists
4. Redirect to role-based dashboard
5. If no role: Redirect to profile selection

### Protected Routes
- All routes except `/login`, `/signup`, `/select-profile` require authentication
- Buyers can only access `/buyer/*` routes
- Sellers can only access `/seller/*` routes

### Session Management
- Firebase handles JWT tokens automatically
- `onAuthStateChanged` listener in AuthContext
- Persistent sessions with localStorage
- Auto-logout on token expiration

---

## 💾 Database Schema

### Firestore Collections

#### users
```javascript
{
  uid: string,              // Firebase Auth UID
  email: string,            // User email
  displayName: string,      // Full name
  role: 'buyer' | 'seller', // User role
  photoURL: string | null,  // Profile image URL
  companyName: string,      // Company name (optional)
  phoneNumber: string,      // Contact number (optional)
  address: string,          // Business address (optional)
  createdAt: timestamp,     // Account creation
  updatedAt: timestamp      // Last profile update
}
```

#### products
```javascript
{
  productId: string,        // Auto-generated ID
  sellerId: string,         // Owner UID
  sellerName: string,       // Seller display name
  name: string,             // Product name
  description: string,      // Product description
  category: string,         // Product category
  price: number,            // Price per unit
  unit: string,             // 'sqm', 'piece', etc.
  imageUrl: string,         // Main product image
  images: array,            // Additional images
  modelNumber: string,      // Unique model identifier
  specifications: object,   // Technical specs
  stock: number,            // Available quantity
  isAvailable: boolean,     // In stock status
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### orders
```javascript
{
  orderId: string,          // Auto-generated ID
  userId: string,           // Buyer UID
  userEmail: string,        // Buyer email
  userName: string,         // Buyer name
  sellerId: string,         // Seller UID (if single seller)
  items: [                  // Order items
    {
      productId: string,
      productName: string,
      modelNumber: string,
      quantity: number,
      area: number,         // For sqm products
      unitPrice: number,
      totalPrice: number,
      imageUrl: string,
      cadFileUrl: string,   // If CAD uploaded
      cadDesignId: string,  // Selected design
      customizations: object // Colors, dimensions
    }
  ],
  subtotal: number,         // Before tax
  tax: number,              // Tax amount (10%)
  total: number,            // Final total
  shippingAddress: object,  // Delivery address
  orderStatus: string,      // 'draft', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'
  paymentStatus: string,    // 'pending', 'paid', 'refunded'
  isAutosaved: boolean,     // For draft orders
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### carts (optional, can use localStorage)
```javascript
{
  cartId: string,           // User UID
  userId: string,
  items: array,             // Same structure as order items
  updatedAt: timestamp
}
```

### PostgreSQL Schema (Backend Alternative)

If using PostgreSQL backend instead of Firestore:

```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  role VARCHAR(20) CHECK (role IN ('buyer', 'seller', 'admin')),
  company_name VARCHAR(255),
  phone_number VARCHAR(50),
  address TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  product_id VARCHAR(255) UNIQUE NOT NULL,
  seller_id VARCHAR(255) REFERENCES users(uid),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  price DECIMAL(10, 2),
  unit VARCHAR(20),
  image_url TEXT,
  model_number VARCHAR(100) UNIQUE,
  stock INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(255) UNIQUE NOT NULL,
  user_id VARCHAR(255) REFERENCES users(uid),
  items JSONB,
  subtotal DECIMAL(10, 2),
  tax DECIMAL(10, 2),
  total DECIMAL(10, 2),
  order_status VARCHAR(50),
  payment_status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🚀 Features & Functionality

### 1. User Authentication
- ✅ Email/Password signup and login
- ✅ Google OAuth integration
- ✅ Role selection during signup (Buyer/Seller)
- ✅ Profile selection for Google users without role
- ✅ Sign-out prompts instead of forced redirects
- ✅ Session persistence
- ✅ Auto-redirect based on role

### 2. Buyer Dashboard
- ✅ Overview statistics (Total Orders, Pending, Completed)
- ✅ Recent orders list with status badges
- ✅ Quick actions (Browse Products, View Orders, Manage Profile)
- ✅ Order status tracking
- ✅ Real-time notifications

### 3. Seller Dashboard
- ✅ Sales overview (Total Sales, Pending Orders, Products Listed)
- ✅ Recent orders requiring action
- ✅ Quick actions (Add Product, Manage Inventory, View Analytics)
- ✅ Order management interface

### 4. Product Management (Seller)
- ✅ Add new products with images
- ✅ Upload up to 5 product images (5MB limit each)
- ✅ Edit product details (name, description, price, stock)
- ✅ Set product categories
- ✅ Unique model number assignment
- ✅ Toggle product availability
- ✅ Delete products

### 5. Product Catalog (Buyer)
- ✅ Browse all products with filtering
- ✅ Category-based filtering
- ✅ Search by product name or model number
- ✅ Product detail view with image gallery
- ✅ Add to cart functionality
- ✅ Quick view modal

### 6. Shopping Cart
- ✅ Add products to cart
- ✅ Adjust quantities and dimensions (area in sqm)
- ✅ Real-time price calculation
- ✅ Remove items from cart
- ✅ Cart persistence (localStorage)
- ✅ Proceed to checkout

### 7. Order Management
- ✅ View all orders (buyer: their orders, seller: received orders)
- ✅ Filter by status: All, Pending, Confirmed, Shipped, Delivered, Cancelled, Draft
- ✅ Order detail view
- ✅ Status update (seller)
- ✅ Order tracking
- ✅ Resume draft orders
- ✅ Delete draft orders

### 8. Draft Orders with Autosave
- ✅ Manual "Save Draft" button
- ✅ Automatic autosave every 30 seconds
- ✅ Visual feedback ("✓ Draft autosaved")
- ✅ Resume from where you left off
- ✅ Clean up old drafts

### 9. Invoice Generation
- ✅ Professional invoice template
- ✅ Company header with branding
- ✅ Invoice number (auto-generated)
- ✅ Customer and seller information
- ✅ Itemized products with images
- ✅ Quantity, unit price, subtotal
- ✅ Tax calculation (10%)
- ✅ Total amount
- ✅ Print-optimized layout
- ✅ PDF export capability

### 10. CAD File Upload & 3D Viewer
- ✅ Upload DWG/DXF CAD files
- ✅ Parse and extract designs from CAD files
- ✅ Design selection dropdown (multiple designs per file)
- ✅ 3D orbit view with professional controls
- ✅ Background color customization
- ✅ Decorating parts color customization
- ✅ Dimension adjustment (length, width, height)
- ✅ Uniform scale slider (10% - 500%)
- ✅ Real-time preview updates
- ✅ CAD metadata stored with order
- ✅ Standalone demo page (`cad-demo.html`)

### 11. Seller Management (Buyer)
- ✅ Browse list of all sellers
- ✅ View seller profile and products
- ✅ Contact seller via support page
- ✅ Filter products by seller

### 12. Branch Management (Buyer)
- ✅ Add multiple branch locations
- ✅ Set default shipping address
- ✅ Edit branch details
- ✅ Delete branches
- ✅ Use branch addresses for orders

### 13. Support & Communication
- ✅ Contact form for inquiries
- ✅ Message center (future enhancement)
- ✅ FAQ section
- ✅ Live chat integration (future)

### 14. Notifications
- ✅ Real-time notification system
- ✅ Order status updates
- ✅ New message alerts
- ✅ System announcements
- ✅ Mark as read/unread
- ✅ Notification preferences

### 15. Profile Management
- ✅ View and edit profile information
- ✅ Update company details
- ✅ Change password
- ✅ Upload profile picture
- ✅ Account settings

---

## 🔧 Configuration Files

### 1. firebase-config.js
```javascript
// Firebase Configuration
// Get these values from Firebase Console > Project Settings > Your apps
// Note: Firebase API keys are safe to include in client-side code, but use environment variables for better management
const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.firebasestorage.app",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
};

// Security note: Protect your Firebase project with:
// - Firestore security rules (see firestore.rules)
// - Storage security rules (see storage.rules)
// - Firebase App Check for abuse prevention
// - Proper domain restrictions in Firebase Console
```

### 2. firestore.rules
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }
    
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (request.auth.uid == userId || getUserRole() == 'admin');
    }
    
    match /products/{productId} {
      allow read: if true;
      allow create: if request.auth != null && 
        (getUserRole() == 'seller' || getUserRole() == 'admin');
      allow update, delete: if request.auth != null && 
        (request.auth.uid == resource.data.sellerId || getUserRole() == 'admin');
    }
    
    match /orders/{orderId} {
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         getUserRole() == 'seller' || 
         getUserRole() == 'admin');
      allow create: if request.auth != null && 
        (request.auth.uid == request.resource.data.userId || getUserRole() == 'admin');
      allow update: if request.auth != null && 
        (request.auth.uid == request.resource.data.userId || 
         getUserRole() == 'admin' ||
         (getUserRole() == 'seller' && 
          request.resource.data.diff(resource.data).affectedKeys().hasOnly(['orderStatus', 'updatedAt'])));
    }
    
    match /carts/{cartId} {
      allow read, update, delete: if request.auth != null && 
        (request.auth.uid == resource.data.userId || getUserRole() == 'admin');
      allow create: if request.auth != null &&
        (request.auth.uid == request.resource.data.userId || getUserRole() == 'admin');
    }
  }
}
```

### 3. storage.rules
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /products/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && 
        request.resource.size < 5 * 1024 * 1024 &&
        request.resource.contentType.matches('image/.*');
    }
    
    match /cad/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        request.resource.size < 50 * 1024 * 1024 &&
        (request.resource.contentType.matches('application/.*') ||
         request.resource.contentType.matches('image/.*'));
    }
    
    match /profiles/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && 
        request.auth.uid == userId &&
        request.resource.size < 2 * 1024 * 1024;
    }
  }
}
```

### 4. vite.config.js
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  root: '.',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      input: '/index-react.html',
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          'icons': ['lucide-react']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
})
```

### 5. firebase.json
```json
{
  "hosting": {
    "public": ".",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**",
      "**/backend/**",
      "**/*.md",
      "package.json",
      "package-lock.json"
    ],
    "headers": [
      {
        "source": "**/*.@(html|js|css|json)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-store, no-cache, must-revalidate, max-age=0"
          }
        ]
      },
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp|ico|woff|woff2|ttf|eot)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      }
    ],
    "rewrites": [
      {
        "source": "/buyer{,/**}",
        "destination": "/buyer.html"
      },
      {
        "source": "/seller{,/**}",
        "destination": "/seller.html"
      }
    ]
  }
}
```

### 6. .htaccess (Apache)
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [L]

<IfModule mod_headers.c>
  Header set Cache-Control "no-store, no-cache, must-revalidate, max-age=0"
  Header set Pragma "no-cache"
  Header set Expires "0"
</IfModule>
```

### 7. .env.example
```bash
# Firebase Configuration
# Get these values from Firebase Console > Project Settings
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id_here
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Backend (if using PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aluminumframework
DB_USER=your_db_user
DB_PASSWORD=your_secure_db_password
JWT_SECRET=your_long_random_jwt_secret_key_min_32_chars
PORT=3001
```

---

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Firebase account (free plan works)
- PostgreSQL (optional, for backend alternative)
- Git

### Step 1: Clone and Install
```bash
# Clone repository
git clone https://github.com/ione2025/ALUMINUMFRAMEWORK.git
cd ALUMINUMFRAMEWORK

# Install frontend dependencies
npm install

# Install backend dependencies (if using)
cd backend
npm install
cd ..
```

### Step 2: Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project (or use existing: `gen-lang-client-0988357303`)
3. Enable Authentication (Email/Password + Google)
4. Create Firestore Database (start in test mode, then apply rules)
5. Enable Firebase Storage
6. Copy configuration to `firebase-config.js`

### Step 3: Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your Firebase credentials
nano .env
```

### Step 4: Deploy Security Rules
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage:rules
```

### Step 5: Build React App
```bash
# Development mode
npm run dev

# Production build
npm run build
```

### Step 6: Start Development Servers
```bash
# Run both frontend and backend
npm start

# Or separately:
npm run frontend    # Port 3000
npm run backend     # Port 3001
```

### Step 7: Deploy to Production
```bash
# Deploy to Firebase Hosting
firebase deploy --only hosting

# Or deploy everything
firebase deploy
```

---

## 🌐 API Endpoints (Backend)

### Authentication
```
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/verify
```

### Users
```
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id
GET    /api/users/role/:role
```

### Products
```
GET    /api/products
GET    /api/products/:id
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id
GET    /api/products/seller/:sellerId
GET    /api/products/category/:category
```

### Orders
```
GET    /api/orders
GET    /api/orders/:id
POST   /api/orders
PUT    /api/orders/:id
DELETE /api/orders/:id
GET    /api/orders/user/:userId
GET    /api/orders/seller/:sellerId
PUT    /api/orders/:id/status
```

### File Uploads
```
POST /api/upload/product-image
POST /api/upload/cad-file
POST /api/upload/profile-picture
```

---

## 🎭 Key React Components

### 1. App.jsx (Router Configuration)
- Main routing setup with React Router
- Public routes: /login, /signup, /select-profile
- Protected buyer routes: /buyer/*
- Protected seller routes: /seller/*
- Default redirects

### 2. AuthContext.jsx
- Global authentication state
- Firebase onAuthStateChanged listener
- User role management
- Login/logout functions
- Loading states

### 3. FirebaseContext.jsx
- Firebase initialization
- Firestore instance
- Storage instance
- Analytics setup

### 4. Layout.jsx
- Main dashboard layout wrapper
- Sidebar navigation
- Top header with user menu
- Responsive mobile menu
- Breadcrumbs

### 5. ProtectedRoute.jsx
- Route authentication wrapper
- Role-based access control
- Redirect to login if not authenticated
- Redirect to profile selection if no role

### 6. BuyerDashboard.jsx
- Dashboard overview cards
- Recent orders table
- Quick action buttons
- Statistics charts

### 7. LoginPage.jsx
- Email/password login form
- Google Sign-In button
- Sign-out prompt for authenticated users
- Error handling
- Form validation

### 8. SignupPage.jsx
- Registration form with role selection
- Google Sign-In with role check
- Profile creation
- Input validation
- Success redirects

### 9. CADViewer Component (cad-viewer.js)
- Three.js initialization
- CAD file parsing (DWG/DXF)
- 3D scene setup
- OrbitControls
- Color customization
- Dimension scaling
- Design selection

---

## 🔒 Security Best Practices

### Frontend Security
- ✅ No API keys in source code (use environment variables)
- ✅ HTTPS enforced (upgrade-insecure-requests)
- ✅ XSS prevention (React escapes by default)
- ✅ CSRF protection (Firebase handles tokens)
- ✅ Input validation on all forms

### Backend Security
- ✅ Helmet.js for HTTP headers
- ✅ CORS configured properly
- ✅ Rate limiting on all endpoints
- ✅ JWT token validation
- ✅ Password hashing with bcrypt (12 rounds)
- ✅ SQL injection prevention (parameterized queries)
- ✅ File upload validation (type, size)

### Firebase Security
- ✅ Firestore security rules enforced
- ✅ Storage security rules enforced
- ✅ Role-based access control
- ✅ Server-side validation
- ✅ Admin SDK for privileged operations

---

## 📊 Performance Optimizations

### Build Optimizations
- ✅ Code splitting (manual chunks)
- ✅ Tree shaking (unused code removed)
- ✅ Minification (JS, CSS, HTML)
- ✅ Gzip compression
- ✅ Asset optimization (images, fonts)
- ✅ Module preloading

### Bundle Sizes
- Main App: 395KB (91.64KB gzipped)
- Firebase: 357KB (111.08KB gzipped)
- React Vendor: 46KB (16.62KB gzipped)
- CSS: 161KB (25.25KB gzipped)
- Icons: 9.72KB (3.86KB gzipped)

### Runtime Optimizations
- ✅ Lazy loading for routes (future enhancement)
- ✅ Image lazy loading
- ✅ Debounced search inputs
- ✅ Memoized expensive calculations
- ✅ Virtual scrolling for large lists (future)

### Caching Strategy
- HTML/JS/CSS: No cache (always fresh)
- Images/Fonts: 1-year cache (immutable)
- API responses: No cache for dynamic data

---

## 🧪 Testing Guidelines

### Manual Testing Checklist

**Authentication Tests**
- [ ] Sign up with email/password as buyer
- [ ] Sign up with email/password as seller
- [ ] Sign up with Google (new user)
- [ ] Sign up with Google (existing user)
- [ ] Login with email/password
- [ ] Login with Google
- [ ] Already signed-in user visits /login
- [ ] Sign out functionality

**Navigation Tests**
- [ ] All buyer routes accessible
- [ ] All seller routes accessible
- [ ] Protected routes redirect to login
- [ ] Role-based route restrictions work
- [ ] Sidebar navigation works
- [ ] Mobile menu works

**Product Tests (Seller)**
- [ ] Add new product with images
- [ ] Edit product details
- [ ] Delete product
- [ ] Toggle product availability
- [ ] View all products

**Shopping Tests (Buyer)**
- [ ] Browse product catalog
- [ ] Filter by category
- [ ] Search products
- [ ] Add to cart
- [ ] Adjust quantities
- [ ] Remove from cart
- [ ] Proceed to checkout

**Order Tests**
- [ ] Place new order
- [ ] View order details
- [ ] Filter orders by status
- [ ] Save draft order
- [ ] Resume draft order
- [ ] Delete draft order
- [ ] Autosave works (30s interval)

**Invoice Tests**
- [ ] Generate invoice
- [ ] Print invoice
- [ ] Invoice shows correct calculations
- [ ] Company header displays correctly

**CAD Tests**
- [ ] Upload DWG file
- [ ] Upload DXF file
- [ ] Select design from dropdown
- [ ] Change background color
- [ ] Change decorating color
- [ ] Adjust dimensions
- [ ] 3D orbit view works
- [ ] Add CAD product to cart

---

## 📱 Responsive Design

### Mobile (< 768px)
- Hamburger menu for sidebar
- Stacked cards and tables
- Touch-friendly buttons (min 44px)
- Simplified navigation
- Collapsible sections

### Tablet (768px - 1024px)
- Sidebar toggleable
- 2-column layouts where appropriate
- Optimized touch targets
- Readable typography

### Desktop (> 1024px)
- Full sidebar always visible
- Multi-column layouts
- Hover effects
- Keyboard shortcuts
- Tooltips

---

## 🚀 Deployment

### Firebase Hosting (Recommended)
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize (if not done)
firebase init hosting

# Build production
npm run build

# Deploy
firebase deploy --only hosting
```

### Custom Server (Apache/Nginx)
1. Build production: `npm run build`
2. Copy `dist/` contents to web root
3. Configure .htaccess or nginx.conf for SPA routing
4. Ensure HTTPS is enabled
5. Set up cache headers

### Vercel
1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variables
5. Deploy

---

## 📖 Documentation Files

The project includes comprehensive documentation:

1. **README.md** - Project overview and quick start
2. **FEATURES_OVERVIEW.md** - Detailed feature list
3. **DEPLOYMENT_INSTRUCTIONS.md** - Deployment guide
4. **COMPLETE_SOLUTION_SUMMARY.md** - Architecture overview
5. **CAD_UPLOAD_FEATURE.md** - CAD functionality details
6. **HTTPS_SETUP.md** - SSL/HTTPS configuration
7. **FIREBASE_FIX_DEPLOYMENT.md** - Firebase troubleshooting
8. **FIRESTORE_PERMISSION_FIX.md** - Security rules guide
9. **CUSTOM_DOMAIN_SETUP.md** - Domain configuration
10. **ADMIN_CREDENTIALS.md** - Admin access info
11. **TESTING_GUIDE.md** - QA procedures
12. **PERFORMANCE_GUIDE.md** - Optimization tips
13. **REACT_APP_GUIDE.md** - React architecture
14. **UNIFICATION_PLAN.md** - Consolidation strategy

---

## 🎯 Future Enhancements

### Phase 1 (Immediate)
- [ ] Email notifications for order status
- [ ] PDF export for invoices
- [ ] Advanced search with filters
- [ ] Product reviews and ratings

### Phase 2 (Short-term)
- [ ] Multi-language support (i18n)
- [ ] Real-time chat between buyers and sellers
- [ ] Payment gateway integration (Stripe/PayPal)
- [ ] Shipping calculator and tracking

### Phase 3 (Long-term)
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] AI-powered product recommendations
- [ ] Bulk import/export (CSV, Excel)
- [ ] API for third-party integrations
- [ ] Multi-vendor marketplace features

---

## 🐛 Known Issues & Limitations

1. **CAD Viewer**: Large CAD files (>50MB) may cause performance issues
2. **Image Upload**: Maximum 5 images per product
3. **Autosave**: 30-second interval may not suit all users (configurable)
4. **Browser Support**: IE11 not supported (modern browsers only)
5. **Offline Mode**: Not implemented (requires network connection)

---

## 🎓 Learning Resources

### React
- [React Official Docs](https://react.dev)
- [React Router](https://reactrouter.com)

### Firebase
- [Firebase Docs](https://firebase.google.com/docs)
- [Firestore Guide](https://firebase.google.com/docs/firestore)
- [Firebase Auth](https://firebase.google.com/docs/auth)

### Three.js (for CAD viewer)
- [Three.js Docs](https://threejs.org/docs)
- [Three.js Examples](https://threejs.org/examples)

### Express.js
- [Express Guide](https://expressjs.com/en/guide/routing.html)

---

## 💡 Key Implementation Notes

### 1. Authentication Strategy
The platform uses a **hybrid authentication approach**:
- Firebase Auth handles user credentials
- Firestore stores user roles and profile data
- JWT tokens (optional) for backend API calls

### 2. Data Flow
```
User Action → React Component → Firebase SDK → Firestore/Storage
                                              ↓
                                        Real-time Update
                                              ↓
                                        React State Update
                                              ↓
                                          UI Re-render
```

### 3. CAD File Processing
```
Upload File → Validate Format → Parse with libredwg/dxf-parser → Extract Designs
    ↓
Generate 3D Geometry → Render in Three.js → Apply Customizations → Store Metadata
```

### 4. Cart Management
- **Storage**: localStorage (persists across sessions)
- **Structure**: Array of cart items with product details
- **Sync**: Optional Firestore backup for multi-device access

### 5. Order Status Flow
```
Draft → Pending → Confirmed → Shipped → Delivered
                      ↓
                  Cancelled (optional)
```

### 6. Image Optimization
- Maximum size: 5MB per image
- Allowed formats: JPG, PNG, WebP
- Storage: Firebase Storage with CDN
- Compression: Client-side before upload (optional)

---

## 🔑 Key Files to Implement First

### Critical Path
1. **firebase-config.js** - Firebase initialization
2. **src/context/FirebaseContext.jsx** - Firebase provider
3. **src/context/AuthContext.jsx** - Auth state management
4. **src/App.jsx** - Router configuration
5. **src/components/ProtectedRoute.jsx** - Route protection
6. **src/pages/LoginPage.jsx** - Login interface
7. **src/pages/SignupPage.jsx** - Registration interface
8. **src/pages/BuyerDashboard.jsx** - Main buyer page
9. **src/pages/SellerDashboard.jsx** - Main seller page
10. **src/components/Layout.jsx** - Dashboard layout

### Supporting Files
11. Product management pages
12. Order management pages
13. CAD viewer implementation
14. Invoice generation
15. Profile and settings pages

---

## 📞 Support & Contact

For technical questions or issues:
- **GitHub**: [https://github.com/ione2025/ALUMINUMFRAMEWORK](https://github.com/ione2025/ALUMINUMFRAMEWORK)
- **Domain**: [https://ione.live](https://ione.live)
- **Firebase Project**: gen-lang-client-0988357303

---

## ✅ Completion Checklist

Use this checklist when rebuilding the website:

### Setup Phase
- [ ] Install Node.js and npm
- [ ] Create Firebase project
- [ ] Set up Firestore database
- [ ] Enable Firebase Authentication
- [ ] Enable Firebase Storage
- [ ] Clone repository structure

### Configuration Phase
- [ ] Configure firebase-config.js
- [ ] Set up .env file
- [ ] Deploy Firestore security rules
- [ ] Deploy Storage security rules
- [ ] Configure vite.config.js
- [ ] Set up .htaccess or firebase.json

### Development Phase
- [ ] Implement Firebase contexts
- [ ] Build authentication system
- [ ] Create protected routing
- [ ] Develop buyer dashboard
- [ ] Develop seller dashboard
- [ ] Implement product management
- [ ] Build shopping cart
- [ ] Create checkout flow
- [ ] Implement order management
- [ ] Build invoice generator
- [ ] Integrate CAD viewer
- [ ] Add profile management
- [ ] Implement notifications

### Styling Phase
- [ ] Apply color scheme
- [ ] Implement responsive design
- [ ] Add animations and transitions
- [ ] Style all forms
- [ ] Design cards and modals
- [ ] Create loading states

### Testing Phase
- [ ] Test all authentication flows
- [ ] Test buyer functionality
- [ ] Test seller functionality
- [ ] Test CAD upload
- [ ] Test order management
- [ ] Test on mobile devices
- [ ] Test on different browsers
- [ ] Test performance
- [ ] Test security rules

### Deployment Phase
- [ ] Build production bundle
- [ ] Deploy to Firebase Hosting
- [ ] Configure custom domain
- [ ] Enable HTTPS
- [ ] Test production deployment
- [ ] Monitor for errors
- [ ] Set up analytics

---

## 🎉 Success Criteria

Your rebuild is complete when:
1. ✅ Users can sign up as buyer or seller
2. ✅ Authentication works with email and Google
3. ✅ Buyers can browse and purchase products
4. ✅ Sellers can add and manage products
5. ✅ Shopping cart and checkout work
6. ✅ Orders are created and trackable
7. ✅ Invoices generate correctly
8. ✅ CAD upload and 3D viewer function
9. ✅ Responsive design works on all devices
10. ✅ Security rules protect data appropriately
11. ✅ HTTPS is enabled
12. ✅ Performance meets acceptable standards

---

## 📝 Final Notes

This comprehensive prompt provides everything needed to rebuild the IONE AlumaTech Industries B2B platform from scratch. The architecture is designed to be:

- **Scalable**: Can handle growing user base and product catalog
- **Secure**: Implements industry-standard security practices
- **Maintainable**: Clean code structure and documentation
- **Performant**: Optimized bundles and caching strategies
- **User-friendly**: Intuitive UI/UX for both buyers and sellers
- **Modern**: Uses latest React and Firebase technologies

Follow this guide step-by-step, and you'll have a fully functional B2B e-commerce platform that matches the original implementation with all features and capabilities intact.

**Good luck with your rebuild! 🚀**
