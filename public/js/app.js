// Main Application Entry Point
import router from './router.js';
import authManager from './auth.js';
import { renderLandingPage } from '../pages/landing.js';
import { renderLoginPage } from '../pages/login.js';
import { renderSignupPage } from '../pages/signup.js';
import { renderProfileSelection } from '../pages/profile-selection.js';
import { renderBuyerDashboard } from '../pages/buyer-dashboard.js';
import { renderSellerDashboard } from '../pages/seller-dashboard.js';
import { renderCatalog } from '../pages/catalog.js';
import { renderCart } from '../pages/cart.js';
import { renderOrders } from '../pages/orders.js';
import { renderInvoices } from '../pages/invoices.js';
import { renderSellers } from '../pages/sellers.js';
import { renderProducts } from '../pages/products.js';
import { renderSellerOrders } from '../pages/seller-orders.js';
import { renderSellerInvoices } from '../pages/seller-invoices.js';
import { renderBranches } from '../pages/branches.js';
import { renderProfile } from '../pages/profile.js';
import { renderSupport } from '../pages/support.js';
import { renderNotifications } from '../pages/notifications.js';
import { renderAdminDashboard } from '../pages/admin-dashboard.js';

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
  
  // Register buyer routes
  router.register('/buyer/dashboard', protectedRoute(renderBuyerDashboard, 'buyer'));
  router.register('/buyer/catalog', protectedRoute(renderCatalog, 'buyer'));
  router.register('/buyer/cart', protectedRoute(renderCart, 'buyer'));
  router.register('/buyer/orders', protectedRoute(renderOrders, 'buyer'));
  router.register('/buyer/invoices', protectedRoute(renderInvoices, 'buyer'));
  router.register('/buyer/sellers', protectedRoute(renderSellers, 'buyer'));
  router.register('/buyer/support', protectedRoute(renderSupport, 'buyer'));
  router.register('/buyer/notifications', protectedRoute(renderNotifications, 'buyer'));
  router.register('/buyer/profile', protectedRoute(renderProfile, 'buyer'));
  
  // Register seller routes
  router.register('/seller/dashboard', protectedRoute(renderSellerDashboard, 'seller'));
  router.register('/seller/products', protectedRoute(renderProducts, 'seller'));
  router.register('/seller/orders', protectedRoute(renderSellerOrders, 'seller'));
  router.register('/seller/invoices', protectedRoute(renderSellerInvoices, 'seller'));
  router.register('/seller/branches', protectedRoute(renderBranches, 'seller'));
  router.register('/seller/support', protectedRoute(renderSupport, 'seller'));
  router.register('/seller/notifications', protectedRoute(renderNotifications, 'seller'));
  router.register('/seller/profile', protectedRoute(renderProfile, 'seller'));
  
  // Register admin routes
  router.register('/admin/dashboard', protectedRoute(renderAdminDashboard, 'admin'));
  
  // Fallback route
  router.register('*', renderLandingPage);
  
  // Listen to auth state changes
  authManager.onAuthStateChanged((user, profile) => {
    // Re-render current route when auth state changes
    router.handleRoute();
  });
  
  // Export toast globally
  window.toast = toast;
  
  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Wait for Firebase scripts to load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
