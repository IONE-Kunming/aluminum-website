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
    };
  }

  // Initialize Firestore connection
  async init() {
    if (this.initialized) return;
    
    // Wait for Firebase to be ready
    await this.waitForFirebase();
    
    if (window.firebase && window.firebase.firestore) {
      this.db = window.firebase.firestore();
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
        throw new Error('Database not initialized');
      }
      
      const orderRef = await this.db.collection('orders').add(orderData);
      
      return {
        success: true,
        orderId: orderRef.id
      };
    } catch (error) {
      console.error('Error creating order:', error);
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
      
      // Order by creation date descending
      query = query.orderBy('createdAt', 'desc');
      
      const snapshot = await query.get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
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
}

export default new DataService();
