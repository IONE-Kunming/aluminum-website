import { renderPageWithLayout } from '../js/layout.js';
import languageManager from '../js/language.js';
import dataService from '../js/dataService.js';
import authManager from '../js/auth.js';
import router from '../js/router.js';
import { escapeHtml } from '../js/utils.js';

export async function renderSellers() {
  const t = languageManager.t.bind(languageManager);
  
  // Fetch all sellers and products
  const allSellers = await dataService.getSellers();
  const allProducts = await dataService.getProducts({ limit: 500 });
  const categories = await dataService.getCategories();
  
  // Get current user to check if authenticated
  const currentUser = authManager.getCurrentUser();
  
  // Group products by seller and category
  const sellerProductMap = new Map();
  const sellerCategoryMap = new Map();
  
  allProducts.forEach(product => {
    if (!product.sellerId) return;
    
    if (!sellerProductMap.has(product.sellerId)) {
      sellerProductMap.set(product.sellerId, []);
    }
    sellerProductMap.set(product.sellerId, [...sellerProductMap.get(product.sellerId), product]);
    
    if (product.category) {
      if (!sellerCategoryMap.has(product.sellerId)) {
        sellerCategoryMap.set(product.sellerId, new Set());
      }
      sellerCategoryMap.get(product.sellerId).add(product.category);
    }
  });
  
  const renderSellers = (sellersToRender) => {
    const sellersGrid = document.querySelector('.sellers-grid-container');
    if (!sellersGrid) return;

    if (sellersToRender.length === 0) {
      sellersGrid.innerHTML = `
        <div class="empty-state">
          <i data-lucide="store" style="width: 64px; height: 64px; opacity: 0.3;"></i>
          <h2>${t('sellers.noSellers')}</h2>
          <p>${t('sellers.directory')}</p>
        </div>
      `;
    } else {
      sellersGrid.innerHTML = `
        <div class="sellers-grid">
          ${sellersToRender.map(seller => {
            const sellerId = seller.uid || seller.id;
            const productCount = sellerProductMap.get(sellerId)?.length || 0;
            const sellerCategories = Array.from(sellerCategoryMap.get(sellerId) || []);
            const city = seller.address?.city || seller.city || 'N/A';
            
            return `
              <div class="seller-card card">
                <div class="seller-header">
                  <div class="seller-avatar">
                    <i data-lucide="store" style="width: 32px; height: 32px;"></i>
                  </div>
                  <div class="seller-info">
                    <h3>${escapeHtml(seller.displayName || seller.email || 'Unknown Seller')}</h3>
                    ${seller.companyName ? `<p class="seller-company">${escapeHtml(seller.companyName)}</p>` : ''}
                  </div>
                </div>
                <div class="seller-body">
                  <div class="seller-detail">
                    <i data-lucide="map-pin"></i>
                    <span><strong>${t('catalog.city')}:</strong> ${escapeHtml(city)}</span>
                  </div>
                  ${seller.email ? `
                    <div class="seller-detail">
                      <i data-lucide="mail"></i>
                      <span>${escapeHtml(seller.email)}</span>
                    </div>
                  ` : ''}
                  ${seller.phoneNumber ? `
                    <div class="seller-detail">
                      <i data-lucide="phone"></i>
                      <span>${escapeHtml(seller.phoneNumber)}</span>
                    </div>
                  ` : ''}
                  <div class="seller-detail">
                    <i data-lucide="package"></i>
                    <span><strong>${t('products.title')}:</strong> ${productCount}</span>
                  </div>
                  ${sellerCategories.length > 0 ? `
                    <div class="seller-detail">
                      <i data-lucide="tag"></i>
                      <span><strong>${t('products.category')}:</strong> ${sellerCategories.slice(0, 2).map(c => escapeHtml(c)).join(', ')}${sellerCategories.length > 2 ? '...' : ''}</span>
                    </div>
                  ` : ''}
                </div>
                ${currentUser ? `
                  <div class="seller-actions" style="display: flex; gap: 8px;">
                    <button class="btn btn-primary flex-1 view-products-btn" data-seller-id="${sellerId}">
                      <i data-lucide="package"></i>
                      ${t('catalog.viewProducts')}
                    </button>
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      `;
    }
    
    // Add event listeners
    document.querySelectorAll('.view-products-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const sellerId = btn.dataset.sellerId;
        router.navigate(`/buyer/catalog?seller=${sellerId}`);
      });
    });

    if (window.lucide) window.lucide.createIcons();
  };

  const content = `
    <div class="sellers-page">
      <div class="page-header">
        <h1>${t('sellers.title')}</h1>
        <p>${t('sellers.subtitle')}</p>
      </div>

      <!-- Filter Section -->
      <div class="filter-section card" style="margin-bottom: 24px;">
        <div class="filter-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="margin: 0;">${t('sellers.filterByCategory')}</h3>
          <button class="btn btn-text btn-sm" id="resetFilters">
            <i data-lucide="x"></i>
            ${t('common.reset')}
          </button>
        </div>
        <div class="filter-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
          <div class="form-group">
            <label>${t('products.category')}</label>
            <select id="categoryFilter" class="form-control">
              <option value="">${t('common.allCategories')}</option>
              ${categories.map(cat => `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>${t('common.search')}</label>
            <input type="text" id="searchInput" class="form-control" placeholder="${t('common.search')} ${t('sellers.title').toLowerCase()}...">
          </div>
        </div>
      </div>

      <div class="sellers-grid-container">
        <!-- Sellers will be rendered here -->
      </div>
    </div>
  `;

  renderPageWithLayout(content, 'buyer');
  if (window.lucide) window.lucide.createIcons();
  
  // Initial render
  renderSellers(allSellers);
  
  // Filter function
  const applyFilters = () => {
    const category = document.getElementById('categoryFilter')?.value || '';
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    
    let filtered = allSellers;
    
    // Filter by category
    if (category) {
      filtered = filtered.filter(seller => {
        const sellerId = seller.uid || seller.id;
        const categories = sellerCategoryMap.get(sellerId);
        return categories && categories.has(category);
      });
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(seller => {
        const name = (seller.displayName || '').toLowerCase();
        const company = (seller.companyName || '').toLowerCase();
        const email = (seller.email || '').toLowerCase();
        return name.includes(searchTerm) || company.includes(searchTerm) || email.includes(searchTerm);
      });
    }
    
    renderSellers(filtered);
  };
  
  // Add event listeners for filters
  const categoryFilter = document.getElementById('categoryFilter');
  const searchInput = document.getElementById('searchInput');
  
  if (categoryFilter) {
    categoryFilter.addEventListener('change', applyFilters);
  }
  
  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }
  
  // Reset filters
  const resetButton = document.getElementById('resetFilters');
  if (resetButton) {
    resetButton.addEventListener('click', () => {
      if (categoryFilter) categoryFilter.value = '';
      if (searchInput) searchInput.value = '';
      renderSellers(allSellers);
    });
  }
}
