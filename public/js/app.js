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
import cartManager from './cart.js';

// Profile loading timeout in milliseconds
const PROFILE_LOAD_TIMEOUT_MS = 8000;

// Eagerly load landing and auth pages (always needed)
import { renderLandingPage } from '../pages/landing.js';
import { renderLoginPage } from '../pages/login.js';
import { renderSignupPage } from '../pages/signup.js';
import { renderProfileSelection } from '../pages/profile-selection.js';
import { renderPublicCategories } from '../pages/public-categories.js';

// Lazy load dashboard pages (loaded on demand)
const lazyPages = {
  buyerDashboard: () => import('../pages/buyer-dashboard.js').then(m => m.renderBuyerDashboard),
  sellerDashboard: () => import('../pages/seller-dashboard.js').then(m => m.renderSellerDashboard),
  categorySelection: () => import('../pages/category-selection.js').then(m => m.renderCategorySelection),
  catalog: () => import('../pages/catalog.js').then(m => m.renderCatalog),
  allProducts: () => import('../pages/all-products.js').then(m => m.renderAllProducts),
  productDetail: () => import('../pages/product-detail.js').then(m => m.renderProductDetail),
  cart: () => import('../pages/cart.js').then(m => m.renderCart),
  checkout: () => import('../pages/checkout.js').then(m => m.renderCheckout),
  orders: () => import('../pages/orders.js').then(m => m.renderOrders),
  orderDetail: () => import('../pages/order-detail.js').then(m => m.renderOrderDetail),
  invoices: () => import('../pages/invoices.js').then(m => m.renderInvoices),
  invoiceDetail: () => import('../pages/invoice-detail.js').then(m => m.renderInvoiceDetail),
  sellers: () => import('../pages/sellers.js').then(m => m.renderSellers),
  products: () => import('../pages/products.js').then(m => m.renderProducts),
  sellerOrders: () => import('../pages/seller-orders.js').then(m => m.renderSellerOrders),
  sellerInvoices: () => import('../pages/seller-invoices.js').then(m => m.renderSellerInvoices),
  branches: () => import('../pages/branches.js').then(m => m.renderBranches),
  profile: () => import('../pages/profile.js').then(m => m.renderProfile),
  support: () => import('../pages/support.js').then(m => m.renderSupport),
  notifications: () => import('../pages/notifications.js').then(m => m.renderNotifications),
  adminDashboard: () => import('../pages/admin-dashboard.js').then(m => m.renderAdminDashboard),
  adminUsers: () => import('../pages/admin-users.js').then(m => m.renderAdminUsers),
  adminProducts: () => import('../pages/admin-products.js').then(m => m.renderAdminProducts),
  adminOrders: () => import('../pages/admin-orders.js').then(m => m.renderAdminOrders),
  adminSellers: () => import('../pages/admin-sellers.js').then(m => m.renderAdminSellers),
  adminInvoices: () => import('../pages/admin-invoices.js').then(m => m.renderAdminInvoices),
};

