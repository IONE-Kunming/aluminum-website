# Admin Account Creation Guide

## Admin Account Credentials

**Email:** `admin@ionealumatech.com`  
**Password:** `Admin@2026!Secure`  
**Role:** `admin`  
**Display Name:** `IONE Admin`

---

## Method 1: Using Firebase Console (Recommended)

### Step 1: Create the Admin User Account

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `gen-lang-client-0988357303`
3. Navigate to **Authentication** → **Users** tab
4. Click **Add User**
5. Enter:
   - **Email:** `admin@ionealumatech.com`
   - **Password:** `Admin@2026!Secure`
6. Click **Add User**

### Step 2: Create the Admin User Profile in Firestore

1. In Firebase Console, navigate to **Firestore Database**
2. Go to the `users` collection
3. Click **Add Document**
4. Set **Document ID** to the UID of the admin user (copy from Authentication > Users)
5. Add the following fields:

```json
{
  "uid": "<paste-the-user-uid-here>",
  "email": "admin@ionealumatech.com",
  "displayName": "IONE Admin",
  "role": "admin",
  "createdAt": "<current-timestamp>",
  "companyName": "IONE AlumaTech Industries",
  "phoneNumber": "+1-800-IONE-ADM",
  "address": "Head Office, IONE Tower",
  "country": "United States",
  "isActive": true,
  "isEmailVerified": true
}
```

6. Click **Save**

---

## Method 2: Using the Admin Creation Page

We've created a special admin creation page that you can access directly on your website:

1. Navigate to: `https://your-website-url.com/create-admin.html`
2. The page will automatically attempt to create the admin account
3. Follow the on-screen instructions
4. Login credentials will be displayed on success

---

## Method 3: Using the create-admin.js Script

If you have Node.js and can access Firebase from your environment:

```bash
npm install
npm run create-admin
```

The script will:
1. Create the admin user account
2. Set up the admin profile in Firestore
3. Display the login credentials

---

## Logging In

Once the admin account is created:

1. Go to your website's login page
2. Enter:
   - **Email:** `admin@ionealumatech.com`
   - **Password:** `Admin@2026!Secure`
3. Select **Admin** as the role (if prompted)
4. Click **Sign In**

---

## Security Notes

⚠️ **IMPORTANT SECURITY RECOMMENDATIONS:**

1. **Change the password immediately after first login**
2. **Enable Two-Factor Authentication (if available)**
3. **Keep these credentials secure and private**
4. **Do not share the password via insecure channels**
5. **Consider using a password manager**
6. **Delete the `create-admin.js` file and `ADMIN_ACCOUNT_CREDENTIALS.md` after creation**

---

## Troubleshooting

### Issue: "User already exists"
- The admin account has already been created
- Try logging in with the credentials above
- If you forgot the password, use Firebase Console to reset it

### Issue: "Invalid credentials"
- Verify you're using the correct email and password
- Check for typos (password is case-sensitive)
- Ensure the user profile was created in Firestore

### Issue: "No role found"
- The user profile in Firestore may be missing the `role` field
- Go to Firestore Database → `users` collection
- Find the admin user document
- Add/update the field: `role: "admin"`

### Issue: "Cannot access admin features"
- Verify the `role` field in Firestore is set to `"admin"` (lowercase)
- Clear browser cache and cookies
- Log out and log back in

---

## Admin Features

As an admin, you will have access to:

- ✅ View all users (buyers and sellers)
- ✅ Manage products across all sellers
- ✅ View all orders and transactions
- ✅ Access analytics and reports
- ✅ Manage system settings
- ✅ User management and moderation
- ✅ Content management

---

**Last Updated:** 2026-02-07  
**Document Version:** 1.0
