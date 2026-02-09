import router from './router.js';
import authManager from './auth.js';
import { escapeHtml } from './utils.js';
import themeManager from './theme.js';
import languageManager from './language.js';

export function renderLayout(content, userRole = null) {
  const profile = authManager.getUserProfile();
  const role = userRole || profile?.role || 'buyer';
  const t = languageManager.t.bind(languageManager);
  
  // Get base URL from Vite for proper logo path
  const baseUrl = import.meta.env.BASE_URL || '/';
  const logoPath = `${baseUrl}logo.svg`.replace('//', '/'); // Avoid double slashes
  
  const buyerMenuItems = [
    { path: '/buyer/dashboard', icon: 'layout-dashboard', label: t('nav.dashboard') },
    { path: '/buyer/catalog', icon: 'package', label: t('nav.catalog') },
    { path: '/buyer/cart', icon: 'shopping-cart', label: t('nav.cart') },
    { path: '/buyer/orders', icon: 'file-text', label: t('nav.orders') },
    { path: '/buyer/invoices', icon: 'file-text', label: t('nav.invoices') },
    { path: '/buyer/sellers', icon: 'store', label: t('nav.sellers') },
    { path: '/buyer/chats', icon: 'message-circle', label: 'Chats' },
    { path: '/buyer/support', icon: 'help-circle', label: t('nav.support') },
    { path: '/buyer/notifications', icon: 'bell', label: t('nav.notifications') },
    { path: '/buyer/profile', icon: 'user', label: t('nav.profile') },
  ];

  const sellerMenuItems = [
    { path: '/seller/dashboard', icon: 'layout-dashboard', label: t('nav.dashboard') },
    { path: '/seller/products', icon: 'package', label: t('nav.products') },
    { path: '/seller/orders', icon: 'file-text', label: t('nav.orders') },
    { path: '/seller/invoices', icon: 'file-text', label: t('nav.invoices') },
    { path: '/seller/branches', icon: 'git-branch', label: t('nav.branches') },
    { path: '/seller/chats', icon: 'message-circle', label: 'Chats' },
    { path: '/seller/support', icon: 'help-circle', label: t('nav.support') },
    { path: '/seller/notifications', icon: 'bell', label: t('nav.notifications') },
    { path: '/seller/profile', icon: 'user', label: t('nav.profile') },
  ];

  const menuItems = role === 'seller' ? sellerMenuItems : buyerMenuItems;
  const currentPath = router.currentRoute;

  const app = document.getElementById('app');
  
  const displayName = escapeHtml(profile?.displayName || 'User');
  const roleText = escapeHtml(profile?.role || 'guest');
  const avatarLetter = displayName.charAt(0).toUpperCase() || 'U';
  
  app.innerHTML = `
    <div class="layout">
      <!-- Mobile Menu Button -->
      <button class="mobile-menu-btn" id="mobile-menu-btn">
        <i data-lucide="menu" id="menu-icon"></i>
      </button>

      <!-- Sidebar -->
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
          <img src="${logoPath}" alt="I ONE Construction" class="logo-svg" id="logo-link" style="cursor: pointer;" title="Go to Dashboard" />
          <div class="header-controls">
            <button class="theme-toggle" id="theme-toggle" title="Toggle Theme">
              <i data-lucide="${themeManager.getTheme() === 'dark' ? 'sun' : 'moon'}"></i>
            </button>
            <div class="language-dropdown">
              <button class="language-toggle" id="language-toggle" title="Change Language">
                ${t('languages.' + languageManager.getLanguage())}
                <i data-lucide="chevron-down" style="width: 14px; height: 14px; margin-left: 4px;"></i>
              </button>
              <div class="language-dropdown-menu" id="language-menu">
                <button class="language-option" data-lang="en">${t('languages.en')}</button>
                <button class="language-option" data-lang="ar">${t('languages.ar')}</button>
                <button class="language-option" data-lang="zh">${t('languages.zh')}</button>
                <button class="language-option" data-lang="ur">${t('languages.ur')}</button>
              </div>
            </div>
          </div>
        </div>

        <nav class="sidebar-nav">
          ${menuItems.map(item => `
            <a href="#" class="nav-item ${currentPath === item.path ? 'active' : ''}" data-path="${item.path}">
              <i data-lucide="${item.icon}"></i>
              <span>${item.label}</span>
            </a>
          `).join('')}
          
          <button class="nav-item logout-btn" id="logout-btn">
            <i data-lucide="log-out"></i>
            <span>${t('nav.signOut')}</span>
          </button>
        </nav>

        <div class="sidebar-footer">
          <div class="user-info">
            <div class="user-avatar">
              ${avatarLetter}
            </div>
            <div class="user-details">
              <p class="user-name">${displayName}</p>
              <p class="user-role">${roleText}</p>
            </div>
          </div>
        </div>
      </aside>

      <!-- Overlay for mobile -->
      <div class="sidebar-overlay" id="sidebar-overlay"></div>

      <!-- Cart Overlay Widget (only for buyers on catalog page) -->
      ${role === 'buyer' ? `
        <div class="cart-overlay-widget" id="cart-overlay-widget" style="display: none;">
          <div class="cart-overlay-header">
            <i data-lucide="shopping-cart"></i>
            <span class="cart-overlay-title">Cart</span>
            <span class="cart-overlay-count" id="cart-overlay-count">0</span>
          </div>
          <div class="cart-overlay-body" id="cart-overlay-body">
            <p class="cart-overlay-empty">Your cart is empty</p>
          </div>
          <div class="cart-overlay-footer">
            <button class="btn btn-sm btn-primary" id="cart-overlay-checkout">
              <i data-lucide="credit-card"></i>
              Checkout
            </button>
          </div>
        </div>
      ` : ''}

      <!-- Main Content -->
      <main class="main-content" id="main-content">
        ${content}
      </main>
    </div>
  `;

  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Setup event listeners
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const menuIcon = document.getElementById('menu-icon');
  const logoutBtn = document.getElementById('logout-btn');
  const navItems = document.querySelectorAll('.nav-item[data-path]');
  const themeToggle = document.getElementById('theme-toggle');
  const languageToggle = document.getElementById('language-toggle');
  const languageMenu = document.getElementById('language-menu');
  const logoLink = document.getElementById('logo-link');

  function toggleSidebar() {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
    
    // Update icon
    const isOpen = sidebar.classList.contains('open');
    menuIcon.setAttribute('data-lucide', isOpen ? 'x' : 'menu');
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
    menuIcon.setAttribute('data-lucide', 'menu');
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  mobileMenuBtn.addEventListener('click', toggleSidebar);
  overlay.addEventListener('click', closeSidebar);

  // Logo click handler - redirect to dashboard based on user role
  if (logoLink) {
    logoLink.addEventListener('click', () => {
      const profile = authManager.getUserProfile();
      const userRole = profile?.role;
      
      if (userRole === 'seller') {
        router.navigate('/seller/dashboard');
      } else if (userRole === 'buyer') {
        router.navigate('/buyer/dashboard');
      } else if (userRole === 'admin') {
        router.navigate('/admin/dashboard');
      } else {
        // If no role, redirect to profile selection
        router.navigate('/profile-selection');
      }
      
      // Close sidebar on mobile after navigation
      closeSidebar();
    });
  }

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const path = item.getAttribute('data-path');
      closeSidebar();
      router.navigate(path);
    });
  });

  logoutBtn.addEventListener('click', async () => {
    const result = await authManager.signOut();
    if (result.success) {
      router.navigate('/login');
    }
  });

  // Theme toggle
  themeToggle.addEventListener('click', () => {
    const newTheme = themeManager.toggle();
    const icon = themeToggle.querySelector('i');
    icon.setAttribute('data-lucide', newTheme === 'dark' ? 'sun' : 'moon');
    if (window.lucide) {
      window.lucide.createIcons();
    }
  });

  // Language toggle
  if (languageToggle && languageMenu) {
    languageToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      languageMenu.classList.toggle('active');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      languageMenu.classList.remove('active');
    });

    // Language selection
    languageMenu.querySelectorAll('.language-option').forEach(option => {
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        const lang = option.getAttribute('data-lang');
        languageManager.setLanguage(lang);
      });
    });
  }

  // Initialize cart overlay for buyers
  if (role === 'buyer') {
    initCartOverlay();
  }
}

