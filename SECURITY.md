# Security Considerations

## API Key Security

### Gemini Translation API Key
**Location:** `public/js/translationService.js`
**Key:** `AIzaSyDLumkxN_6uKWwqJKs5QwOT8jP9sGCW0hQ`

**⚠️ IMPORTANT SECURITY NOTICE:**

The Gemini API key is currently hardcoded in the client-side code. This means it is visible to anyone who views the source code of your website. While this is acceptable for development and testing, **it poses security risks in production**.

### Recommended Security Measures:

1. **API Key Restrictions (Google Cloud Console):**
   - Go to Google Cloud Console → APIs & Services → Credentials
   - Edit the API key
   - Add HTTP referrer restrictions to only allow your domain(s)
   - Example: `*.yourdomain.com/*`, `https://yoursite.firebaseapp.com/*`
   - Set API restrictions to only allow "Generative Language API"

2. **Set Usage Quotas:**
   - In Google Cloud Console, set daily quotas to prevent abuse
   - Monitor usage regularly
   - Set up billing alerts

3. **Alternative: Backend Proxy (Recommended for Production):**
   - Create a Firebase Cloud Function or backend API endpoint
   - Move the API key to server-side environment variables
   - Client calls your backend, backend calls Gemini API
   - This completely hides the API key from users

   Example Firebase Function:
   ```javascript
   // functions/index.js
   const functions = require('firebase-functions');
   const fetch = require('node-fetch');

   exports.translate = functions.https.onCall(async (data, context) => {
     // Verify user is authenticated
     if (!context.auth) {
       throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
     }

     const { text, sourceLanguage, targetLanguage } = data;
     const apiKey = functions.config().gemini.key; // Store in environment

     const response = await fetch(
       `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
       {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           contents: [{
             parts: [{
               text: `Translate from ${sourceLanguage} to ${targetLanguage}: ${text}`
             }]
           }]
         })
       }
     );

     return await response.json();
   });
   ```

   Then update `translationService.js`:
   ```javascript
   async translateText(text, sourceLanguage, targetLanguage) {
     const translateFunction = firebase.functions().httpsCallable('translate');
     const result = await translateFunction({ text, sourceLanguage, targetLanguage });
     return result.data;
   }
   ```

## XSS Prevention

All user-generated content in chat messages is now sanitized using the `escapeHtml()` utility function:

- Message text is HTML-escaped before display
- Attachment names are HTML-escaped
- Attachment URLs are HTML-escaped
- Event handlers are attached via JavaScript instead of inline `onclick`

This prevents malicious users from injecting JavaScript code into messages.

## Firestore Security Rules

### Invoice Creation
- Buyers can only create invoices for orders they placed
- Sellers can only read/update invoices for their orders
- Proper authentication and role checks are in place

### Counter Access
- Restricted to only the 'invoices' counter document
- Only authenticated users can access
- Prevents manipulation of other potential counters

### Chat Security
- Users can only read/write chats they participate in
- Messages are restricted to sender/receiver
- File uploads are validated by Storage rules

## File Upload Security

### Client-Side Validation (dataService.js)
- Maximum file size: 10MB
- Allowed types: images (JPEG, PNG, GIF, WebP), videos (MP4, WebM, QuickTime), PDFs
- Files are validated before upload

### Storage Rules (storage.rules)
- Server-side validation of file types
- Server-side validation of file sizes
- Path-based access control
- Files stored in `/chats/{chatId}/` directories

## Authentication Security

All protected routes require:
1. User must be authenticated (Firebase Auth)
2. User must have appropriate role (buyer/seller)
3. Role verification happens on both client and server (Firestore rules)

## Best Practices Implemented

✅ HTML escaping for all user content
✅ Role-based access control
✅ File type and size validation
✅ Secure Firestore rules
✅ Transaction-based counter increments (prevents race conditions)
✅ No inline event handlers
✅ Proper error handling

## Monitoring and Auditing

**Recommended:**
1. Monitor Gemini API usage in Google Cloud Console
2. Review Firestore usage and costs regularly
3. Check Firebase Storage for unusual activity
4. Enable Firebase Security Rules logs
5. Set up alerts for quota violations

## Additional Security Enhancements (Future)

Consider implementing:
- Rate limiting on API calls
- Content moderation for chat messages
- User reporting system
- IP-based access restrictions
- Two-factor authentication
- Audit logs for sensitive operations
