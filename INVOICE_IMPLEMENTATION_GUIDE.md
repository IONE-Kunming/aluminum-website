# Invoice Implementation Guide

This guide provides step-by-step instructions for implementing invoice functionality in the aluminum website.

## Overview

Invoices will be automatically generated when a buyer submits an order. Both buyers and sellers can view their invoices, and sellers can download/print them.

## Architecture

### Flow
1. Buyer completes checkout → Order created
2. System automatically generates invoice → Invoice created in Firestore
3. Buyer can view invoice in `/buyer/invoices`
4. Seller can view invoice in `/seller/invoices`
5. Both can download/print invoice as PDF

### Components
- **dataService.js** - Invoice CRUD operations
- **invoices.js** - Buyer invoice list page
- **seller-invoices.js** - Seller invoice list page
- **invoice-detail.js** (NEW) - Single invoice view with print/download
- **checkout.js** - Trigger invoice creation after order

---

## Implementation Steps

### Step 1: Add Invoice Methods to dataService.js

Add these methods to `/public/js/dataService.js`:

```javascript
// Generate unique invoice number
async generateInvoiceNumber() {
  await this.init();
  
  try {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    // Get the latest invoice to determine next number
    const snapshot = await this.db
      .collection('invoices')
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    
    let nextNumber = 1;
    if (!snapshot.empty) {
      const lastInvoice = snapshot.docs[0].data();
      // Extract number from invoice number like "INV-2024-00001"
      const match = lastInvoice.invoiceNumber?.match(/INV-(\d{4})-(\d{5})/);
      if (match) {
        nextNumber = parseInt(match[2]) + 1;
      }
    }
    
    const year = new Date().getFullYear();
    const invoiceNumber = `INV-${year}-${String(nextNumber).padStart(5, '0')}`;
    
    return invoiceNumber;
  } catch (error) {
    console.error('Error generating invoice number:', error);
    // Fallback to timestamp-based number
    return `INV-${Date.now()}`;
  }
}

// Create invoice from order
async createInvoice(orderId) {
  await this.init();
  
  try {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    // Get order data
    const orderDoc = await this.db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      throw new Error('Order not found');
    }
    
    const order = orderDoc.data();
    
    // Get seller info
    const sellerDoc = await this.db.collection('users').doc(order.sellerId).get();
    const sellerData = sellerDoc.exists ? sellerDoc.data() : {};
    
    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber();
    
    // Calculate due date (30 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    
    // Create invoice data
    const invoiceData = {
      invoiceNumber: invoiceNumber,
      orderId: orderId,
      
      // Buyer information
      buyerId: order.buyerId,
      buyerName: order.buyerName || 'N/A',
      buyerEmail: order.buyerEmail || 'N/A',
      buyerCompany: order.buyerCompany || 'N/A',
      buyerAddress: order.buyerAddress || {
        street: '',
        city: '',
        state: '',
        zip: '',
        country: ''
      },
      
      // Seller information
      sellerId: order.sellerId,
      sellerName: sellerData.displayName || 'N/A',
      sellerEmail: sellerData.email || 'N/A',
      sellerCompany: sellerData.company || 'N/A',
      sellerAddress: sellerData.address || {
        street: '',
        city: '',
        state: '',
        zip: '',
        country: ''
      },
      
      // Items
      items: order.items || [],
      
      // Amounts
      subtotal: order.subtotal || 0,
      tax: order.tax || 0,
      taxRate: order.taxRate || 10,
      total: order.total || 0,
      depositPaid: order.depositAmount || 0,
      remainingBalance: order.remainingBalance || 0,
      
      // Payment info
      paymentMethod: order.paymentMethod || 'N/A',
      paymentTerms: `${order.depositPercentage || 30}% deposit, ${100 - (order.depositPercentage || 30)}% on delivery`,
      
      // Dates
      dueDate: firebase.firestore.Timestamp.fromDate(dueDate),
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      
      // Status
      status: 'issued', // issued, paid, overdue, cancelled
      
      // Notes
      notes: 'Thank you for your business!'
    };
    
    // Create invoice
    const invoiceRef = await this.db.collection('invoices').add(invoiceData);
    
    console.log('Invoice created successfully:', invoiceRef.id, invoiceNumber);
    
    return {
      success: true,
      invoiceId: invoiceRef.id,
      invoiceNumber: invoiceNumber
    };
    
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw error;
  }
}

// Get invoices for user
async getInvoices(filters = {}) {
  await this.init();
  
  try {
    if (!this.db) {
      return [];
    }
    
    let query = this.db.collection('invoices');
    
    // Apply filters
    if (filters.buyerId) {
      query = query.where('buyerId', '==', filters.buyerId);
    }
    
    if (filters.sellerId) {
      query = query.where('sellerId', '==', filters.sellerId);
    }
    
    if (filters.status) {
      query = query.where('status', '==', filters.status);
    }
    
    // Try to order by creation date descending
    try {
      const orderedQuery = query.orderBy('createdAt', 'desc');
      const snapshot = await orderedQuery.get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (indexError) {
      // If index error, try without orderBy
      console.warn('Firestore index not available for invoices, fetching without ordering:', indexError);
      const snapshot = await query.get();
      
      // Sort in memory
      const invoices = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by createdAt
      invoices.sort((a, b) => {
        const dateA = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt)) : new Date(0);
        const dateB = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt)) : new Date(0);
        return dateB - dateA;
      });
      
      return invoices;
    }
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return [];
  }
}

// Get single invoice
async getInvoice(invoiceId) {
  await this.init();
  
  try {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    const doc = await this.db.collection('invoices').doc(invoiceId).get();
    
    if (!doc.exists) {
      throw new Error('Invoice not found');
    }
    
    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error('Error fetching invoice:', error);
    throw error;
  }
}

// Update invoice status
async updateInvoiceStatus(invoiceId, status) {
  await this.init();
  
  try {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    const updateData = {
      status: status,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // If marking as paid, set paidAt timestamp
    if (status === 'paid') {
      updateData.paidAt = firebase.firestore.FieldValue.serverTimestamp();
    }
    
    await this.db.collection('invoices').doc(invoiceId).update(updateData);
    
    console.log('Invoice status updated:', invoiceId, status);
    
    return { success: true };
  } catch (error) {
    console.error('Error updating invoice status:', error);
    throw error;
  }
}
```

