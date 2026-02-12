// Data Service - Provides API integration for real data
// This module handles all data fetching from backend/Firebase

import authManager from './auth.js';

class DataService {
  constructor() {
    this.db = null;
    this.initialized = false;
    // Add caching mechanism
    this.cache = {
      products: { data: null, timestamp: null, ttl: 60000 }, // 1 minute TTL
      categories: { data: null, timestamp: null, ttl: 300000 }, // 5 minutes TTL
      userProfiles: { data: new Map(), timestamp: null, ttl: 300000 }, // Cache user profiles for 5 minutes
    };
  }

  // Initialize Firestore connection
  async init() {
    if (this.initialized) return;
    
    // Wait for Firebase to be ready
    await this.waitForFirebase();
    
    if (window.firebase && window.firebase.firestore) {
      this.db = window.firebase.firestore();
      
      // Check if cache needs to be cleared (version bump for products limit fix)
      const CACHE_VERSION = '1.2.0'; // Increment this to force cache clear
      const currentVersion = localStorage.getItem('firestoreCacheVersion');
      
      if (currentVersion !== CACHE_VERSION) {
        console.log('Cache version mismatch, clearing Firestore persistence...');
        try {
          // Clear IndexedDB databases used by Firestore
          // Check if indexedDB.databases() is available (not supported in Safari)
          if (indexedDB.databases) {
            const databases = await indexedDB.databases();
            for (const db of databases) {
              if (db.name && db.name.includes('firestore')) {
                console.log(`Deleting IndexedDB: ${db.name}`);
                await indexedDB.deleteDatabase(db.name);
              }
            }
          } else {
            // Fallback for browsers without indexedDB.databases() (Safari)
            // Delete known Firestore database names
            const knownDatabases = [
              'firebaseLocalStorageDb',
              'firebaseLocalStorage',
              'firebase-heartbeat-database',
              'firebase-installations-database'
            ];
            for (const dbName of knownDatabases) {
              console.log(`Attempting to delete IndexedDB: ${dbName}`);
              await indexedDB.deleteDatabase(dbName);
            }
          }
          localStorage.setItem('firestoreCacheVersion', CACHE_VERSION);
          console.log('Firestore cache cleared successfully');
        } catch (err) {
          console.warn('Could not clear cache:', err);
        }
      }
      
      // Enable offline persistence for faster loading
      try {
        await this.db.enablePersistence({ synchronizeTabs: true });
        console.log('Firestore persistence enabled - data will be cached locally');
      } catch (err) {
        if (err.code === 'failed-precondition') {
          console.warn('Persistence failed: Multiple tabs open, persistence enabled in first tab only');
        } else if (err.code === 'unimplemented') {
          console.warn('Persistence not available in this browser');
        } else {
          console.warn('Error enabling persistence:', err);
        }
      }
      
      this.initialized = true;
      console.log('DataService initialized with Firestore');
    } else {
      console.warn('Firebase not available, using mock data');
    }
  }

