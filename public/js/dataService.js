// Data Service - Provides API integration for real data
// This module handles all data fetching from backend/Firebase

import authManager from './auth.js';

class DataService {
  constructor() {
    this.db = null;
    this.initialized = false;
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

  // Get products from catalog
  async getProducts(filters = {}) {
    await this.init();

    try {
      if (!this.db) {
        return [];
      }

      let query = this.db.collection('products');

      // Apply filters
      if (filters.category) {
        query = query.where('category', '==', filters.category);
      }
      if (filters.sellerId) {
        query = query.where('sellerId', '==', filters.sellerId);
      }
      
      // Apply pagination limit if specified (before ordering to avoid index requirements)
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

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
      
      return products;
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
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
}

export default new DataService();
