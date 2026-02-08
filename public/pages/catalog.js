import { renderPageWithLayout } from '../js/layout.js';
import router from '../js/router.js';
import authManager from '../js/auth.js';
import cartManager from '../js/cart.js';
import { escapeHtml } from '../js/utils.js';
import languageManager from '../js/language.js';
import dataService from '../js/dataService.js';

export async function renderCatalog() {
  const profile = authManager.getUserProfile();
  const t = languageManager.t.bind(languageManager);
  
  // Fetch real products and categories from Firebase
  let products = await dataService.getProducts();
  let allProducts = products; // Keep a copy for filtering
  let categories = await dataService.getCategories(); // Fetch unique categories
  
  const renderProducts = (productsToRender) => {
    const productsGrid = document.querySelector('.products-grid');
    if (!productsGrid) return;

    if (productsToRender.length === 0) {
      productsGrid.innerHTML = `
        <div class="empty-state">
          <i data-lucide="package-open" style="width: 64px; height: 64px; opacity: 0.3; margin-bottom: 16px;"></i>
          <p>No products found. Sellers can add products to the catalog.</p>
        </div>
      `;
    } else {
      productsGrid.innerHTML = productsToRender.map(product => `
        <div class="product-card card">
          ${product.imageUrl ? `
            <img src="${product.imageUrl}" alt="${escapeHtml(product.modelNumber || product.name || 'Product')}" 
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
                <span class="label">${t('catalog.seller')}</span>
                <span class="value">${escapeHtml(product.sellerName || 'Unknown Seller')}</span>
              </div>
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
            <button class="btn btn-primary" data-product-id="${product.id}">
              <i data-lucide="shopping-cart"></i>
              ${t('catalog.addToCart')}
            </button>
          </div>
        </div>
      `).join('');
    }

    // Re-attach event listeners for add to cart
    document.querySelectorAll('[data-product-id]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const productId = btn.getAttribute('data-product-id');
        const product = productsToRender.find(p => String(p.id) === productId);
        
        if (product) {
          // Normalize product data for cart
          const cartProduct = {
            ...product,
            name: product.modelNumber || product.name || 'Product',
            price: product.pricePerMeter || product.price || 0,
            unit: product.unit || 'unit',
            minOrder: product.minOrder || 1
          };
          await cartManager.addToCart(cartProduct, cartProduct.minOrder);
          window.toast.success(`${cartProduct.name} added to cart!`);
        }
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