  // Wait for Firebase to load
  waitForFirebase() {
    return new Promise((resolve) => {
      if (window.firebase) {
        resolve();
        return;
      }
      
      const checkFirebase = setInterval(() => {
        if (window.firebase) {
          clearInterval(checkFirebase);
          resolve();
        }
      }, 100);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkFirebase);
        resolve();
      }, 5000);
    });
  }

  // Invalidate cache for a specific key or all caches
  invalidateCache(cacheKey = null) {
    if (cacheKey && this.cache[cacheKey]) {
      this.cache[cacheKey].timestamp = null;
      this.cache[cacheKey].data = null;
      console.log(`Cache invalidated: ${cacheKey}`);
    } else if (!cacheKey) {
      // Invalidate all caches
      Object.keys(this.cache).forEach(key => {
        this.cache[key].timestamp = null;
        if (this.cache[key].data instanceof Map) {
          this.cache[key].data.clear();
        } else {
          this.cache[key].data = null;
        }
      });
      console.log('All caches invalidated');
    }
  }

  // Get user's dashboard stats
  async getDashboardStats(role) {
    await this.init();
    
    try {
      if (!this.db) {
        // Return mock data if Firestore not available
        return this.getMockDashboardStats(role);
      }

      const userId = authManager.getCurrentUser()?.uid;
      if (!userId) {
        return this.getMockDashboardStats(role);
      }

      // Fetch real data from Firestore based on role
      if (role === 'buyer') {
        return await this.getBuyerStats(userId);
      } else if (role === 'seller') {
        return await this.getSellerStats(userId);
      } else if (role === 'admin') {
        return await this.getAdminStats();
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return this.getMockDashboardStats(role);
    }
  }

  // Get buyer statistics
  async getBuyerStats(userId) {
    const ordersSnapshot = await this.db
      .collection('orders')
      .where('buyerId', '==', userId)
      .get();

    const orders = ordersSnapshot.docs.map(doc => doc.data());
    
    const totalOrders = orders.length;
    const activeOrders = orders.filter(o => ['pending', 'processing', 'shipped'].includes(o.status?.toLowerCase())).length;
    const completedOrders = orders.filter(o => o.status?.toLowerCase() === 'delivered').length;
    const totalSpent = orders.reduce((sum, order) => sum + (order.total || 0), 0);

    return {
      totalOrders,
      activeOrders,
      totalSpent,
      completedOrders
    };
  }

  // Get seller statistics
  async getSellerStats(userId) {
    const [productsSnapshot, ordersSnapshot] = await Promise.all([
      this.db.collection('products').where('sellerId', '==', userId).get(),
      this.db.collection('orders').where('sellerId', '==', userId).get()
    ]);

    const products = productsSnapshot.docs.map(doc => doc.data());
    const orders = ordersSnapshot.docs.map(doc => doc.data());

    const totalProducts = products.length;
    const totalOrders = orders.length;
    const activeOrders = orders.filter(o => ['pending', 'processing'].includes(o.status?.toLowerCase())).length;
    const revenue = orders
      .filter(o => o.status?.toLowerCase() === 'delivered')
      .reduce((sum, order) => sum + (order.total || 0), 0);

    return {
      totalProducts,
      totalOrders,
      revenue,
      activeOrders
    };
  }

  // Get admin statistics
  async getAdminStats() {
    const [usersSnapshot, ordersSnapshot, sellersSnapshot] = await Promise.all([
      this.db.collection('users').get(),
      this.db.collection('orders').get(),
      this.db.collection('users').where('role', '==', 'seller').get()
    ]);

    const totalUsers = usersSnapshot.size;
    const totalOrders = ordersSnapshot.size;
    const activeSellers = sellersSnapshot.size;
    const revenue = ordersSnapshot.docs
      .map(doc => doc.data())
      .reduce((sum, order) => sum + (order.total || 0), 0);

    return {
      totalUsers,
      totalOrders,
      revenue,
      activeSellers
    };
  }

  // Get recent orders for buyer
  async getRecentOrders(userId, limit = 10) {
    await this.init();

    try {
      if (!this.db || !userId) {
        return [];
      }

      const snapshot = await this.db
        .collection('orders')
        .where('buyerId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      return [];
    }
  }

  // Get top products for seller
  async getTopProducts(userId, limit = 10) {
    await this.init();

    try {
      if (!this.db || !userId) {
        return [];
      }

      const snapshot = await this.db
        .collection('products')
        .where('sellerId', '==', userId)
        .orderBy('sales', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching top products:', error);
      return [];
    }
  }

  // Helper method to determine if cache should be used
  shouldUseCache(filters) {
    return !filters.category && !filters.sellerId && !filters.limit;
  }

  // Get products from catalog with caching and pagination
  async getProducts(filters = {}) {
    await this.init();

    try {
      if (!this.db) {
        return [];
      }

      // Check cache if no specific filters and cache is fresh
      if (this.shouldUseCache(filters)) {
        const cached = this.cache.products;
        if (cached.data && cached.timestamp && (Date.now() - cached.timestamp < cached.ttl)) {
          return cached.data;
        }
      }

      let query = this.db.collection('products');

      // Apply filters
      if (filters.category) {
        query = query.where('category', '==', filters.category);
      }
      if (filters.sellerId) {
        query = query.where('sellerId', '==', filters.sellerId);
      }
      
      // Apply pagination limit (default to 50 for better performance)
      const limit = filters.limit || 50;
      query = query.limit(limit);

      const snapshot = await query.get();
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort in memory to avoid Firestore index requirements
      products.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date();
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date();
        return dateB - dateA; // descending order
      });
      
      // Cache results if no specific filters
      if (this.shouldUseCache(filters)) {
        this.cache.products = {
          data: products,
          timestamp: Date.now(),
          ttl: 60000
        };
      }
      
      return products;
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  // Clear cache manually if needed
  clearCache(key = null) {
    if (key) {
      if (this.cache[key]) {
        this.cache[key] = { data: null, timestamp: null, ttl: this.cache[key].ttl };
      }
    } else {
      // Clear all caches
      Object.keys(this.cache).forEach(k => {
        this.cache[k].data = null;
        this.cache[k].timestamp = null;
      });
    }
  }

  // Add a new product
  async addProduct(productData) {
    await this.init();

    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      const user = authManager.getCurrentUser();
      const profile = authManager.getUserProfile();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create product document with seller information
      const product = {
        sellerId: user.uid,
        sellerName: profile?.displayName || user.email || 'Seller',
        modelNumber: productData.modelNumber,
        category: productData.category,
        pricePerMeter: parseFloat(productData.pricePerMeter),
        description: productData.description || '',
        stock: parseInt(productData.stock) || 0,
        imageUrl: productData.imageUrl || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await this.db.collection('products').add(product);
      
      // Clear products cache when new product is added
      this.clearCache('products');
      
      return { success: true, id: docRef.id, product };
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  }

  // Delete a product
  async deleteProduct(productId) {
    await this.init();

    try {
      if (!this.db || !productId) {
        throw new Error('Invalid product ID or database not initialized');
      }

      await this.db.collection('products').doc(productId).delete();
      return { success: true };
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  // Update an existing product
  async updateProduct(productId, productData) {
    await this.init();

    try {
      if (!this.db || !productId) {
        throw new Error('Invalid product ID or database not initialized');
      }

      // Add updated timestamp
      const updateData = {
        ...productData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await this.db.collection('products').doc(productId).update(updateData);
      
      return { 
        success: true,
        productId: productId
      };
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  // Get unique categories from products
  async getCategories(sellerId = null) {
    await this.init();

    try {
      if (!this.db) {
        return [];
      }

      let query = this.db.collection('products');
      
      // If sellerId provided, only get that seller's categories
      if (sellerId) {
        query = query.where('sellerId', '==', sellerId);
      }

      const snapshot = await query.get();
      
      // Extract unique categories
      const categoriesSet = new Set();
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.category) {
          categoriesSet.add(data.category);
        }
      });
      
      // Convert to array and sort alphabetically
      return Array.from(categoriesSet).sort();
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  // Get categories organized by hierarchy
  async getCategoriesHierarchy(sellerId = null) {
    await this.init();

    try {
      const categories = await this.getCategories(sellerId);
      
      // Import hierarchy functions dynamically
      const { mapCategoriesToHierarchy, getSubcategories } = await import('./categoryHierarchy.js');
      
      const mapped = mapCategoriesToHierarchy(categories);
      
      // For each main category, get which subcategories have products
      const hierarchy = {};
      for (const mainCategory of mapped.mainCategories) {
        const subcats = getSubcategories(mainCategory);
        // Filter to only subcategories that exist in products
        const availableSubcats = subcats.filter(sub => categories.includes(sub));
        hierarchy[mainCategory] = {
          subcategories: availableSubcats,
          hasProducts: availableSubcats.length > 0
        };
      }
      
      return {
        mainCategories: mapped.mainCategories,
        unmappedCategories: mapped.unmappedCategories,
        hierarchy: hierarchy
      };
    } catch (error) {
      console.error('Error fetching categories hierarchy:', error);
      return {
        mainCategories: [],
        unmappedCategories: [],
        hierarchy: {}
      };
    }
  }

  // Delete products by category
  async deleteProductsByCategory(category, sellerId) {
    await this.init();

    try {
      if (!this.db || !category) {
        throw new Error('Invalid category or database not initialized');
      }

      // Build query
      let query = this.db.collection('products').where('category', '==', category);
      
      // If sellerId provided, only delete that seller's products
      if (sellerId) {
        query = query.where('sellerId', '==', sellerId);
      }

      const snapshot = await query.get();
      
      if (snapshot.empty) {
        return { success: true, deletedCount: 0 };
      }

      // Delete all matching products in a batch
      const batch = this.db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
      return { success: true, deletedCount: snapshot.size };
    } catch (error) {
      console.error('Error deleting products by category:', error);
      throw error;
    }
  }

  // Mock data fallback methods
  getMockDashboardStats(role) {
    if (role === 'buyer') {
      return {
        totalOrders: 0,
        activeOrders: 0,
        totalSpent: 0,
        completedOrders: 0
      };
    } else if (role === 'seller') {
      return {
        totalProducts: 0,
        totalOrders: 0,
        revenue: 0,
        activeOrders: 0
      };
    } else if (role === 'admin') {
      return {
        totalUsers: 0,
        totalOrders: 0,
        revenue: 0,
        activeSellers: 0
      };
    }
    return {};
  }

  // Create a new order
  async createOrder(orderData) {
    await this.init();
    
    try {
      if (!this.db) {
        console.error('Firestore not initialized when trying to create order');
        throw new Error('Unable to connect to the database. Please try again or contact support.');
      }
      
      console.log('Creating order with data:', {
        buyerId: orderData.buyerId,
        sellerId: orderData.sellerId,
        itemsCount: orderData.items?.length,
        total: orderData.total
      });
      
      const orderRef = await this.db.collection('orders').add(orderData);
      
      console.log('Order created successfully with ID:', orderRef.id);
      
      return {
        success: true,
        orderId: orderRef.id
      };
    } catch (error) {
      console.error('Error creating order:', error);
      console.error('Order data that failed:', orderData);
      throw error;
    }
  }

  // Create multiple orders atomically using Firestore batched writes
  async createOrdersBatch(ordersData) {
    await this.init();
    
    try {
      if (!this.db) {
        console.error('Firestore not initialized when trying to create orders');
        throw new Error('Unable to connect to the database. Please try again or contact support.');
      }
      
      // Validate input
      if (!ordersData || ordersData.length === 0) {
        console.error('No orders data provided to createOrdersBatch');
        throw new Error('No orders to create');
      }
      
      console.log('Creating batch of orders:', {
        count: ordersData.length,
        buyerId: ordersData[0].buyerId
      });
      
      // Use Firestore batched write for atomicity
      const batch = this.db.batch();
      const orderIds = [];
      
      ordersData.forEach(orderData => {
        const orderRef = this.db.collection('orders').doc();
        batch.set(orderRef, orderData);
        orderIds.push(orderRef.id);
        
        console.log('Adding order to batch:', {
          orderId: orderRef.id,
          sellerId: orderData.sellerId,
          itemsCount: orderData.items?.length,
          total: orderData.total
        });
      });
      
      // Commit all orders atomically
      await batch.commit();
      
      console.log('All orders created successfully:', orderIds);
      
      return {
        success: true,
        orderIds: orderIds
      };
    } catch (error) {
      console.error('Error creating orders batch:', error);
      console.error('Failed to create orders');
      throw error;
    }
  }

  // Get orders for a specific user
  async getOrders(filters = {}) {
    await this.init();
    
    try {
      if (!this.db) {
        return [];
      }
      
      let query = this.db.collection('orders');
      
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
        console.warn('Firestore index not available, fetching without ordering:', indexError);
        const snapshot = await query.get();
        
        // Sort in memory
        const orders = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort by createdAt, putting orders without timestamps at the end
        orders.sort((a, b) => {
          // Handle Firestore Timestamp objects properly
          const dateA = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt)) : new Date(0);
          const dateB = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt)) : new Date(0);
          return dateB - dateA;
        });
        
        return orders;
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  }

  // Update order status
  async updateOrderStatus(orderId, newStatus) {
    await this.init();
    
    try {
      if (!this.db || !orderId) {
        throw new Error('Invalid order ID');
      }
      
      await this.db.collection('orders').doc(orderId).update({
        status: newStatus,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  // Get a single order by ID
  async getOrderById(orderId) {
    await this.init();
    
    try {
      if (!this.db || !orderId) {
        return null;
      }
      
      const doc = await this.db.collection('orders').doc(orderId).get();
      
      if (doc.exists) {
        return {
          id: doc.id,
          ...doc.data()
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching order:', error);
      return null;
    }
  }

  // Get a single product by ID
  async getProductById(productId) {
    await this.init();
    
    try {
      if (!this.db || !productId) {
        return null;
      }
      
      const doc = await this.db.collection('products').doc(productId).get();
      
      if (doc.exists) {
        return {
          id: doc.id,
          ...doc.data()
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  }

  // Validate multiple products exist in the database
  async validateProducts(productIds) {
    await this.init();
    
    try {
      if (!this.db || !productIds || productIds.length === 0) {
        return {};
      }
      
      const validationResults = {};
      
      // Fetch all products in parallel
      const promises = productIds.map(async (id) => {
        const product = await this.getProductById(id);
        validationResults[id] = product !== null;
      });
      
      await Promise.all(promises);
      
      return validationResults;
    } catch (error) {
      console.error('Error validating products:', error);
      return {};
    }
  }

  // Get all sellers from the database
  async getSellers() {
    await this.init();
    
    try {
      if (!this.db) {
        return [];
      }
      
      // Query users collection for users with role 'seller'
      const snapshot = await this.db
        .collection('users')
        .where('role', '==', 'seller')
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching sellers:', error);
      return [];
    }
  }

  // Get user notifications
  async getNotifications(userId) {
    await this.init();
    
    try {
      if (!this.db || !userId) {
        return [];
      }
      
      const snapshot = await this.db
        .collection('notifications')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId) {
    await this.init();
    
    try {
      if (!this.db || !notificationId) return;
      
      await this.db.collection('notifications').doc(notificationId).update({
        read: true
      });
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // ==================== Invoice Methods ====================

  // Generate unique invoice number using Firestore transaction
  async generateInvoiceNumber() {
    await this.init();
    
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }
      
      // Use a counter document to ensure atomic increment
      const counterRef = this.db.collection('_counters').doc('invoices');
      
      // Run a transaction to safely increment the counter
      const invoiceNumber = await this.db.runTransaction(async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        
        let nextNumber = 1;
        const currentYear = new Date().getFullYear();
        
        if (counterDoc.exists) {
          const data = counterDoc.data();
          // Check if we need to reset the counter for a new year
          if (data.year === currentYear) {
            nextNumber = (data.lastNumber || 0) + 1;
          } else {
            // New year, reset counter to 1
            nextNumber = 1;
          }
        }
        
        // Update the counter
        transaction.set(counterRef, {
          lastNumber: nextNumber,
          year: currentYear,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Generate invoice number
        return `INV-${currentYear}-${String(nextNumber).padStart(5, '0')}`;
      });
      
      return invoiceNumber;
      
    } catch (error) {
      console.error('Error generating invoice number:', error);
      // Fallback to timestamp-based number if transaction fails
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

  // Update user profile
  async updateUserProfile(updates) {
    await this.init();
    
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }
      
      const user = authManager.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      await this.db.collection('users').doc(user.uid).update({
        ...updates,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('User profile updated:', user.uid);
      
      // Update the cached profile in authManager
      const currentProfile = authManager.getUserProfile();
      if (currentProfile) {
        authManager.userProfile = { ...currentProfile, ...updates };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }
}

export default new DataService();
