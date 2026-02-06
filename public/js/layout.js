import router from './router.js';
import authManager from './auth.js';
import { escapeHtml } from './utils.js';

export function renderLayout(content, userRole = null) {
  const profile = authManager.getUserProfile();
  const role = userRole || profile?.role || 'buyer';
  
  const buyerMenuItems = [
    { path: '/buyer/dashboard', icon: 'layout-dashboard', label: 'Dashboard' },
    { path: '/buyer/catalog', icon: 'package', label: 'Product Catalog' },
    { path: '/buyer/cart', icon: 'shopping-cart', label: 'Shopping Cart' },
    { path: '/buyer/orders', icon: 'file-text', label: 'My Orders' },
    { path: '/buyer/invoices', icon: 'file-text', label: 'Invoices' },
    { path: '/buyer/sellers', icon: 'store', label: 'Sellers Directory' },
    { path: '/buyer/support', icon: 'help-circle', label: 'Support' },
    { path: '/buyer/notifications', icon: 'bell', label: 'Notifications' },
    { path: '/buyer/profile', icon: 'user', label: 'Profile' },
  ];

  const sellerMenuItems = [
    { path: '/seller/dashboard', icon: 'layout-dashboard', label: 'Dashboard' },
    { path: '/seller/products', icon: 'package', label: 'My Products' },
    { path: '/seller/orders', icon: 'file-text', label: 'Orders' },
    { path: '/seller/invoices', icon: 'file-text', label: 'Invoices' },
    { path: '/seller/branches', icon: 'git-branch', label: 'Branches' },
    { path: '/seller/support', icon: 'help-circle', label: 'Support' },
    { path: '/seller/notifications', icon: 'bell', label: 'Notifications' },
    { path: '/seller/profile', icon: 'user', label: 'Profile' },
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
          <h1 class="logo">IONE</h1>
          <p class="logo-subtitle">AlumaTech Industries</p>
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
            <span>Sign Out</span>
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
}

// Helper function to render page with layout
export function renderPageWithLayout(pageContent, userRole = null) {
  renderLayout(pageContent, userRole);
}
