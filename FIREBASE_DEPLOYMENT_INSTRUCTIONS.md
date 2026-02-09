# Firebase Configuration Deployment Guide

This guide explains how to deploy the updated Firebase configurations (Firestore rules and indexes) to enable invoice creation and chat functionality.

## Prerequisites

- Firebase CLI installed (`npm install -g firebase-tools`)
- Logged into Firebase (`firebase login`)
- Project initialized in the repository

## Deployment Steps

### 1. Deploy Firestore Rules

Deploy the updated Firestore security rules that allow buyers to create invoices and enable the counters collection:

```bash
firebase deploy --only firestore:rules
```

**What this does:**
- Updates invoice rules to allow buyers to create invoices during checkout
- Adds support for the `_counters` collection used for invoice number generation
- Maintains existing security rules for other collections

### 2. Deploy Firestore Indexes

Deploy the indexes required for efficient querying:

```bash
firebase deploy --only firestore:indexes
```

**What this does:**
- Creates indexes for invoice queries (by buyerId and sellerId with createdAt)
- Creates indexes for chat queries (participants array-contains with lastMessageTime)
- Creates indexes for message queries (by chatId with createdAt)
- Creates indexes for notification queries (by userId with createdAt)
- Creates indexes for order queries (by buyerId, sellerId, status with createdAt)

### 3. Deploy All Firebase Configurations (Optional)

If you want to deploy everything at once:

```bash
firebase deploy
```

This will deploy:
- Firestore rules
- Firestore indexes
- Firebase Hosting (the website)
- Storage rules

## Verify Deployment

After deployment, verify that:

1. **Firestore Rules are Active:**
   - Go to Firebase Console → Firestore Database → Rules
   - Verify the rules match the content in `firestore.rules`

2. **Indexes are Built:**
   - Go to Firebase Console → Firestore Database → Indexes
   - Wait for all indexes to finish building (status should be "Enabled")
   - This may take a few minutes

3. **Test Invoice Creation:**
   - Place a test order as a buyer
   - Check that invoices are created successfully in the Firestore database
   - Verify buyers can see their invoices on the Invoices page

4. **Test Chat Functionality:**
   - Send messages between buyers and sellers
   - Verify messages appear in real-time
   - Test file attachments (images, videos, PDFs)
   - Verify download functionality works

## Troubleshooting

### Invoice Creation Fails

**Symptom:** Invoices are not created after order placement

**Solution:**
1. Check Firebase Console logs for errors
2. Verify Firestore rules are deployed
3. Verify the `_counters` collection has proper permissions
4. Check browser console for JavaScript errors

### Missing Index Errors

**Symptom:** Error messages about missing indexes when loading data

**Solution:**
1. Deploy indexes: `firebase deploy --only firestore:indexes`
2. Wait for indexes to finish building (check Firebase Console)
3. The application has fallback logic for missing indexes, but performance will be better with indexes

### Chat Messages Not Loading

**Symptom:** Chat messages don't appear or load slowly

**Solution:**
1. Verify the chat indexes are deployed and enabled
2. Check that users have proper authentication
3. Verify Firestore rules allow reading messages

## Configuration Files

The following files contain Firebase configurations:

- `firestore.rules` - Security rules for Firestore database
- `firestore.indexes.json` - Index definitions for efficient queries
- `firebase.json` - Firebase project configuration
- `storage.rules` - Security rules for Firebase Storage

## Important Notes

1. **Index Building Time:** After deploying indexes, Firebase needs time to build them. This can take a few minutes to several hours depending on the amount of data.

2. **Rules Deployment:** Rules take effect immediately after deployment, but it may take a minute for the changes to propagate globally.

3. **Testing:** Always test in a development/staging environment before deploying to production.

4. **Backup:** Firebase Console allows you to view previous versions of rules. You can always revert if needed.

## Support

For issues with Firebase deployment:
- Check Firebase Console for error messages
- Review Firebase documentation: https://firebase.google.com/docs
- Check the application logs in the browser console

## Translation Service Note

The Gemini API key for translation is configured in `public/js/translationService.js`. The service is enabled by default with the provided API key. Messages in chat will be automatically translated based on user language preferences.
