# Firebase Storage Rules - Visual Architecture

## Storage + Firestore Integration

```
┌──────────────────────────────────────────────────────────────────┐
│                      SELLER CREATES PRODUCT                       │
└──────────────────────────────────────────────────────────────────┘
                                │
                                ├─────────────────────────────────┐
                                │                                 │
                                ▼                                 ▼
        ┌───────────────────────────────────┐   ┌─────────────────────────────────┐
        │    FIREBASE STORAGE               │   │    CLOUD FIRESTORE              │
        │                                   │   │                                 │
        │    Path Validation                │   │    Product Document             │
        │    ✓ /products/{sellerId}/...     │   │    ┌─────────────────────────┐ │
        │    ✗ /products/other-seller/...   │   │    │ productId: "prod123"    │ │
        │                                   │   │    │ sellerId: "seller456"   │ │
        │    Security Rules:                │   │    │ category: "Doors"       │ │
        │    - isOwner(sellerId)            │   │    │ modelNumber: "AL-001"   │ │
        │    - isValidImage()               │   │    │ imageUrl: "https://..." │ │
        │    - size < 5MB                   │   │    └─────────────────────────┘ │
        │                                   │   │                                 │
        │    Stored:                        │   │    ↓ getCategories()            │
        │    /products/seller456/image.jpg  │   │                                 │
        │                                   │   │    Extract Unique Categories:   │
        │    Returns: imageUrl              │   │    ["Doors", "Windows", ...]    │
        └───────────────────────────────────┘   └─────────────────────────────────┘
```

## Category Flow Diagram

```
┌───────────────────────────────────────────────────────────────────────────┐
│                    SELLER ADDS NEW CATEGORY                               │
└───────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
          ┌─────────────┐  ┌────────────────┐  ┌──────────────┐
          │   Upload     │  │  Create Product│  │  Categories  │
          │   Image      │  │  in Firestore  │  │ Auto-Update  │
          └─────────────┘  └────────────────┘  └──────────────┘
                │                   │                   │
                ▼                   ▼                   ▼
    
    Storage validates:        Firestore stores:      Next query returns:
    ✓ sellerId matches       {                       [
    ✓ file type is image       category: "New",       "Doors",
    ✓ file size < 5MB          sellerId: "...",       "Windows",
    ✗ generic paths            imageUrl: "..."        "New" ← appears!
                              }                      ]
```

## Security Model: Before vs After

### ❌ BEFORE: Generic Rules (Insecure)
```
Storage Rules:
┌─────────────────────────────────┐
│ /products/{allPaths=**}         │
│   allow write: if authenticated │  ← Any user can write anywhere!
└─────────────────────────────────┘

Problems:
• Seller A → /products/sellerB/image.jpg ✓ (BAD!)
• Anyone → /products/generic/image.jpg ✓ (BAD!)
• No seller isolation
• Generic/mock data possible
```

### ✅ AFTER: Seller-Specific Rules (Secure)
```
Storage Rules:
┌─────────────────────────────────────────┐
│ /products/{sellerId}/{allPaths=**}      │
│   allow write: if auth.uid == sellerId  │  ← Only own folder!
└─────────────────────────────────────────┘

Benefits:
• Seller A → /products/sellerA/image.jpg ✓ (GOOD!)
• Seller A → /products/sellerB/image.jpg ✗ (BLOCKED!)
• Anyone → /products/generic/image.jpg ✗ (BLOCKED!)
• Complete seller isolation
• No generic/mock data possible
```

## Data Separation

```
┌─────────────────────────────────────────────────────────────────┐
│                    FIREBASE STORAGE                             │
│                     (File Storage)                              │
│                                                                 │
│  Purpose: Store actual files (images, CAD, documents)          │
│  Rules: Path-based (who owns this folder?)                     │
│  Structure: /products/{sellerId}/{filename}                    │
│                                                                 │
│  ✓ Fast access to files                                        │
│  ✓ CDN delivery                                                │
│  ✗ Cannot query file metadata                                  │
│  ✗ Cannot validate business logic                              │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ imageUrl reference
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CLOUD FIRESTORE                              │
│                   (Database/Metadata)                           │
│                                                                 │
│  Purpose: Store product metadata and business data             │
│  Rules: Data-based (role checks, field validation)             │
│  Structure: products/{productId}                               │
│                                                                 │
│  ✓ Query by category, seller, price, etc.                      │
│  ✓ Dynamic category extraction                                 │
│  ✓ Complex business logic                                      │
│  ✗ Not optimized for large files                               │
└─────────────────────────────────────────────────────────────────┘
```

## Why This Architecture?

### 🎯 Path-Based Storage Rules
```
Storage rules can only validate:
• request.auth.uid (who is uploading?)
• {sellerId} path variable (which folder?)
• request.resource (file size, type)

Storage rules CANNOT:
• Query Firestore to check categories
• Validate against dynamic business data
• Check user roles from database
```

### 🎯 Data-Based Firestore Rules
```
Firestore rules can validate:
• get() to check user roles
• resource.data.category (the value)
• Complex business logic
• Field-level permissions

This is why:
✓ Categories → Firestore (data validation)
✓ Files → Storage (path validation)
```

## Category Query Flow

```
User Interface
    │
    ├─ "Show me all categories"
    │
    ▼
dataService.getCategories()
    │
    ├─ Query: db.collection('products').get()
    │
    ▼
Firestore Returns:
    [
      { category: "Doors", sellerId: "A" },
      { category: "Windows", sellerId: "B" },
      { category: "Doors", sellerId: "C" },
      { category: "Frames", sellerId: "A" }
    ]
    │
    ├─ Extract unique: Set(["Doors", "Windows", "Frames"])
    │
    ▼
Return:
    ["Doors", "Frames", "Windows"]  ← Sorted, unique, dynamic!
```

## Summary

```
┌───────────────────────────────────────────────────────────────────┐
│  STORAGE RULES                 │  FIRESTORE                       │
├────────────────────────────────┼──────────────────────────────────┤
│  WHO can upload?               │  WHAT data is stored?            │
│  Path-based security           │  Data-based security             │
│  /products/{sellerId}/...      │  { category: "...", ... }        │
│  Blocks generic paths          │  Dynamic category management     │
│  Seller isolation              │  Query & filter capabilities     │
└───────────────────────────────────────────────────────────────────┘
                            ▼
                    RESULT: SECURE + DYNAMIC
        ✓ No generic/mock data in storage
        ✓ Categories update automatically when sellers create products
        ✓ Proper access control and validation
        ✓ Scalable and maintainable architecture
```
