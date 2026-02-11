import { renderPageWithLayout } from '../js/layout.js';
import router from '../js/router.js';
import authManager from '../js/auth.js';
import { escapeHtml } from '../js/utils.js';
import languageManager from '../js/language.js';
import dataService from '../js/dataService.js';

export async function renderCatalog() {
  const profile = authManager.getUserProfile();
  const t = languageManager.t.bind(languageManager);
  const urlParams = new URLSearchParams(window.location.search);
  const sellerId = urlParams.get('seller');
  
  // If sellerId is provided, show products for that seller
  if (sellerId) {
    await renderSellerProducts(sellerId, t);
    return;
  }
  
  // Otherwise, show seller tiles
  await renderSellerTiles(t);
}

// Render products for a specific seller
async function renderSellerProducts(sellerId, t) {
  const products = await dataService.getProducts({ sellerId });
  const sellers = await dataService.getSellers();
  const seller = sellers.find(s => s.id === sellerId || s.uid === sellerId);
  
  const renderProducts = (productsToRender) => {
    const productsGrid = document.querySelector('.products-grid');
    if (!productsGrid) return;

    if (productsToRender.length === 0) {
      productsGrid.innerHTML = `
        <div class="empty-state">
          <i data-lucide="package-open" style="width: 64px; height: 64px; opacity: 0.3; margin-bottom: 16px;"></i>
          <p>${t('catalog.noProducts')}</p>
        </div>
      `;
    } else {
      productsGrid.innerHTML = productsToRender.map(product => `
        <div class="product-card card" data-product-id="${product.id}" style="cursor: pointer;">
          ${product.imageUrl ? `
            <img src="${product.imageUrl}" 
                 alt="${escapeHtml(product.modelNumber || product.name || 'Product')}" 
                 loading="lazy"
                 onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='flex';"
                 style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px 8px 0 0; margin: -16px -16px 16px -16px;" />
            <div style="width: calc(100% + 32px); height: 200px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0; margin: -16px -16px 16px -16px; display: none; align-items: center; justify-content: center; flex-direction: column; color: white;">
              <i data-lucide="image-off" style="width: 48px; height: 48px; opacity: 0.8; margin-bottom: 8px;"></i>
              <span style="font-size: 12px; opacity: 0.8;">Image not available</span>
            </div>
          ` : `
            <div style="width: calc(100% + 32px); height: 200px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0; margin: -16px -16px 16px -16px; display: flex; align-items: center; justify-content: center; flex-direction: column; color: white;">
              <i data-lucide="package" style="width: 48px; height: 48px; opacity: 0.8; margin-bottom: 8px;"></i>
              <span style="font-size: 12px; opacity: 0.8;">No image</span>
            </div>
          `}
          <div class="product-header">
            <h3>${escapeHtml(product.modelNumber || product.name || 'Product')}</h3>
            <span class="product-category">${escapeHtml(product.category || 'Uncategorized')}</span>
          </div>
          <div class="product-body">
            <p>${escapeHtml(product.description || 'No description available')}</p>
            <div class="product-info">
              <div class="info-item">
                <span class="label">${t('catalog.price')}</span>
                <span class="value">$${product.pricePerMeter || product.price || 0}/${escapeHtml(product.unit || 'unit')}</span>
              </div>
              <div class="info-item">
                <span class="label">${t('catalog.minOrder')}</span>
                <span class="value">${product.minOrder || 1} ${escapeHtml(product.unit || 'unit')}</span>
              </div>
              <div class="info-item">
                <span class="label">${t('catalog.stock')}</span>
                <span class="value">${product.stock || 'Available'}</span>
              </div>
            </div>
          </div>
          <div class="product-footer">
            <span class="view-details-text">
              <i data-lucide="eye"></i>
              ${t('catalog.viewDetails')}
            </span>
          </div>
        </div>
      `).join('');
    }

    // Re-attach event listeners for product cards
    document.querySelectorAll('.product-card[data-product-id]').forEach(card => {
      card.addEventListener('click', () => {
        const productId = card.getAttribute('data-product-id');
        router.navigate(`/buyer/product?id=${productId}`);
      });
    });

    if (window.lucide) window.lucide.createIcons();
  };
  
  const content = `
    <div class="catalog-page">
      <div class="page-header">
        <div>
          <h1>${t('catalog.productsFrom')} ${escapeHtml(seller?.displayName || seller?.companyName || 'Seller')}</h1>
          <p>${t('catalog.subtitle')}</p>
        </div>
        <button class="btn btn-secondary" onclick="window.history.back()">
          <i data-lucide="arrow-left"></i>
          ${t('common.back')}
        </button>
      </div>

      <div class="catalog-controls" style="margin-bottom: 24px;">
        <input type="text" id="search-input" placeholder="${t('common.search')}..." class="form-control">
      </div>

      <div class="products-grid">
        <!-- Products will be rendered here -->
      </div>
    </div>
  `;

  renderPageWithLayout(content, 'buyer');
  renderProducts(products);

  // Add search functionality
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const searchTerm = searchInput.value.toLowerCase();
      let filtered = products;

      if (searchTerm) {
        filtered = filtered.filter(p => {
          const name = (p.modelNumber || p.name || '').toLowerCase();
          const description = (p.description || '').toLowerCase();
          return name.includes(searchTerm) || description.includes(searchTerm);
        });
      }

      renderProducts(filtered);
    });
  }
}