### Step 2: Update checkout.js to Create Invoice

Modify `/public/pages/checkout.js` to create invoice after order creation:

```javascript
// After successful order creation (around line 350-365)
// Find the section where orders are created and add invoice creation

// Existing code:
const result = await dataService.createOrdersBatch(ordersData);

if (result.success) {
  console.log('Orders created successfully:', result.orderIds);
  
  // NEW: Create invoices for each order
  try {
    const invoicePromises = result.orderIds.map(orderId => 
      dataService.createInvoice(orderId)
        .catch(error => {
          console.error('Error creating invoice for order:', orderId, error);
          return null; // Don't fail checkout if invoice creation fails
        })
    );
    
    const invoiceResults = await Promise.all(invoicePromises);
    const successfulInvoices = invoiceResults.filter(r => r !== null);
    console.log('Invoices created:', successfulInvoices.length, 'of', result.orderIds.length);
  } catch (invoiceError) {
    console.error('Error creating invoices:', invoiceError);
    // Continue with checkout even if invoice creation fails
  }
  
  // Continue with existing redirect logic...
}
```

### Step 3: Update Buyer Invoices Page

Replace `/public/pages/invoices.js` with:

```javascript
import { renderPageWithLayout } from '../js/layout.js';
import languageManager from '../js/language.js';
import authManager from '../js/auth.js';
import dataService from '../js/dataService.js';
import { escapeHtml, formatDate } from '../js/utils.js';
import router from '../js/router.js';

export async function renderInvoices() {
  const t = languageManager.t.bind(languageManager);
  
  // Get current user
  const user = authManager.getCurrentUser();
  if (!user) {
    const content = `
      <div class="invoices-page">
        <div class="page-header">
          <h1>${t('invoices.title')}</h1>
          <p>${t('invoices.subtitle')}</p>
        </div>
        <div class="empty-state">
          <i data-lucide="alert-circle" style="width: 64px; height: 64px; opacity: 0.3;"></i>
          <h2>Not Authenticated</h2>
          <p>Please log in to view your invoices</p>
        </div>
      </div>
    `;
    renderPageWithLayout(content, 'buyer');
    if (window.lucide) window.lucide.createIcons();
    return;
  }
  
  // Fetch invoices for this buyer
  const invoices = await dataService.getInvoices({ buyerId: user.uid });
  
  const content = `
    <div class="invoices-page">
      <div class="page-header">
        <h1>${t('invoices.title') || 'Invoices'}</h1>
        <p>${t('invoices.subtitle') || 'View and download your invoices'}</p>
      </div>

      ${invoices.length === 0 ? `
        <div class="empty-state">
          <i data-lucide="file-text" style="width: 64px; height: 64px; opacity: 0.3;"></i>
          <h2>No invoices yet</h2>
          <p>Your invoices will appear here after order completion</p>
        </div>
      ` : `
        <div class="invoices-list">
          ${invoices.map(invoice => `
            <div class="invoice-card card" style="cursor: pointer;" data-invoice-id="${invoice.id}">
              <div class="invoice-header">
                <div class="invoice-info">
                  <h3>${escapeHtml(invoice.invoiceNumber)}</h3>
                  <span class="invoice-date">${formatDate(invoice.createdAt)}</span>
                </div>
                <div class="invoice-status">
                  <span class="status-badge status-${invoice.status}">${invoice.status}</span>
                </div>
              </div>
              
              <div class="invoice-details">
                <p><strong>Seller:</strong> ${escapeHtml(invoice.sellerCompany || invoice.sellerName || 'N/A')}</p>
                <p><strong>Items:</strong> ${invoice.items?.length || 0}</p>
              </div>
              
              <div class="invoice-summary">
                <div class="invoice-summary-row">
                  <span>Total:</span>
                  <span class="invoice-total">$${invoice.total?.toFixed(2) || '0.00'}</span>
                </div>
                <div class="invoice-summary-row">
                  <span>Paid:</span>
                  <span class="text-success">$${invoice.depositPaid?.toFixed(2) || '0.00'}</span>
                </div>
                <div class="invoice-summary-row">
                  <span>Balance Due:</span>
                  <span class="text-warning">$${invoice.remainingBalance?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
              
              <div class="invoice-actions">
                <button class="btn btn-secondary btn-sm view-invoice-btn" data-invoice-id="${invoice.id}">
                  <i data-lucide="eye"></i>
                  View Details
                </button>
                <button class="btn btn-secondary btn-sm download-invoice-btn" data-invoice-id="${invoice.id}">
                  <i data-lucide="download"></i>
                  Download
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;
  
  renderPageWithLayout(content, 'buyer');
  if (window.lucide) window.lucide.createIcons();
  
  // Add event listeners
  document.querySelectorAll('.view-invoice-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const invoiceId = btn.dataset.invoiceId;
      router.navigate(`/buyer/invoice?id=${invoiceId}`);
    });
  });
  
  document.querySelectorAll('.download-invoice-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const invoiceId = btn.dataset.invoiceId;
      // TODO: Implement PDF download
      alert('PDF download will be implemented in next phase');
    });
  });
  
  document.querySelectorAll('.invoice-card').forEach(card => {
    card.addEventListener('click', () => {
      const invoiceId = card.dataset.invoiceId;
      router.navigate(`/buyer/invoice?id=${invoiceId}`);
    });
  });
}
```

### Step 4: Update Seller Invoices Page

Similar to buyer page, update `/public/pages/seller-invoices.js` to fetch and display seller's invoices.

### Step 5: Create Invoice Detail Page

Create `/public/pages/invoice-detail.js`:

```javascript
import { renderPageWithLayout } from '../js/layout.js';
import authManager from '../js/auth.js';
import dataService from '../js/dataService.js';
import { escapeHtml, formatDate } from '../js/utils.js';

