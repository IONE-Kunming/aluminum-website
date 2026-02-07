import { renderPageWithLayout } from '../js/layout.js';
import router from '../js/router.js';
import authManager from '../js/auth.js';
import cartManager from '../js/cart.js';
import { escapeHtml } from '../js/utils.js';
import languageManager from '../js/language.js';

const mockProducts = [
  {
    id: 1,
    name: 'Aluminum Sheet 6061-T6',
    category: 'Sheets',
    seller: 'I ONE Construction',
    price: 25,
    unit: 'kg',
    minOrder: 100,
    description: 'High-quality aluminum sheet suitable for aerospace and automotive applications',
    stock: 500
  },
  {
    id: 2,
    name: 'Aluminum Extrusion Profile',
    category: 'Extrusions',
    seller: 'Metro Aluminum Co.',
    price: 35,
    unit: 'unit',
    minOrder: 50,
    description: 'Custom aluminum extrusion profiles for construction and manufacturing',
    stock: 800
  },
  {
    id: 3,
    name: 'Aluminum Rod 2024-T4',
    category: 'Rods',
    seller: 'Premium Metals Ltd.',
    price: 45,
    unit: 'kg',
    minOrder: 50,
    description: 'Aircraft-grade aluminum rod with excellent strength-to-weight ratio',
    stock: 250
  }
];

export function renderCatalog() {
  const profile = authManager.getUserProfile();
  const t = languageManager.t.bind(languageManager);
  
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
          <option value="Sheets">Sheets</option>
          <option value="Extrusions">Extrusions</option>
          <option value="Rods">Rods</option>
          <option value="Plates">Plates</option>
        </select>
      </div>

      <div class="products-grid">
        ${mockProducts.map(product => `
          <div class="product-card card">
            ${product.imageUrl ? `
              <img src="${product.imageUrl}" alt="${escapeHtml(product.name)}" 
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
              <h3>${escapeHtml(product.name)}</h3>
              <span class="product-category">${escapeHtml(product.category)}</span>
            </div>
            <div class="product-body">
              <p>${escapeHtml(product.description)}</p>
              <div class="product-info">
                <div class="info-item">
                  <span class="label">${t('catalog.seller')}</span>
                  <span class="value">${escapeHtml(product.seller)}</span>
                </div>
                <div class="info-item">
                  <span class="label">${t('catalog.price')}</span>
                  <span class="value">$${product.price}/${escapeHtml(product.unit)}</span>
                </div>
                <div class="info-item">
                  <span class="label">${t('catalog.minOrder')}</span>
                  <span class="value">${product.minOrder} ${escapeHtml(product.unit)}</span>
                </div>
                <div class="info-item">
                  <span class="label">${t('catalog.stock')}</span>
                  <span class="value">${product.stock} ${escapeHtml(product.unit)}</span>
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
        `).join('')}
      </div>
    </div>
  `;

  renderPageWithLayout(content, 'buyer');

  // Add to cart functionality
  document.querySelectorAll('[data-product-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const productId = parseInt(btn.getAttribute('data-product-id'));
      const product = mockProducts.find(p => p.id === productId);
      
      if (product) {
        cartManager.addToCart(product, product.minOrder);
        window.toast.success(`${product.name} added to cart!`);
      }
    });
  });

  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
}
