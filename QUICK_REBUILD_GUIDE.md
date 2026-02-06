# Quick Rebuild Guide - IONE Platform

This is a condensed quick-start guide to rebuild the IONE AlumaTech Industries B2B platform. For complete details, see **WEBSITE_REBUILD_PROMPT.md**.

---

## 🚀 30-Second Overview

**What**: B2B e-commerce platform for aluminum construction products  
**Tech**: React 19 + Firebase + Vite  
**Features**: User auth, product catalog, CAD upload, orders, invoices  
**Domain**: ione.live

---

## ⚡ Quick Start (5 Steps)

### 1. Setup Firebase (10 min)
```bash
# Create Firebase project at console.firebase.google.com
# Enable: Authentication (Email + Google), Firestore, Storage
# Copy config to firebase-config.js
```

### 2. Install Dependencies (2 min)
```bash
git clone https://github.com/ione2025/ALUMINUMFRAMEWORK.git
cd ALUMINUMFRAMEWORK
npm install
```

### 3. Configure Environment (1 min)
```bash
cp .env.example .env
# Edit .env with your Firebase credentials
```

### 4. Deploy Security Rules (2 min)
```bash
firebase login
firebase deploy --only firestore:rules,storage:rules
```

### 5. Start Development (1 min)
```bash
npm run dev
# Opens at http://localhost:3000
```

---

## 📂 Core File Structure

```
ALUMINUMFRAMEWORK/
├── src/
│   ├── App.jsx                 # Router setup
│   ├── pages/                  # 15 page components
│   ├── components/             # Reusable components
│   └── context/                # Auth & Firebase contexts
├── firebase-config.js          # Firebase credentials
├── firestore.rules            # Database security
├── vite.config.js             # Build configuration
└── package.json               # Dependencies
```

---

## 🎯 Essential Features to Implement

### Priority 1 (Core)
1. ✅ Firebase initialization
2. ✅ Authentication (Email + Google)
3. ✅ User roles (Buyer/Seller)
4. ✅ Protected routing
5. ✅ Dashboard layouts

### Priority 2 (Business)
6. ✅ Product management (Seller)
7. ✅ Product catalog (Buyer)
8. ✅ Shopping cart
9. ✅ Checkout & orders
10. ✅ Invoice generation

### Priority 3 (Advanced)
11. ✅ CAD file upload (DWG/DXF)
12. ✅ 3D viewer with Three.js
13. ✅ Draft orders with autosave
14. ✅ Order tracking
15. ✅ Notifications

---

## 🔐 Security Checklist

- [ ] Replace placeholder API keys in firebase-config.js
- [ ] Deploy Firestore security rules
- [ ] Deploy Storage security rules
- [ ] Enable HTTPS on domain
- [ ] Set up Firebase App Check (optional)
- [ ] Configure CORS for backend (if using)
- [ ] Add rate limiting

---

## 🎨 Design System (Quick Reference)

### Colors
```css
--neon-cyan: #00FFFF;
--electric-blue: #0080FF;
--dark-bg: #0a0e27;
--card-bg: #131829;
```

### Fonts
- Primary: 'Sora' (headings, buttons)
- Secondary: 'Manrope' (body text)

### Components
- Border radius: 8px (buttons), 12px (cards)
- Padding: 12px 24px (buttons), 16px (inputs)
- Transitions: 0.3s all

---

## 💾 Database Schema (Quick)

### Firestore Collections

**users**
```javascript
{
  uid, email, displayName, role: 'buyer' | 'seller',
  companyName, phoneNumber, address, createdAt, updatedAt
}
```

**products**
```javascript
{
  productId, sellerId, name, description, category,
  price, unit, imageUrl, modelNumber, stock, isAvailable
}
```

**orders**
```javascript
{
  orderId, userId, items[], subtotal, tax, total,
  orderStatus, paymentStatus, createdAt, updatedAt
}
```

---

## 🛠️ Tech Stack Summary

| Component | Technology |
|-----------|------------|
| Frontend | React 19.2.4 + Vite 7.3.1 |
| Router | React Router 7.13.0 |
| State | React Context API |
| Styling | CSS3 + CSS Variables |
| Icons | Lucide React 0.563.0 |
| Auth | Firebase Authentication |
| Database | Cloud Firestore |
| Storage | Firebase Storage |
| 3D Viewer | Three.js + CAD parsers |
| Backend | Express.js (optional) |
| Hosting | Firebase Hosting |

---

## 📝 Key Commands

### Development
```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Build for production
npm run preview      # Preview production build
```

### Firebase
```bash
firebase login                        # Login to Firebase
firebase deploy                       # Deploy everything
firebase deploy --only hosting        # Deploy hosting only
firebase deploy --only firestore      # Deploy Firestore rules
```

### Backend (if using)
```bash
cd backend
npm install
npm run dev          # Start with nodemon
npm start            # Production start
```

---

## 🔄 Implementation Flow

### Phase 1: Foundation (Day 1)
```
Firebase Setup → Authentication → Basic Routing → Dashboard Layouts
```

