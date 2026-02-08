# Firebase Rules Update

## Issues Fixed

### 1. Order Timestamp Issue
**Problem**: Orders were created with JavaScript Date strings instead of Firestore Timestamps, causing issues with queries and display.

**Solution**: Updated `checkout.js` to use `firebase.firestore.FieldValue.serverTimestamp()` for both `createdAt` and `updatedAt` fields.

### 2. Cart Buttons Not Working  
**Problem**: Plus and minus buttons in cart page not responding to clicks.

**Solutions Applied**:
- Added `type="button"` attribute to quantity buttons
- Added CSS `pointer-events: none` to icons inside buttons to prevent icon clicks from blocking button clicks

### 3. Order Display in Buyer Dashboard
**Problem**: Buyer dashboard trying to access non-existent order properties.

**Solution**: Updated buyer dashboard to properly extract data from the `items` array and `sellerName` field in orders.

## Recommended Firebase Rules Updates

### Current Rules - Orders Collection
```javascript
// Orders collection
match /orders/{orderId} {
  // Buyers can read their own orders
  allow read: if isAuthenticated() && 
                 resource.data.buyerId == request.auth.uid;
  // Buyers can create orders
  allow create: if hasRole('buyer');
  // Sellers can read orders containing their products
  allow read: if isAuthenticated() && 
                 hasRole('seller');
  // Sellers can update order status
  allow update: if hasRole('seller');
  // Admins can do anything
  allow read, write: if hasRole('admin');
}
```

### Recommended Rules - Orders Collection
```javascript
// Orders collection
match /orders/{orderId} {
  // Buyers can read their own orders
  allow read: if isAuthenticated() && 
                 resource.data.buyerId == request.auth.uid;
  // Buyers can create orders
  allow create: if isAuthenticated() && 
                   hasRole('buyer') &&
                   request.resource.data.buyerId == request.auth.uid;
  // Sellers can read their own orders
  allow read: if isAuthenticated() && 
                 hasRole('seller') &&
                 resource.data.sellerId == request.auth.uid;
  // Sellers can update their own order status
  allow update: if isAuthenticated() &&
                   hasRole('seller') &&
                   resource.data.sellerId == request.auth.uid;
  // Admins can do anything
  allow read, write: if hasRole('admin');
}
```

### Key Changes:
1. **Sellers can only read their own orders** - Changed from allowing all sellers to read all orders, to only allowing sellers to read orders where they are the seller
2. **Sellers can only update their own orders** - Added check that seller can only update orders where they are the seller
3. **Buyers must set their own buyerId** - Added validation that buyers can only create orders with their own user ID

## Understanding Revenue Calculation

The seller dashboard shows:
- **Total Orders**: All orders for the seller (pending, processing, delivered, etc.)
- **Revenue**: Only orders with status 'delivered' (completed orders)
- **Active Orders**: Orders with status 'pending' or 'processing'

This is correct behavior - revenue should only count completed/paid orders, not pending ones.

If you want to show "potential revenue" or "pending revenue", you can add that as a separate metric:

```javascript
const pendingRevenue = orders
  .filter(o => ['pending', 'processing'].includes(o.status?.toLowerCase()))
  .reduce((sum, order) => sum + (order.total || 0), 0);
```

## Testing Checklist

- [ ] Create a new order as a buyer
- [ ] Verify order appears in buyer's "Orders" page
- [ ] Verify order appears in seller's "Orders" page  
- [ ] Verify order count increases on seller dashboard
- [ ] Change order status to 'delivered'
- [ ] Verify revenue updates on seller dashboard
- [ ] Test cart plus/minus buttons
- [ ] Test cart quantity input
- [ ] Verify all Firestore queries work with serverTimestamp

## Firebase Console Commands

To update the Firestore rules in Firebase Console:
1. Go to Firebase Console → Firestore Database → Rules
2. Copy the recommended rules from above
3. Click "Publish"

To update the Storage rules in Firebase Console:
1. Go to Firebase Console → Storage → Rules
2. The current storage rules are fine, no changes needed
3. Ensure the rules allow public read for product images
