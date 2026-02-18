// Utility functions for the application

// HTML escaping to prevent XSS attacks
export function escapeHtml(unsafe) {
  if (unsafe === null || unsafe === undefined) {
    return '';
  }
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Sanitize URL to prevent javascript: protocol attacks
export function sanitizeUrl(url) {
  if (!url) return '';
  
  // Convert to string and trim
  const urlStr = String(url).trim();
  
  // Check for dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  const lowerUrl = urlStr.toLowerCase();
  
  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      console.warn('Blocked dangerous URL protocol:', urlStr);
      return '';
    }
  }
  
  // Only allow http(s) or relative URLs
  if (!urlStr.startsWith('http://') && !urlStr.startsWith('https://') && !urlStr.startsWith('/')) {
    console.warn('Blocked non-http(s) URL:', urlStr);
    return '';
  }
  
  return urlStr;
}

// Format currency
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

// Format date
export function formatDate(date) {
  if (!date) return '';
  const d = date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Debounce function
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Export invoice to CSV format
export function exportInvoiceToCSV(invoice) {
  const rows = [];
  
  // Header information
  rows.push(['Invoice Details']);
  rows.push(['Invoice Number', invoice.invoiceNumber || '']);
  rows.push(['Date', formatDate(invoice.createdAt)]);
  rows.push(['Status', invoice.status || '']);
  rows.push([]);
  
  // Seller information
  rows.push(['Seller Information']);
  rows.push(['Company', invoice.sellerCompany || 'HK KANDIVAN I T C L']);
  rows.push(['Email', invoice.sellerEmail || 'contactus@ione.live']);
  rows.push(['Phone', invoice.sellerPhone || '008613332800284']);
  if (invoice.sellerAddress && invoice.sellerAddress.street) {
    rows.push(['Address', `${invoice.sellerAddress.street}, ${invoice.sellerAddress.city || 'Shenzhen'}, ${invoice.sellerAddress.country || 'China'}`]);
  }
  rows.push([]);
  
  // Buyer information
  rows.push(['Buyer Information']);
  rows.push(['Company', invoice.buyerCompany || invoice.buyerName || 'N/A']);
  rows.push(['Email', invoice.buyerEmail || 'N/A']);
  if (invoice.buyerPhone) {
    rows.push(['Phone', invoice.buyerPhone]);
  }
  if (invoice.buyerAddress && invoice.buyerAddress.street) {
    rows.push(['Address', `${invoice.buyerAddress.street}, ${invoice.buyerAddress.city || ''}, ${invoice.buyerAddress.country || ''}`]);
  }
  rows.push([]);
  
  // Payment instructions
  if (invoice.paymentInstructions) {
    rows.push(['Payment Instructions']);
    rows.push(['Bank Name', invoice.paymentInstructions.bankName || 'N/A']);
    rows.push(['Account Name', invoice.paymentInstructions.accountName || 'N/A']);
    rows.push(['Account Number', invoice.paymentInstructions.accountNumber || 'N/A']);
    rows.push(['SWIFT Code', invoice.paymentInstructions.swiftCode || 'N/A']);
    rows.push([]);
  }
  
  // Order items
  rows.push(['Order Items']);
  rows.push(['Product Name', 'Quantity', 'Unit', 'Price per Unit', 'Subtotal']);
  (invoice.items || []).forEach(item => {
    rows.push([
      item.productName || 'N/A',
      item.quantity || 0,
      item.unit || 'units',
      `$${(item.pricePerUnit || 0).toFixed(2)}`,
      `$${(item.subtotal || 0).toFixed(2)}`
    ]);
  });
  rows.push([]);
  
  // Totals
  rows.push(['Financial Summary']);
  rows.push(['Subtotal', `$${(invoice.subtotal || 0).toFixed(2)}`]);
  if (invoice.tax && invoice.tax > 0) {
    rows.push(['Tax', `$${(invoice.tax || 0).toFixed(2)}`]);
  }
  rows.push(['Total Amount', `$${(invoice.total || 0).toFixed(2)}`]);
  rows.push([]);
  
  // Payment terms
  rows.push(['Payment Terms']);
  rows.push(['Payment Term', invoice.paymentTerms || 'N/A']);
  if (invoice.depositPaid && invoice.depositPaid > 0) {
    rows.push(['Deposit Paid', `$${(invoice.depositPaid || 0).toFixed(2)}`]);
    rows.push(['Balance Due', `$${(invoice.remainingBalance || 0).toFixed(2)}`]);
  }
  rows.push([]);
  
  // Terms and conditions
  if (invoice.termsAndConditions && invoice.termsAndConditions.length > 0) {
    rows.push(['Terms and Conditions']);
    invoice.termsAndConditions.forEach((term, index) => {
      rows.push([`${index + 1}. ${term}`]);
    });
    rows.push([]);
  }
  
  // Notes
  if (invoice.notes) {
    rows.push(['Notes', invoice.notes]);
  }
  
  // Convert to CSV format
  const csvContent = rows.map(row => {
    return row.map(cell => {
      // Escape double quotes and wrap in quotes if contains comma or quote
      const cellStr = String(cell || '');
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    }).join(',');
  }).join('\n');
  
  // Trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `invoice-${invoice.invoiceNumber || 'export'}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export invoice to TXT format
export function exportInvoiceToTXT(invoice) {
  const lines = [];
  
  lines.push('='.repeat(80));
  lines.push('INVOICE');
  lines.push('='.repeat(80));
  lines.push('');
  
  // Header information
  lines.push(`Invoice Number: ${invoice.invoiceNumber || 'N/A'}`);
  lines.push(`Date: ${formatDate(invoice.createdAt)}`);
  lines.push(`Status: ${(invoice.status || '').toUpperCase()}`);
  lines.push('');
  lines.push('-'.repeat(80));
  lines.push('');
  
  // Seller information
  lines.push('SELLER INFORMATION');
  lines.push('-'.repeat(80));
  lines.push(`Company: ${invoice.sellerCompany || 'HK KANDIVAN I T C L'}`);
  lines.push(`Email: ${invoice.sellerEmail || 'contactus@ione.live'}`);
  lines.push(`Phone: ${invoice.sellerPhone || '008613332800284'}`);
  if (invoice.sellerAddress && invoice.sellerAddress.street) {
    lines.push(`Address: ${invoice.sellerAddress.street}`);
    lines.push(`         ${invoice.sellerAddress.city || 'Shenzhen'}, ${invoice.sellerAddress.state || 'Guangdong'}`);
    lines.push(`         ${invoice.sellerAddress.country || 'China'}`);
  } else {
    lines.push('Address: Hua Qiang Bei, Shenzhen, Guangdong, China');
  }
  lines.push('');
  
  // Buyer information
  lines.push('BUYER INFORMATION');
  lines.push('-'.repeat(80));
  lines.push(`Company: ${invoice.buyerCompany || invoice.buyerName || 'N/A'}`);
  lines.push(`Email: ${invoice.buyerEmail || 'N/A'}`);
  if (invoice.buyerPhone) {
    lines.push(`Phone: ${invoice.buyerPhone}`);
  }
  if (invoice.buyerAddress && invoice.buyerAddress.street) {
    lines.push(`Address: ${invoice.buyerAddress.street}`);
    lines.push(`         ${invoice.buyerAddress.city || ''}, ${invoice.buyerAddress.state || ''}`);
    if (invoice.buyerAddress.country) {
      lines.push(`         ${invoice.buyerAddress.country}`);
    }
  }
  lines.push('');
  lines.push('-'.repeat(80));
  lines.push('');
  
  // Payment instructions
  if (invoice.paymentInstructions) {
    lines.push('PAYMENT INSTRUCTIONS');
    lines.push('-'.repeat(80));
    lines.push(`Bank Name: ${invoice.paymentInstructions.bankName || 'N/A'}`);
    lines.push(`Account Name: ${invoice.paymentInstructions.accountName || 'N/A'}`);
    lines.push(`Account Number: ${invoice.paymentInstructions.accountNumber || 'N/A'}`);
    lines.push(`SWIFT Code: ${invoice.paymentInstructions.swiftCode || 'N/A'}`);
    lines.push('');
    lines.push('-'.repeat(80));
    lines.push('');
  }
  
  // Order items
  lines.push('ORDER ITEMS');
  lines.push('-'.repeat(80));
  lines.push(String('Product Name').padEnd(30) + String('Qty').padEnd(10) + String('Unit').padEnd(10) + String('Price').padEnd(15) + 'Subtotal');
  lines.push('-'.repeat(80));
  (invoice.items || []).forEach(item => {
    const name = (item.productName || 'N/A').substring(0, 28);
    const qty = String(item.quantity || 0);
    const unit = (item.unit || 'units').substring(0, 8);
    const price = `$${(item.pricePerUnit || 0).toFixed(2)}`;
    const subtotal = `$${(item.subtotal || 0).toFixed(2)}`;
    lines.push(name.padEnd(30) + qty.padEnd(10) + unit.padEnd(10) + price.padEnd(15) + subtotal);
  });
  lines.push('-'.repeat(80));
  lines.push('');
  
  // Totals
  lines.push('FINANCIAL SUMMARY');
  lines.push('-'.repeat(80));
  lines.push(`Subtotal: $${(invoice.subtotal || 0).toFixed(2)}`);
  if (invoice.tax && invoice.tax > 0) {
    lines.push(`Tax (${invoice.taxRate || 10}%): $${(invoice.tax || 0).toFixed(2)}`);
  }
  lines.push(`Total Amount: $${(invoice.total || 0).toFixed(2)}`);
  lines.push('');
  
  // Payment terms
  lines.push('PAYMENT TERMS');
  lines.push('-'.repeat(80));
  lines.push(`Payment Term: ${invoice.paymentTerms || 'N/A'}`);
  if (invoice.depositPaid && invoice.depositPaid > 0) {
    lines.push(`Deposit Paid: $${(invoice.depositPaid || 0).toFixed(2)}`);
    lines.push(`Balance Due: $${(invoice.remainingBalance || 0).toFixed(2)}`);
  }
  lines.push('');
  lines.push('-'.repeat(80));
  lines.push('');
  
  // Terms and conditions
  if (invoice.termsAndConditions && invoice.termsAndConditions.length > 0) {
    lines.push('TERMS AND CONDITIONS');
    lines.push('-'.repeat(80));
    invoice.termsAndConditions.forEach((term, index) => {
      lines.push(`${index + 1}. ${term}`);
    });
    lines.push('');
    lines.push('-'.repeat(80));
    lines.push('');
  }
  
  // Notes
  if (invoice.notes) {
    lines.push('NOTES');
    lines.push('-'.repeat(80));
    lines.push(invoice.notes);
    lines.push('');
    lines.push('-'.repeat(80));
    lines.push('');
  }
  
  // Footer
  lines.push('');
  lines.push('For questions about this invoice, please contact:');
  lines.push(invoice.sellerEmail || 'contactus@ione.live');
  lines.push('');
  lines.push('Thank you for your business!');
  lines.push('');
  lines.push('='.repeat(80));
  
  const txtContent = lines.join('\n');
  
  // Trigger download
  const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `invoice-${invoice.invoiceNumber || 'export'}.txt`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
