# Admin Account Setup and Usage Guide

## Overview
The aluminum-website now includes a comprehensive admin management system that allows administrators to manage all aspects of the platform including users, products, orders, sellers, and invoices.

## Creating an Admin Account

### Option 1: Using the create-admin.html Page

1. Navigate to `/create-admin.html` in your browser
2. Click the "Create Admin Account" button
3. The system will create an admin account with these credentials:
   - **Email**: `admin@ionealumatech.com`
   - **Password**: `Admin@2026!Secure`
   - **Role**: `admin`

4. **IMPORTANT**: After creating the admin account, delete the `create-admin.html` file for security:
   ```bash
   git rm public/create-admin.html
   git commit -m "Remove admin creation page for security"
   git push
   ```

### Option 2: Manual Creation via Firebase Console

1. Go to Firebase Console > Authentication
2. Add a new user with email and password
3. Note the user's UID
4. Go to Firestore Database > users collection
5. Create a document with the user's UID containing:
   ```json
   {
     "uid": "<user-uid>",
     "email": "admin@yourdomain.com",
     "displayName": "Admin User",
     "role": "admin",
     "createdAt": "2026-02-18T12:00:00.000Z",
     "companyName": "Your Company",
     "phoneNumber": "+1234567890",
     "address": "Your Address",
     "country": "Your Country",
     "isActive": true,
     "isEmailVerified": true
   }
   ```

## Admin Dashboard Features

### 1. Users Management (`/admin/users`)
- **View all users** (buyers, sellers, and admins)
- **Search users** by name or email
- **Filter by role** (buyer/seller/admin)
- **Filter by status** (active/inactive)
- **Edit user details** (coming soon)
- **Activate/Deactivate users**
- **Delete users**

### 2. Products Management (`/admin/products`)
- **View all products** across all sellers
- **Search products** by name
- **Filter by category**
- **Filter by seller**
- **Filter by status** (active/inactive)
- **Activate/Deactivate products**
- **Delete products**

### 3. Orders Management (`/admin/orders`)
- **View all orders** on the platform
- **Search orders** by ID or buyer
- **Filter by status** (pending/confirmed/shipped/delivered/cancelled)
- **View order details**
- **Delete orders**

### 4. Sellers Management (`/admin/sellers`)
- **View all sellers** with statistics
- **See product count** per seller
- **See order count** per seller
- **Search sellers** by name or company
- **Filter by status** (active/inactive)
- **Activate/Deactivate sellers**
- **Delete sellers**
- **View seller profiles**

### 5. Invoices Management (`/admin/invoices`)
- **View all invoices** on the platform
- **Search invoices** by number or buyer
- **Filter by status** (issued/paid/overdue)
- **View invoice details**
- **Delete invoices**

## Admin Permissions

The admin role has the following permissions:
- Full CRUD (Create, Read, Update, Delete) access to:
  - Users (buyers, sellers, other admins)
  - Products from all sellers
  - Orders from all transactions
  - Invoices from all transactions
  - Seller accounts and profiles

## Security Considerations

1. **Protect Admin Credentials**: Change the default admin password immediately after first login
2. **Remove create-admin.html**: Delete this file from production deployments
3. **Limit Admin Access**: Only create admin accounts for trusted personnel
4. **Monitor Admin Actions**: Implement logging for admin actions (future enhancement)
5. **Use Strong Passwords**: Ensure all admin accounts use strong, unique passwords

## Accessing Admin Features

1. **Login** with admin credentials at `/login`
2. The system will automatically redirect to `/admin/dashboard`
3. Use the sidebar navigation to access different management sections:
   - Dashboard
   - Users
   - Products
   - Orders
   - Sellers
   - Invoices
   - Support
   - Profile

## Admin Menu Structure

The admin sidebar includes:
```
- Dashboard (overview and statistics)
- Users (manage all platform users)
- Products (manage all products)
- Orders (manage all orders)
- Sellers (manage all sellers)
- Invoices (manage all invoices)
- Support (handle support tickets)
- Profile (admin's own profile)
- Sign Out
```

## Technical Implementation

### Files Added/Modified:
1. **Admin Pages**:
   - `public/pages/admin-users.js` - Users management
   - `public/pages/admin-products.js` - Products management
   - `public/pages/admin-orders.js` - Orders management
   - `public/pages/admin-sellers.js` - Sellers management
   - `public/pages/admin-invoices.js` - Invoices management

2. **Layout Updates**:
   - `public/js/layout.js` - Added admin menu items

3. **Router Updates**:
   - `public/js/app.js` - Registered admin routes

4. **Styles**:
   - `public/css/Pages.css` - Added admin page styles

### Authentication Flow:
1. User logs in with admin credentials
2. `authManager` verifies credentials and loads user profile
3. Profile includes `role: 'admin'`
4. Router checks role and grants access to admin routes
5. Each admin page verifies role before rendering

## Future Enhancements

Potential improvements for the admin system:
1. **Audit Logging**: Track all admin actions
2. **Bulk Operations**: Edit/delete multiple items at once
3. **Export Data**: Export users/products/orders to CSV
4. **Analytics Dashboard**: Advanced statistics and charts
5. **Permission Levels**: Different admin roles with varying permissions
6. **Email Notifications**: Notify users of admin actions
7. **Advanced Filtering**: More granular filter options
8. **Data Validation**: Enhanced validation for edits

## Troubleshooting

### Issue: Cannot access admin pages
- **Solution**: Verify your account has `role: 'admin'` in Firestore users collection

### Issue: Admin menu not showing
- **Solution**: Clear browser cache and refresh the page

### Issue: Admin account already exists error
- **Solution**: The admin account is already created, use the existing credentials to log in

### Issue: Unauthorized access error
- **Solution**: Ensure you're logged in with admin credentials and the profile is loaded

## Support

For issues or questions about the admin system, please:
1. Check this documentation
2. Review the code comments in admin page files
3. Check browser console for error messages
4. Contact the development team
