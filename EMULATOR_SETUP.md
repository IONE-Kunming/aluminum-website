# Firebase Emulator Setup

This project includes Firebase Emulators for local development and testing without connecting to production Firebase.

## What's Included

- **Authentication Emulator** (port 9099): Test user authentication
- **Firestore Emulator** (port 8080): Test database operations
- **Hosting Emulator** (port 5000): Test the deployed site
- **Emulator UI** (port 4000): Visual interface for all emulators

## Quick Start

### 1. Start the Emulators

```bash
npm run emulators
```

This will start all Firebase emulators. The emulator UI will be available at http://localhost:4000

### 2. Seed Test Data

In a new terminal, run:

```bash
npm run emulators:seed
```

This will populate the emulators with test data including:
- 4 test users (admin, buyer, seller, inactive seller)
- 4 test products
- 2 test orders

### 3. Access the Application

The application will be running on:
- **Vite Dev Server**: http://localhost:5173 (run `npm run dev` in another terminal)
- **Emulator UI**: http://localhost:4000

## Test Accounts

After seeding, you can log in with:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@test.com | admin123 |
| Buyer | buyer@test.com | buyer123 |
| Seller | seller@test.com | seller123 |
| Inactive Seller | inactive@test.com | inactive123 |

## Testing Admin Features

1. Log in as admin (admin@test.com / admin123)
2. Navigate to Admin pages from the sidebar
3. Test the following features:
   - **Users Management**: Edit user details, change email, toggle active status
   - **Products Management**: Edit product details, change pricing/stock, toggle visibility
   - **Orders Management**: Edit order status and notes
   - **Sellers Management**: Toggle seller active status (affects buyer catalog visibility)

## What to Test

### 1. Admin Edit Functionality
- ✅ Edit users (name, email, role, company, phone, active status)
- ✅ Edit products (name, category, description, price, stock, active status)
- ✅ Edit orders (status, notes)
- ✅ All changes persist in Firestore emulator

### 2. Seller Visibility Control
- ✅ Toggle seller "isActive" status from admin-sellers page
- ✅ Verify inactive sellers don't appear in buyer catalog
- ✅ Verify inactive seller products can't be accessed

### 3. Product Filtering
- ✅ Only active products (isActive !== false) appear in catalogs
- ✅ Public categories page shows only categories with active products
- ✅ Guest catalog respects product active status

### 4. Landing Page Translations
- ✅ Switch languages (English, Arabic, Chinese, Urdu)
- ✅ Verify category names are translated
- ✅ Verify subcategory names are translated

### 5. Auth Profile Loading
- ✅ Log in with test accounts
- ✅ Profile loads correctly without timeout
- ✅ Role-based navigation works (admin → admin dashboard, buyer → catalog, etc.)

## Emulator Data Persistence

By default, emulator data is cleared when you stop the emulators. To export/import data:

```bash
# Export emulator data
firebase emulators:export ./emulator-data

# Start with exported data
firebase emulators:start --import=./emulator-data
```

## Troubleshooting

### Port Already in Use
If a port is already in use, you can change it in `firebase.json`:

```json
"emulators": {
  "auth": { "port": 9099 },
  "firestore": { "port": 8080 },
  "hosting": { "port": 5000 },
  "ui": { "port": 4000 }
}
```

### Emulators Not Starting
Make sure Firebase tools are installed:

```bash
npm install -D firebase-tools
```

### Seed Script Fails
Make sure the emulators are running before executing the seed script:

```bash
# Terminal 1
npm run emulators

# Terminal 2 (wait for emulators to start)
npm run emulators:seed
```

## Notes

- The emulators use project ID `demo-project` (no real Firebase connection needed)
- All data is local and not synced to production
- Perfect for testing admin features without affecting real users/data
- Emulator UI provides visual debugging of Auth users and Firestore collections