// Render seller tiles
async function renderSellerTiles(t) {
  const allProducts = await dataService.getProducts();
  const allSellers = await dataService.getSellers();
  const categories = await dataService.getCategories();
  
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
  
  // Filter sellers who have products
  const sellersWithProducts = allSellers.filter(seller => 
    sellerProductMap.has(seller.uid) || sellerProductMap.has(seller.id)
  );
  
  const renderSellers = (sellersToRender) => {
    const sellersGrid = document.querySelector('.sellers-grid');
    if (!sellersGrid) return;

    if (sellersToRender.length === 0) {
      sellersGrid.innerHTML = `
        <div class="empty-state">
          <i data-lucide="store" style="width: 64px; height: 64px; opacity: 0.3; margin-bottom: 16px;"></i>
          <p>${t('catalog.noSellers')}</p>
        </div>
      `;
    } else {
      sellersGrid.innerHTML = sellersToRender.map(seller => {
        const sellerId = seller.uid || seller.id;
        const productCount = sellerProductMap.get(sellerId)?.length || 0;
        const sellerCategories = Array.from(sellerCategoryMap.get(sellerId) || []);
        const city = seller.address?.city || seller.city || 'N/A';
        
        return `
          <div class="seller-tile card">
            <div class="seller-tile-header">
              <div class="seller-avatar">
                <i data-lucide="store"></i>
              </div>
              <div class="seller-tile-info">
                <h3>${escapeHtml(seller.displayName || seller.email || 'Seller')}</h3>
                ${seller.companyName ? `<p class="seller-company">${escapeHtml(seller.companyName)}</p>` : ''}
              </div>
            </div>
            <div class="seller-tile-body">
              <div class="seller-detail">
                <i data-lucide="map-pin"></i>
                <span><strong>${t('catalog.city')}:</strong> ${escapeHtml(city)}</span>
              </div>
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
            <div class="seller-tile-actions">
              <button class="btn btn-text btn-sm view-seller-info-btn" data-seller-id="${sellerId}">
                <i data-lucide="info"></i>
                ${t('sellers.viewInfo')}
              </button>
              <button class="btn btn-primary btn-sm view-products-btn" data-seller-id="${sellerId}">
                <i data-lucide="package"></i>
                ${t('catalog.viewProducts')}
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    // Add event listeners
    document.querySelectorAll('.view-products-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const sellerId = btn.dataset.sellerId;
        router.navigate(`/buyer/catalog?seller=${sellerId}`);
      });
    });
    
    document.querySelectorAll('.view-seller-info-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const sellerId = btn.dataset.sellerId;
        const seller = sellersWithProducts.find(s => s.uid === sellerId || s.id === sellerId);
        if (seller) {
          showSellerInfoModal(seller, t);
        }
      });
    });

    if (window.lucide) window.lucide.createIcons();
  };

  const content = `
    <div class="catalog-page">
      <div class="page-header">
        <h1>${t('catalog.title')}</h1>
        <p>${t('catalog.sellerDirectory')}</p>
      </div>

      <div class="catalog-controls" style="margin-bottom: 24px; display: grid; grid-template-columns: 1fr auto; gap: 16px;">
        <input type="text" id="search-input" placeholder="${t('common.search')} ${t('sellers.title').toLowerCase()}..." class="form-control">
        <select id="category-filter" class="form-control" style="max-width: 250px;">
          <option value="">${t('common.allCategories')}</option>
          ${categories.map(cat => `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`).join('')}
        </select>
      </div>

      <div class="sellers-grid">
        <!-- Sellers will be rendered here -->
      </div>
    </div>
  `;

  renderPageWithLayout(content, 'buyer');
  renderSellers(sellersWithProducts);

  // Add search and filter functionality
  const searchInput = document.getElementById('search-input');
  const categoryFilter = document.getElementById('category-filter');

  const applyFilters = () => {
    const searchTerm = searchInput?.value.toLowerCase() || '';
    const category = categoryFilter?.value || '';

    let filtered = sellersWithProducts;

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

  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  if (categoryFilter) {
    categoryFilter.addEventListener('change', applyFilters);
  }
}

// Show seller info modal
function showSellerInfoModal(seller, t) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 500px;">
      <div class="modal-header">
        <h2>${t('sellers.viewInfo')}</h2>
        <button class="btn-close-modal">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="modal-body">
        <div style="margin-bottom: 16px;">
          <strong>${t('profile.displayName')}:</strong>
          <p>${escapeHtml(seller.displayName || 'N/A')}</p>
        </div>
        ${seller.companyName ? `
          <div style="margin-bottom: 16px;">
            <strong>${t('sellers.company')}:</strong>
            <p>${escapeHtml(seller.companyName)}</p>
          </div>
        ` : ''}
        <div style="margin-bottom: 16px;">
          <strong>${t('profile.email')}:</strong>
          <p>${escapeHtml(seller.email || 'N/A')}</p>
        </div>
        ${seller.phoneNumber ? `
          <div style="margin-bottom: 16px;">
            <strong>${t('auth.phoneNumber')}:</strong>
            <p>${escapeHtml(seller.phoneNumber)}</p>
          </div>
        ` : ''}
        ${seller.address?.city ? `
          <div style="margin-bottom: 16px;">
            <strong>${t('catalog.city')}:</strong>
            <p>${escapeHtml(seller.address.city)}</p>
          </div>
        ` : ''}
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary btn-close-modal">${t('common.close')}</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  if (window.lucide) window.lucide.createIcons();
  
  // Close modal handlers
  modal.querySelectorAll('.btn-close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      modal.remove();
    });
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

    }

    // Re-attach event listeners for product cards
    document.querySelectorAll('.product-card[data-product-id]').forEach(card => {
      card.addEventListener('click', () => {
        const productId = card.getAttribute('data-product-id');
        router.navigate(`/buyer/product?id=${productId}`);
      });
    });

    // Initialize Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  };
  
  const content = `
    <div class="catalog-page">
      <div class="page-header">
        <h1>${t('catalog.title')}</h1>
        <p>${t('catalog.subtitle')}</p>
      </div>

      <div class="catalog-controls">
        <input type="text" id="search-input" placeholder="${t('common.search')}..." class="form-control">
        <select id="category-filter" class="form-control">
          <option value="">All Categories</option>
          ${categories.map(cat => `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`).join('')}
        </select>
      </div>

      <div class="products-grid">
        <!-- Products will be rendered here -->
      </div>
    </div>
  `;

  renderPageWithLayout(content, 'buyer');
  
  // Render initial products
  renderProducts(products);

  // Add search functionality
  const searchInput = document.getElementById('search-input');
  const categoryFilter = document.getElementById('category-filter');

  const filterProducts = () => {
    const searchTerm = searchInput?.value.toLowerCase() || '';
    const category = categoryFilter?.value || '';

    let filtered = allProducts;

    // Filter by category
    if (category) {
      filtered = filtered.filter(p => p.category === category);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(p => {
        const name = (p.modelNumber || p.name || '').toLowerCase();
        const description = (p.description || '').toLowerCase();
        const seller = (p.sellerName || '').toLowerCase();
        return name.includes(searchTerm) || description.includes(searchTerm) || seller.includes(searchTerm);
      });
    }

    renderProducts(filtered);
  };

  if (searchInput) {
    searchInput.addEventListener('input', filterProducts);
  }

  if (categoryFilter) {
    categoryFilter.addEventListener('change', filterProducts);
  }
}