export async function renderInvoiceDetail() {
  // Get invoice ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const invoiceId = urlParams.get('id');
  
  if (!invoiceId) {
    renderPageWithLayout('<div class="error">Invoice ID not provided</div>', 'buyer');
    return;
  }
  
  try {
    const invoice = await dataService.getInvoice(invoiceId);
    const user = authManager.getCurrentUser();
    
    // Verify user has access
    if (invoice.buyerId !== user.uid && invoice.sellerId !== user.uid) {
      renderPageWithLayout('<div class="error">Access denied</div>', 'buyer');
      return;
    }
    
    const isBuyer = invoice.buyerId === user.uid;
    
    const content = `
      <div class="invoice-detail-page">
        <div class="invoice-actions-header">
          <button class="btn btn-text" onclick="history.back()">
            <i data-lucide="arrow-left"></i>
            Back
          </button>
          <div class="invoice-actions">
            <button class="btn btn-secondary" id="print-invoice-btn">
              <i data-lucide="printer"></i>
              Print
            </button>
            <button class="btn btn-primary" id="download-invoice-btn">
              <i data-lucide="download"></i>
              Download PDF
            </button>
          </div>
        </div>
        
        <div class="invoice-document" id="invoice-document">
          <div class="invoice-header-section">
            <div class="invoice-logo">
              <h1>INVOICE</h1>
              <p class="invoice-number">${escapeHtml(invoice.invoiceNumber)}</p>
            </div>
            <div class="invoice-dates">
              <p><strong>Date:</strong> ${formatDate(invoice.createdAt)}</p>
              <p><strong>Due Date:</strong> ${formatDate(invoice.dueDate)}</p>
            </div>
          </div>
          
          <div class="invoice-parties">
            <div class="invoice-party">
              <h3>From:</h3>
              <p><strong>${escapeHtml(invoice.sellerCompany)}</strong></p>
              <p>${escapeHtml(invoice.sellerName)}</p>
              <p>${escapeHtml(invoice.sellerEmail)}</p>
              ${invoice.sellerAddress ? `
                <p>${escapeHtml(invoice.sellerAddress.street)}</p>
                <p>${escapeHtml(invoice.sellerAddress.city)}, ${escapeHtml(invoice.sellerAddress.state)} ${escapeHtml(invoice.sellerAddress.zip)}</p>
                <p>${escapeHtml(invoice.sellerAddress.country)}</p>
              ` : ''}
            </div>
            <div class="invoice-party">
              <h3>Bill To:</h3>
              <p><strong>${escapeHtml(invoice.buyerCompany)}</strong></p>
              <p>${escapeHtml(invoice.buyerName)}</p>
              <p>${escapeHtml(invoice.buyerEmail)}</p>
              ${invoice.buyerAddress ? `
                <p>${escapeHtml(invoice.buyerAddress.street)}</p>
                <p>${escapeHtml(invoice.buyerAddress.city)}, ${escapeHtml(invoice.buyerAddress.state)} ${escapeHtml(invoice.buyerAddress.zip)}</p>
                <p>${escapeHtml(invoice.buyerAddress.country)}</p>
              ` : ''}
            </div>
          </div>
          
          <table class="invoice-items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map(item => `
                <tr>
                  <td>
                    <strong>${escapeHtml(item.productName)}</strong>
                    ${item.description ? `<br><small>${escapeHtml(item.description)}</small>` : ''}
                  </td>
                  <td>${item.quantity} ${escapeHtml(item.unit || 'units')}</td>
                  <td>$${item.pricePerUnit?.toFixed(2) || '0.00'}</td>
                  <td>$${item.subtotal?.toFixed(2) || '0.00'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="invoice-totals">
            <div class="invoice-total-row">
              <span>Subtotal:</span>
              <span>$${invoice.subtotal?.toFixed(2) || '0.00'}</span>
            </div>
            <div class="invoice-total-row">
              <span>Tax (${invoice.taxRate || 10}%):</span>
              <span>$${invoice.tax?.toFixed(2) || '0.00'}</span>
            </div>
            <div class="invoice-total-row invoice-total-main">
              <span>Total:</span>
              <span>$${invoice.total?.toFixed(2) || '0.00'}</span>
            </div>
            <div class="invoice-total-row">
              <span>Deposit Paid:</span>
              <span class="text-success">$${invoice.depositPaid?.toFixed(2) || '0.00'}</span>
            </div>
            <div class="invoice-total-row">
              <span>Balance Due:</span>
              <span class="text-warning">$${invoice.remainingBalance?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
          
          <div class="invoice-payment-info">
            <p><strong>Payment Method:</strong> ${escapeHtml(invoice.paymentMethod)}</p>
            <p><strong>Payment Terms:</strong> ${escapeHtml(invoice.paymentTerms)}</p>
          </div>
          
          ${invoice.notes ? `
            <div class="invoice-notes">
              <p><strong>Notes:</strong></p>
              <p>${escapeHtml(invoice.notes)}</p>
            </div>
          ` : ''}
        </div>
      </div>
    `;
    
    renderPageWithLayout(content, isBuyer ? 'buyer' : 'seller');
    if (window.lucide) window.lucide.createIcons();
    
    // Print button
    document.getElementById('print-invoice-btn').addEventListener('click', () => {
      window.print();
    });
    
    // Download button (placeholder)
    document.getElementById('download-invoice-btn').addEventListener('click', () => {
      alert('PDF download will be implemented in next phase using a library like jsPDF');
    });
    
  } catch (error) {
    console.error('Error loading invoice:', error);
    renderPageWithLayout('<div class="error">Failed to load invoice</div>', 'buyer');
  }
}
```

### Step 6: Register Routes

Add invoice routes to `/public/js/app.js`:

```javascript
router.addRoute('/buyer/invoice', () => import('./pages/invoice-detail.js').then(m => m.renderInvoiceDetail()));
router.addRoute('/seller/invoice', () => import('./pages/invoice-detail.js').then(m => m.renderInvoiceDetail()));
```

### Step 7: Add Firestore Index for Invoices

Add to `firestore.indexes.json`:

```json
{
  "collectionGroup": "invoices",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "buyerId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "invoices",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "sellerId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

---

## Testing

### Test Invoice Creation
1. Login as buyer
2. Add items to cart
3. Complete checkout
4. Verify order is created
5. Verify invoice is created automatically
6. Check Firestore console for invoice document

### Test Invoice Display
1. Navigate to `/buyer/invoices`
2. Verify invoices are listed
3. Click on an invoice
4. Verify invoice details are displayed
5. Test print button
6. Test download button (will show placeholder alert)

### Test Seller View
1. Login as seller
2. Navigate to `/seller/invoices`
3. Verify seller can see invoices for their orders
4. Verify invoice details match order data

---

## Future Enhancements

1. **PDF Generation**
   - Use jsPDF library to generate downloadable PDFs
   - Include company logo
   - Professional invoice template

2. **Email Invoices**
   - Send invoice via email to buyer
   - Use Firebase Cloud Functions + SendGrid/Mailgun
   - Include PDF attachment

3. **Invoice Status Updates**
   - Allow sellers to mark invoices as paid
   - Send payment reminders
   - Track overdue invoices

4. **Advanced Features**
   - Recurring invoices
   - Partial payments
   - Invoice templates
   - Multi-currency support

---

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify Firestore indexes are deployed
3. Verify security rules allow invoice access
4. Check order data has all required fields

