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
          // Validate that product has sellerId
          if (!product.sellerId || product.sellerId === '') {
            window.toast.error('This product is missing seller information and cannot be added to cart. Please contact support.');
            console.error('Product missing sellerId:', product);
            return;
          }
          
          // Show dimension input modal
          showDimensionModal(product);
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

  // Function to show dimension modal
  function showDimensionModal(product) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>${t('cart.enterDimensions')}</h2>
          <button class="modal-close" id="modal-close">
            <i data-lucide="x"></i>
          </button>
        </div>
        <div class="modal-body">
          <p style="margin-bottom: 16px;">${escapeHtml(product.modelNumber || product.name || 'Product')}</p>
          <div class="form-group">
            <label>${t('cart.length')} (m)</label>
            <input type="number" id="dimension-length" class="form-control" min="0" step="0.01" placeholder="0.00" required>
          </div>
          <div class="form-group">
            <label>${t('cart.width')} (m)</label>
            <input type="number" id="dimension-width" class="form-control" min="0" step="0.01" placeholder="0.00" required>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="modal-cancel">${t('common.cancel')}</button>
          <button class="btn btn-primary" id="modal-add-to-cart">${t('catalog.addToCart')}</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    document.body.classList.add('modal-open');
    
    // Initialize Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
    
    const lengthInput = document.getElementById('dimension-length');
    const widthInput = document.getElementById('dimension-width');
    const addBtn = document.getElementById('modal-add-to-cart');
    const closeBtn = document.getElementById('modal-close');
    const cancelBtn = document.getElementById('modal-cancel');
    
    const closeModal = () => {
      document.body.removeChild(modal);
      document.body.classList.remove('modal-open');
    };
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    
    addBtn.addEventListener('click', async () => {
      const length = parseFloat(lengthInput.value);
      const width = parseFloat(widthInput.value);
      
      if (isNaN(length) || !isFinite(length) || length <= 0 || 
          isNaN(width) || !isFinite(width) || width <= 0) {
        window.toast.error(t('cart.pleaseEnterValidDimensions'));
        return;
      }
      
      // Create a unique cart item ID that includes dimensions
      const cartItemId = `${product.id}_${length}_${width}`;
      
      // Normalize product data for cart
      const cartProduct = {
        ...product,
        cartItemId: cartItemId, // Unique identifier for cart item
        productId: product.id, // Original product ID
        name: product.modelNumber || product.name || 'Product',
        seller: product.sellerName || 'Unknown Seller',
        sellerId: product.sellerId,
        price: product.pricePerMeter || product.price || 0,
        unit: product.unit || 'unit',
        minOrder: product.minOrder || 1,
        dimensions: {
          length: length,
          width: width
        }
      };
      
      await cartManager.addToCart(cartProduct, cartProduct.minOrder);
      closeModal();
      showGoToCartOverlay(cartProduct);
    });
    
    // Focus on first input
    lengthInput.focus();
  }
  
  // Function to show "Go to Cart" success overlay
  function showGoToCartOverlay(product) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay success-overlay';
    overlay.innerHTML = `
      <div class="modal-content success-modal">
        <div class="success-icon">
          <i data-lucide="check-circle"></i>
        </div>
        <h2>${t('cart.itemAdded')}</h2>
        <p>${escapeHtml(product.name)}</p>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="continue-shopping">${t('cart.continueShopping')}</button>
          <button class="btn btn-primary" id="go-to-cart">${t('cart.goToCart')}</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    document.body.classList.add('modal-open');
    
    // Initialize Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
    
    const closeOverlay = () => {
      document.body.removeChild(overlay);
      document.body.classList.remove('modal-open');
    };
    
    const continueBtn = document.getElementById('continue-shopping');
    const goToCartBtn = document.getElementById('go-to-cart');
    
    continueBtn.addEventListener('click', closeOverlay);
    goToCartBtn.addEventListener('click', () => {
      closeOverlay();
      router.navigate('/buyer/cart');
    });
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeOverlay();
    });
    
    // Auto-close after 5 seconds
    setTimeout(closeOverlay, 5000);
  }
}
