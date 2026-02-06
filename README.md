# IONE AlumaTech Industries - B2B Platform

A complete React-based B2B e-commerce platform for aluminum construction products, built from scratch based on comprehensive documentation.

![IONE Platform](https://github.com/user-attachments/assets/55b019d0-3c40-4f90-9d24-b1215aece50a)

## 🎯 Overview

IONE is a modern B2B platform connecting buyers and sellers in the aluminum manufacturing industry. Built with React 19, Firebase, and a stunning neon-themed UI, it provides a complete solution for product management, orders, invoices, and business operations.

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
- **React 19.2.0** - Latest React with modern features
- **React Router 7** - Client-side routing
- **Vite 7** - Fast build tool and dev server
- **Lucide React** - Beautiful icons
- **Sonner** - Toast notifications

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
├── src/
│   ├── components/          # Reusable components
│   │   ├── Layout.jsx       # Main layout with sidebar
│   │   └── ProtectedRoute.jsx
│   ├── context/             # React Context providers
│   │   └── AuthContext.jsx  # Authentication state
│   ├── pages/               # Page components
│   │   ├── LoginPage.jsx
│   │   ├── SignupPage.jsx
│   │   ├── BuyerDashboard.jsx
│   │   ├── SellerDashboard.jsx
│   │   ├── CatalogPage.jsx
│   │   ├── CartPage.jsx
│   │   ├── OrdersPage.jsx
│   │   └── ... (15+ pages)
│   ├── styles/              # CSS stylesheets
│   │   ├── Layout.css
│   │   └── AuthPages.css
│   ├── firebase-config.js   # Firebase configuration
│   ├── App.jsx              # Main app router
│   └── main.jsx             # Entry point
├── .github/
│   └── workflows/
│       └── deploy.yml       # GitHub Actions deployment
├── public/                  # Static assets
├── index.html              # HTML template
├── vite.config.js          # Vite configuration
└── package.json            # Dependencies
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

### 3. Firebase Configuration
Create a Firebase project at [Firebase Console](https://console.firebase.google.com/):

1. Enable Authentication (Email/Password and Google)
2. Create a Firestore database
3. Enable Firebase Storage
4. Copy your Firebase config

Update `src/firebase-config.js` with your credentials:
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

Open [http://localhost:5173/aluminum-website/](http://localhost:5173/aluminum-website/)

### 5. Build for Production
```bash
npm run build
```

### 6. Preview Production Build
```bash
npm run preview
```

## 🌐 Deployment

### GitHub Pages (Automated)

The project includes a GitHub Actions workflow that automatically deploys to GitHub Pages when you push to the main branch.

**Enable GitHub Pages:**
1. Go to repository Settings > Pages
2. Set Source to "GitHub Actions"
3. Push to main branch
4. Your site will be live at `https://[username].github.io/aluminum-website/`

### Manual Deployment

```bash
# Build the project
npm run build

# Deploy to Firebase Hosting
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

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

- **WEBSITE_REBUILD_PROMPT.md** - Complete technical specifications
- **QUICK_REBUILD_GUIDE.md** - Fast-track implementation guide
- **ARCHITECTURE_DIAGRAM.md** - Visual system architecture
- **DOCUMENTATION_INDEX.md** - Navigation guide for all docs

## 🔐 Firebase Security

Don't forget to deploy Firestore security rules:

```bash
firebase deploy --only firestore:rules
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

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

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