// Helper to create lazy route handler
function lazyRoute(pageLoader) {
  return async () => {
    try {
      console.log('[lazyRoute] Starting to load page...');
      const renderFn = await pageLoader();
      console.log('[lazyRoute] Page module loaded, render function:', typeof renderFn);
      await renderFn();
      console.log('[lazyRoute] Page rendered successfully');
    } catch (error) {
      console.error('[lazyRoute] Error loading page:', error);
      console.error('[lazyRoute] Error stack:', error.stack);
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
  return async () => {
    console.log('[protectedRoute] Starting, requireRole:', requireRole);
    // Wait for Firebase to determine the initial auth state
    // This prevents premature redirects to login on page refresh
    await authManager.waitForAuthState(5000);
    
    if (!authManager.isAuthenticated()) {
      console.log('[protectedRoute] User not authenticated, redirecting to login');
      router.navigate('/login');
      return;
    }
    
    console.log('[protectedRoute] User authenticated');
    
    // Wait for user profile to load if a role is required
    if (requireRole) {
      // Wait for profile to load with extended timeout
      const profile = await authManager.waitForProfile(PROFILE_LOAD_TIMEOUT_MS);
      console.log('[protectedRoute] Profile loaded:', profile ? `role=${profile.role}` : 'null');
      
      if (!profile || !profile.role) {
        // User has no role set, redirect to profile selection
        console.log('[protectedRoute] No profile or role, redirecting to profile selection');
        router.navigate('/profile-selection');
        return;
      }
      
      if (profile.role !== requireRole) {
        console.log('[protectedRoute] Role mismatch: required=' + requireRole + ', actual=' + profile.role);
        // Only show error if user is trying to access a different role's page
        // Don't show error if we're just redirecting them to their correct dashboard
        const currentPath = window.location.pathname.replace(router.basePath, '') || '/';
        
        // Show error only if they're not already being redirected to their dashboard
        if (!currentPath.includes('/dashboard')) {
          toast.error('You do not have permission to access this page');
        }
        
        // Redirect to the correct dashboard based on their role
        if (profile.role === 'seller') {
          router.navigate('/seller/dashboard');
        } else if (profile.role === 'buyer') {
          router.navigate('/buyer/catalog');
        } else if (profile.role === 'admin') {
          router.navigate('/admin/dashboard');
        } else {
          router.navigate('/');
        }
        return;
      }
    }
    
    console.log('[protectedRoute] Calling handler');
    handler();
  };
}

// Initialize application
async function initApp() {
  let firebaseLoaded = false;
  
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
      firebaseLoaded = true;
    } catch (error) {
      console.error('Error loading Firebase:', error);
      // Continue initialization without Firebase - app will work in limited mode
      // Limited mode: Landing, login, and signup pages work, but protected routes
      // will redirect to login. No data fetching from Firestore will be available.
      firebaseLoaded = false;
    }
  } else {
    firebaseLoaded = true;
  }
  
  // Initialize Firebase if loaded
  if (firebaseLoaded) {
    try {
      await authManager.init();
    } catch (error) {
      console.error('Error initializing Firebase:', error);
    }
  }
  
  // Register public routes
  router.register('/', renderLandingPage);
  router.register('/login', renderLoginPage);
  router.register('/signup', renderSignupPage);
  router.register('/categories', renderPublicCategories);
  router.register('/profile-selection', async () => {
    // Wait for Firebase to determine the initial auth state
    await authManager.waitForAuthState(5000);
    
    if (!authManager.isAuthenticated()) {
      router.navigate('/login');
      return;
    }
    
    // Wait for profile to load and check if user already has a role
    const profile = await authManager.waitForProfile(PROFILE_LOAD_TIMEOUT_MS);
    
    if (profile && profile.role) {
      // User already has a role, redirect to their Home Page immediately
      // This prevents the profile selection page from ever showing
      if (profile.role === 'seller') {
        router.navigate('/seller/dashboard');
      } else if (profile.role === 'buyer') {
        router.navigate('/buyer/catalog');
      } else if (profile.role === 'admin') {
        router.navigate('/admin/dashboard');
      }
      return;
    }
    
    renderProfileSelection();
  });
  
  // Register buyer routes (lazy loaded)
  router.register('/buyer/dashboard', protectedRoute(lazyRoute(lazyPages.buyerDashboard), 'buyer'));
  router.register('/buyer/category-selection', protectedRoute(lazyRoute(lazyPages.categorySelection), 'buyer'));
  router.register('/buyer/catalog', protectedRoute(lazyRoute(lazyPages.catalog), 'buyer'));
  router.register('/buyer/all-products', protectedRoute(lazyRoute(lazyPages.allProducts), 'buyer'));
  router.register('/buyer/product', protectedRoute(lazyRoute(lazyPages.productDetail), 'buyer'));
  router.register('/buyer/cart', protectedRoute(lazyRoute(lazyPages.cart), 'buyer'));
  router.register('/buyer/checkout', protectedRoute(lazyRoute(lazyPages.checkout), 'buyer'));
  router.register('/buyer/orders', protectedRoute(lazyRoute(lazyPages.orders), 'buyer'));
  router.register('/buyer/invoices', protectedRoute(lazyRoute(lazyPages.invoices), 'buyer'));
  router.register('/buyer/invoice', protectedRoute(lazyRoute(lazyPages.invoiceDetail), 'buyer'));
  router.register('/buyer/sellers', protectedRoute(lazyRoute(lazyPages.sellers), 'buyer'));
  router.register('/buyer/support', protectedRoute(lazyRoute(lazyPages.support), 'buyer'));
  router.register('/buyer/notifications', protectedRoute(lazyRoute(lazyPages.notifications), 'buyer'));
  router.register('/buyer/profile', protectedRoute(lazyRoute(lazyPages.profile), 'buyer'));
  
  // Register seller routes (lazy loaded)
  router.register('/seller/dashboard', protectedRoute(lazyRoute(lazyPages.sellerDashboard), 'seller'));
  router.register('/seller/products', protectedRoute(lazyRoute(lazyPages.products), 'seller'));
  router.register('/seller/orders', protectedRoute(lazyRoute(lazyPages.sellerOrders), 'seller'));
  router.register('/seller/invoices', protectedRoute(lazyRoute(lazyPages.sellerInvoices), 'seller'));
  router.register('/seller/invoice', protectedRoute(lazyRoute(lazyPages.invoiceDetail), 'seller'));
  router.register('/seller/branches', protectedRoute(lazyRoute(lazyPages.branches), 'seller'));
  router.register('/seller/support', protectedRoute(lazyRoute(lazyPages.support), 'seller'));
  router.register('/seller/notifications', protectedRoute(lazyRoute(lazyPages.notifications), 'seller'));
  router.register('/seller/profile', protectedRoute(lazyRoute(lazyPages.profile), 'seller'));
  
  // Register shared routes (accessible by both buyer and seller)
  router.register('/order/detail', protectedRoute(lazyRoute(lazyPages.orderDetail)));
  
  // Register admin routes (lazy loaded)
  router.register('/admin/dashboard', protectedRoute(lazyRoute(lazyPages.adminDashboard), 'admin'));
  router.register('/admin/users', protectedRoute(lazyRoute(lazyPages.adminUsers), 'admin'));
  router.register('/admin/products', protectedRoute(lazyRoute(lazyPages.adminProducts), 'admin'));
  router.register('/admin/orders', protectedRoute(lazyRoute(lazyPages.adminOrders), 'admin'));
  router.register('/admin/sellers', protectedRoute(lazyRoute(lazyPages.adminSellers), 'admin'));
  router.register('/admin/invoices', protectedRoute(lazyRoute(lazyPages.adminInvoices), 'admin'));
  router.register('/admin/invoice', protectedRoute(lazyRoute(lazyPages.invoiceDetail), 'admin'));
  router.register('/admin/support', protectedRoute(lazyRoute(lazyPages.support), 'admin'));
  router.register('/admin/profile', protectedRoute(lazyRoute(lazyPages.profile), 'admin'));
  
  // Fallback route
  router.register('*', renderLandingPage);
  
  // Listen to auth state changes
  authManager.onAuthStateChanged(async (user, profile) => {
    // Initialize cart with user context
    if (user) {
      await cartManager.switchUser(user.uid);
    } else {
      await cartManager.logout();
    }
    
    // Re-render current route when auth state changes
    // Skip re-rendering for public pages (login, signup, landing, profile-selection)
    // to avoid conflicts with navigation during authentication flow
    const currentPath = window.location.pathname.replace(router.basePath, '') || '/';
    const publicPaths = ['/', '/login', '/signup', '/profile-selection'];
    if (!publicPaths.includes(currentPath)) {
      router.handleRoute();
    }
  });
  
  // Export toast and router globally
  window.toast = toast;
  window.router = router;
  
  // Trigger initial route after all routes are registered
  router.handleRoute();
  
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
