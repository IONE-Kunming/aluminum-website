# Enhanced Invoice Visual Structure

## Page 1 - Invoice Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                         INVOICE                                 │
│                      INV-2026-00001                            │
│ ──────────────────────────────────────────────────────────────│
│                                                                 │
│  From:                              Bill To:                   │
│  ┌──────────────────┐              ┌──────────────────┐       │
│  │ ABC Aluminum Co. │              │ XYZ Construction │       │
│  │ John Seller      │              │ Jane Buyer       │       │
│  │ seller@email.com │              │ buyer@email.com  │       │
│  │ 123 Main St      │              │ 456 Oak Ave      │       │
│  │ Shanghai, China  │              │ New York, USA    │       │
│  └──────────────────┘              └──────────────────┘       │
│                                                                 │
│ ──────────────────────────────────────────────────────────────│
│                                                                 │
│  ORDER SUMMARY                                                 │
│  ┌────────────────────────────────────────┐                   │
│  │ Total Items                │ 5 item(s) │                   │
│  └────────────────────────────────────────┘                   │
│                                                                 │
│ ──────────────────────────────────────────────────────────────│
│                                                                 │
│  TOTALS                                    ┌─────────────┐    │
│                                            │ Subtotal:   │    │
│                                            │ $5,000.00   │    │
│                                            │             │    │
│                                            │ Tax (10%):  │    │
│                                            │ $500.00     │    │
│                                            │             │    │
│                                            │ TOTAL:      │    │
│                                            │ $5,500.00   │    │
│                                            │             │    │
│                                            │ Deposit:    │    │
│                                            │ $1,650.00   │    │
│                                            │             │    │
│                                            │ Balance:    │    │
│                                            │ $3,850.00   │    │
│                                            └─────────────┘    │
│                                                                 │
│ ──────────────────────────────────────────────────────────────│
│                                                                 │
│  PAYMENT TERMS                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ 30% deposit, 70% on delivery                             │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ──────────────────────────────────────────────────────────────│
│                                                                 │
│  PAYMENT INSTRUCTIONS                                          │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Payment Method:  Bank Transfer                           │ │
│  │ Bank Name:       Bank of China                           │ │
│  │ Account Name:    ABC Aluminum Co.                        │ │
│  │ Account Number:  1234-5678-9012-3456                     │ │
│  │ SWIFT Code:      BKCHCNBJ                                │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ──────────────────────────────────────────────────────────────│
│                                                                 │
│  TERMS AND CONDITIONS                                          │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ 1. Payment must be made within 30 days of invoice date. │ │
│  │ 2. Late payments may incur additional charges.           │ │
│  │ 3. All prices are in USD unless otherwise specified.     │ │
│  │ 4. Products are non-refundable once delivered.           │ │
│  │ 5. Buyer is responsible for import duties and taxes.     │ │
│  │ 6. Seller retains ownership until full payment.          │ │
│  │ 7. Disputes resolved through arbitration.                │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Notes: Thank you for your business!                           │
└─────────────────────────────────────────────────────────────────┘
```

## Page 2 - Order Details

```
┌─────────────────────────────────────────────────────────────────┐
│  INVOICE                         INV-2026-00001                │
│ ──────────────────────────────────────────────────────────────│
│                                                                 │
│  ORDER DETAILS                                                 │
│                                                                 │
│  ┌────┬──────────────┬──────────┬────────────┬──────────────┐│
│  │ #  │ Description  │ Quantity │ Unit Price │ Amount       ││
│  ├────┼──────────────┼──────────┼────────────┼──────────────┤│
│  │ 1  │ Aluminum     │ 100 pcs  │ $10.00     │ $1,000.00    ││
│  │    │ Profile A    │          │            │              ││
│  ├────┼──────────────┼──────────┼────────────┼──────────────┤│
│  │ 2  │ Aluminum     │ 50 pcs   │ $15.00     │ $750.00      ││
│  │    │ Profile B    │          │            │              ││
│  ├────┼──────────────┼──────────┼────────────┼──────────────┤│
│  │ 3  │ Window Frame │ 200 pcs  │ $12.50     │ $2,500.00    ││
│  │    │ Standard     │          │            │              ││
│  ├────┼──────────────┼──────────┼────────────┼──────────────┤│
│  │ 4  │ Door Frame   │ 30 pcs   │ $20.00     │ $600.00      ││
│  │    │ Heavy Duty   │          │            │              ││
│  ├────┼──────────────┼──────────┼────────────┼──────────────┤│
│  │ 5  │ Corner       │ 500 pcs  │ $0.30      │ $150.00      ││
│  │    │ Brackets     │          │            │              ││
│  └────┴──────────────┴──────────┴────────────┴──────────────┘│
│                                                                 │
│                                       Subtotal:    $5,000.00   │
│                                       Tax (10%):     $500.00   │
│                                       ───────────────────────   │
│                                       TOTAL:       $5,500.00   │
│                                                                 │
│ ──────────────────────────────────────────────────────────────│
│                                                                 │
│  For questions about this invoice, contact: seller@email.com   │
│                                                                 │
│                   Thank you for your business!                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Key Features