// Initialize cart overlay widget
async function initCartOverlay() {
  const cartOverlay = document.getElementById('cart-overlay-widget');
  const cartOverlayCount = document.getElementById('cart-overlay-count');
  const cartOverlayBody = document.getElementById('cart-overlay-body');
  const cartCheckoutBtn = document.getElementById('cart-overlay-checkout');
  
  if (!cartOverlay) return;
  
  // Import cart manager dynamically
  const { default: cartManager } = await import('./cart.js');
  
  // Update cart display and visibility
  function updateCartOverlay() {
    const cartItems = cartManager.getCart();
    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    
    // Check if on catalog page
    const currentPath = router.currentRoute;
    const isOnCatalogPage = currentPath === '/buyer/catalog';
    
    // Show overlay only if on catalog page AND cart has items
    if (isOnCatalogPage && cartItems.length > 0) {
      cartOverlay.style.display = 'block';
    } else {
      cartOverlay.style.display = 'none';
    }
    
    cartOverlayCount.textContent = itemCount;
    
    if (cartItems.length === 0) {
      cartOverlayBody.innerHTML = '<p class="cart-overlay-empty">Your cart is empty</p>';
    } else {
      const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      cartOverlayBody.innerHTML = `
        <div class="cart-overlay-items">
          ${cartItems.slice(0, 3).map(item => `
            <div class="cart-overlay-item">
              <span class="cart-overlay-item-name">${escapeHtml(item.name || item.modelNumber)}</span>
              <span class="cart-overlay-item-qty">×${item.quantity}</span>
            </div>
          `).join('')}
          ${cartItems.length > 3 ? `<p class="cart-overlay-more">+${cartItems.length - 3} more items</p>` : ''}
        </div>
        <div class="cart-overlay-total">
          <span>Total:</span>
          <span class="cart-overlay-total-amount">$${total.toFixed(2)}</span>
        </div>
      `;
    }
    
    if (window.lucide) window.lucide.createIcons();
  }
  
  // Initial update
  updateCartOverlay();
  
  // Subscribe to cart changes
  cartManager.subscribe(updateCartOverlay);
  
  // Listen for route changes to update visibility
  const originalNavigate = router.navigate.bind(router);
  router.navigate = function(path) {
    originalNavigate(path);
    // Use setTimeout to ensure route is updated before checking
    setTimeout(updateCartOverlay, 0);
  };
  
  // Also listen for popstate (back/forward buttons)
  window.addEventListener('popstate', () => {
    setTimeout(updateCartOverlay, 0);
  });
  
  // Checkout button
  cartCheckoutBtn.addEventListener('click', () => {
    router.navigate('/buyer/cart');
  });
  
  // Make cart overlay clickable to navigate to cart
  cartOverlay.addEventListener('click', (e) => {
    if (e.target !== cartCheckoutBtn && !cartCheckoutBtn.contains(e.target)) {
      router.navigate('/buyer/cart');
    }
  });
}

// Helper function to render page with layout
export function renderPageWithLayout(pageContent, userRole = null) {
  renderLayout(pageContent, userRole);
}
