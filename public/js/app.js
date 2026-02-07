// Main Application Entry Point
// Import CSS files for Vite to bundle
import '../css/main.css';
import '../css/LandingPage.css';
import '../css/AuthPages.css';
import '../css/Layout.css';
import '../css/Dashboard.css';
import '../css/Pages.css';

import router from './router.js';
import authManager from './auth.js';

// Eagerly load landing and auth pages (always needed)
import { renderLandingPage } from '../pages/landing.js';
import { renderLoginPage } from '../pages/login.js';
import { renderSignupPage } from '../pages/signup.js';
import { renderProfileSelection } from '../pages/profile-selection.js';

// Lazy load dashboard pages (loaded on demand)
const lazyPages = {
  buyerDashboard: () => import('../pages/buyer-dashboard.js').then(m => m.renderBuyerDashboard),
  sellerDashboard: () => import('../pages/seller-dashboard.js').then(m => m.renderSellerDashboard),
  catalog: () => import('../pages/catalog.js').then(m => m.renderCatalog),
  cart: () => import('../pages/cart.js').then(m => m.renderCart),
  orders: () => import('../pages/orders.js').then(m => m.renderOrders),
  invoices: () => import('../pages/invoices.js').then(m => m.renderInvoices),
  sellers: () => import('../pages/sellers.js').then(m => m.renderSellers),
  products: () => import('../pages/products.js').then(m => m.renderProducts),
  sellerOrders: () => import('../pages/seller-orders.js').then(m => m.renderSellerOrders),
  sellerInvoices: () => import('../pages/seller-invoices.js').then(m => m.renderSellerInvoices),
  branches: () => import('../pages/branches.js').then(m => m.renderBranches),
  profile: () => import('../pages/profile.js').then(m => m.renderProfile),
  support: () => import('../pages/support.js').then(m => m.renderSupport),
  notifications: () => import('../pages/notifications.js').then(m => m.renderNotifications),
  adminDashboard: () => import('../pages/admin-dashboard.js').then(m => m.renderAdminDashboard),
};

// Helper to create lazy route handler
function lazyRoute(pageLoader) {
  return async () => {
    try {
      const renderFn = await pageLoader();
      await renderFn();
    } catch (error) {
      console.error('Error loading page:', error);
      if (window.toast) {
        window.toast.error('Failed to load page');
      }
    }
  };
}

// Toast notification system
const toast = {
  success: (message) => showToast(message, 'success'),
  error: (message) => showToast(message, 'error'),
  info: (message) => showToast(message, 'info'),
  warning: (message) => showToast(message, 'warning')
};

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Protected route wrapper
function protectedRoute(handler, requireRole = null) {
  return () => {
    if (!authManager.isAuthenticated()) {
      router.navigate('/login');
      return;
    }
    
    if (requireRole && !authManager.hasRole(requireRole)) {
      toast.error('You do not have permission to access this page');
      router.navigate('/');
      return;
    }
    
    handler();
  };
}

// Initialize application
async function initApp() {
  // Wait for Firebase to be loaded with timeout
  if (typeof firebase === 'undefined') {
    try {
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Firebase scripts failed to load within 10 seconds'));
        }, 10000); // 10 second timeout
        
        // Check every 100ms for Firebase availability
        const checkFirebase = setInterval(() => {
          if (typeof firebase !== 'undefined') {
            clearInterval(checkFirebase);
            clearTimeout(timeout);
            resolve();
          }
        }, 100);
      });
    } catch (error) {
      console.error('Error loading Firebase:', error);
      if (window.toast) {
        window.toast.error('Failed to load required scripts. Please refresh the page.');
      }
      // Don't throw - allow app to load without Firebase (will redirect to login on protected routes)
      return;
    }
  }
  
  // Initialize Firebase
  await authManager.init();
  
  // Register public routes
  router.register('/', renderLandingPage);
  router.register('/login', renderLoginPage);
  router.register('/signup', renderSignupPage);
  router.register('/profile-selection', () => {
    if (!authManager.isAuthenticated()) {
      router.navigate('/login');
      return;
    }
    renderProfileSelection();
  });
  
  // Register buyer routes (lazy loaded)
  router.register('/buyer/dashboard', protectedRoute(lazyRoute(lazyPages.buyerDashboard), 'buyer'));
  router.register('/buyer/catalog', protectedRoute(lazyRoute(lazyPages.catalog), 'buyer'));
  router.register('/buyer/cart', protectedRoute(lazyRoute(lazyPages.cart), 'buyer'));
  router.register('/buyer/orders', protectedRoute(lazyRoute(lazyPages.orders), 'buyer'));
  router.register('/buyer/invoices', protectedRoute(lazyRoute(lazyPages.invoices), 'buyer'));
  router.register('/buyer/sellers', protectedRoute(lazyRoute(lazyPages.sellers), 'buyer'));
  router.register('/buyer/support', protectedRoute(lazyRoute(lazyPages.support), 'buyer'));
  router.register('/buyer/notifications', protectedRoute(lazyRoute(lazyPages.notifications), 'buyer'));
  router.register('/buyer/profile', protectedRoute(lazyRoute(lazyPages.profile), 'buyer'));
  
  // Register seller routes (lazy loaded)
  router.register('/seller/dashboard', protectedRoute(lazyRoute(lazyPages.sellerDashboard), 'seller'));
  router.register('/seller/products', protectedRoute(lazyRoute(lazyPages.products), 'seller'));
  router.register('/seller/orders', protectedRoute(lazyRoute(lazyPages.sellerOrders), 'seller'));
  router.register('/seller/invoices', protectedRoute(lazyRoute(lazyPages.sellerInvoices), 'seller'));
  router.register('/seller/branches', protectedRoute(lazyRoute(lazyPages.branches), 'seller'));
  router.register('/seller/support', protectedRoute(lazyRoute(lazyPages.support), 'seller'));
  router.register('/seller/notifications', protectedRoute(lazyRoute(lazyPages.notifications), 'seller'));
  router.register('/seller/profile', protectedRoute(lazyRoute(lazyPages.profile), 'seller'));
  
  // Register admin routes (lazy loaded)
  router.register('/admin/dashboard', protectedRoute(lazyRoute(lazyPages.adminDashboard), 'admin'));
  
  // Fallback route
  router.register('*', renderLandingPage);
  
  // Listen to auth state changes
  authManager.onAuthStateChanged((user, profile) => {
    // Re-render current route when auth state changes
    router.handleRoute();
  });
  
  // Export toast and router globally
  window.toast = toast;
  window.router = router;
  
  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Initialize app when DOM is ready and Firebase is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