### 1. Payment Instructions Section
- **Payment Method**: Displays the selected payment method
- **Bank Name**: Name of seller's bank
- **Account Name**: Account holder name
- **Account Number**: Bank account number for transfers
- **SWIFT Code**: International bank identifier

### 2. Payment Terms Options
Available deposit options in checkout:
- ✅ **5% Minimum Deposit** - Small upfront payment
- ✅ **30% Standard Deposit** - Typical industry standard
- ✅ **65% Premium Deposit** - Large upfront commitment
- ✅ **100% Full Payment** - Complete payment upfront

### 3. Terms and Conditions
Professional 7-point terms covering:
1. Payment deadline (30 days)
2. Late payment penalties
3. Currency specification (USD)
4. Refund policy
5. Buyer tax responsibilities
6. Ownership retention clause
7. Dispute resolution

### 4. Multi-Page Layout
- **Page 1**: Summary with payment info and terms
- **Page 2**: Detailed product list with specifications
- **Print-friendly**: Automatic page breaks
- **Professional**: Clean, organized layout

## Color Scheme
- **Primary Blue**: #0080ff (Headers, borders, highlights)
- **Success Green**: #22c55e (Deposit paid, positive actions)
- **Warning Orange**: #f59e0b (Balance due, important notes)
- **Neutral Gray**: #333, #666, #888 (Text hierarchy)
- **White/Light**: Clean backgrounds for readability

## Responsive Design
- **Desktop**: Full two-column layout
- **Tablet**: Adjusted spacing, single column for some sections
- **Mobile**: Complete single-column layout
- **Print**: Optimized for US Letter (8.5" x 11") paper

## Usage

### For Buyers
1. Complete checkout with desired deposit percentage
2. View invoice from "Invoices" page
3. Print or save invoice for records
4. Use payment instructions for bank transfers

### For Sellers
1. Ensure bank details are updated in profile
2. Review invoices from "Seller Invoices" page
3. Print for customer records
4. Track payment status

## Technical Implementation

### Data Structure
```javascript
{
  invoiceNumber: "INV-2026-00001",
  paymentInstructions: {
    bankName: "Bank of China",
    accountName: "ABC Aluminum Co.",
    accountNumber: "1234-5678-9012-3456",
    swiftCode: "BKCHCNBJ",
    paymentMethodDetails: "Bank Transfer"
  },
  termsAndConditions: [...],
  items: [...],
  total: 5500.00,
  depositPaid: 1650.00,
  remainingBalance: 3850.00
}
```

### Print Styles
```css
@media print {
  .invoice-page {
    page-break-after: always;
  }
  .no-print {
    display: none !important;
  }
}
```

## Benefits

1. **Professional Appearance**: Clean, organized layout suitable for business use
2. **Complete Information**: All necessary details for payment and legal purposes
3. **Print-Ready**: Optimized for printing on standard paper
4. **Mobile-Friendly**: Accessible on all devices
5. **Flexible Terms**: Multiple payment options for different business needs
6. **Clear Instructions**: Detailed payment information reduces confusion
7. **Legal Protection**: Terms and conditions protect both parties

---

**Implementation Status**: ✅ Complete and Ready for Use
**Build Status**: ✅ Successful
**Security Scan**: ✅ Passed (0 vulnerabilities)
**Code Review**: ✅ Completed and addressed