### Phase 2: Core Features (Days 2-3)
```
Product Management → Catalog → Shopping Cart → Checkout → Orders
```

### Phase 3: Advanced Features (Days 4-5)
```
Invoices → CAD Viewer → Notifications → Profile Management
```

### Phase 4: Polish (Day 6)
```
Responsive Design → Testing → Optimization → Deployment
```

---

## 🧪 Quick Test Scenarios

### Test 1: Authentication
1. Sign up as buyer with email
2. Sign out
3. Login with Google
4. Verify dashboard loads

### Test 2: Product Flow
1. Sign in as seller
2. Add product with image
3. Sign in as buyer
4. Browse catalog
5. Add to cart
6. Checkout
7. View order

### Test 3: CAD Upload
1. Go to catalog
2. Select product
3. Upload DWG file
4. Select design
5. Customize colors
6. Adjust dimensions
7. Add to cart

---

## 🚨 Common Issues & Fixes

### Issue: Firebase Auth Error
**Fix**: Enable Email/Password and Google in Firebase Console > Authentication > Sign-in method

### Issue: 404 on Routes
**Fix**: Configure .htaccess or firebase.json for SPA routing

### Issue: Images Not Loading
**Fix**: Check Firebase Storage rules and public read permissions

### Issue: CAD Viewer Not Working
**Fix**: Ensure Three.js dependencies are installed: `npm install three three-dxf-loader`

### Issue: Build Fails
**Fix**: Clear node_modules and reinstall: `rm -rf node_modules && npm install`

---

## 📦 Minimum Dependencies

### Frontend
```json
{
  "react": "^19.2.4",
  "react-dom": "^19.2.4",
  "react-router-dom": "^7.13.0",
  "firebase": "^12.9.0",
  "lucide-react": "^0.563.0",
  "sonner": "^2.0.7",
  "vite": "^7.3.1"
}
```

### For CAD Features (optional)
```json
{
  "three": "latest",
  "three-dxf-loader": "^5.2.0",
  "@mlightcad/libredwg-web": "^0.6.6",
  "dxf-parser": "^1.1.2"
}
```

---

## 🎯 Feature Completion Checklist

### Must Have (MVP)
- [ ] User signup/login (email + Google)
- [ ] Role selection (buyer/seller)
- [ ] Product CRUD (seller)
- [ ] Product catalog (buyer)
- [ ] Shopping cart
- [ ] Order creation
- [ ] Basic invoice

### Should Have
- [ ] Order management
- [ ] Order status updates
- [ ] Draft orders with autosave
- [ ] Profile management
- [ ] Notifications
- [ ] Search and filters

### Nice to Have
- [ ] CAD upload and 3D viewer
- [ ] Branch management
- [ ] Seller directory
- [ ] Support system
- [ ] Analytics dashboard

---

## 🌐 Deployment Checklist

- [ ] Build production: `npm run build`
- [ ] Test build locally: `npm run preview`
- [ ] Deploy Firebase: `firebase deploy`
- [ ] Configure custom domain (ione.live)
- [ ] Enable HTTPS
- [ ] Test all features in production
- [ ] Monitor Firebase usage
- [ ] Set up error tracking

---

## 📚 Key Documentation Files

1. **WEBSITE_REBUILD_PROMPT.md** - Complete detailed guide (1,380 lines)
2. **README.md** - Project overview
3. **FEATURES_OVERVIEW.md** - Feature details
4. **DEPLOYMENT_INSTRUCTIONS.md** - Deployment guide
5. **CAD_UPLOAD_FEATURE.md** - CAD viewer documentation

---

## 💡 Pro Tips

1. **Start Simple**: Get auth working first, then add features
2. **Use Firebase Console**: Directly manage data during development
3. **Test Security Rules**: Use Firebase Emulator Suite
4. **Optimize Images**: Compress before upload (use TinyPNG)
5. **Monitor Bundle Size**: Keep main bundle under 500KB
6. **Use Dev Tools**: React DevTools + Firebase DevTools
7. **Git Workflow**: Commit after each major feature
8. **Error Handling**: Add try-catch blocks everywhere
9. **Loading States**: Show spinners for async operations
10. **Mobile First**: Test on mobile devices early

---

## 🎉 Success Criteria

Your rebuild is complete when you can:

1. ✅ Sign up and login (both roles)
2. ✅ Add products (seller)
3. ✅ Browse and purchase (buyer)
4. ✅ Create and view orders
5. ✅ Generate invoices
6. ✅ Upload CAD files (optional)
7. ✅ Access site at ione.live
8. ✅ HTTPS is working
9. ✅ Mobile responsive
10. ✅ All security rules deployed

---

## 🆘 Get Help

- **Detailed Guide**: WEBSITE_REBUILD_PROMPT.md
- **Firebase Docs**: firebase.google.com/docs
- **React Docs**: react.dev
- **GitHub Repo**: github.com/ione2025/ALUMINUMFRAMEWORK

---

**Ready to build? Start with Step 1: Setup Firebase! 🚀**
