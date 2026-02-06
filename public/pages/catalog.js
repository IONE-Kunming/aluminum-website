import { renderPageWithLayout } from '../js/layout.js';
import router from '../js/router.js';
import authManager from '../js/auth.js';
import { escapeHtml } from '../js/utils.js';

const mockProducts = [
  {
    id: 1,
    name: 'Aluminum Sheet 6061-T6',
    category: 'Sheets',
    seller: 'AlumaTech Industries',
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
  
  const content = `
    <div class="catalog-page">
      <div class="page-header">
        <h1>Product Catalog</h1>
        <p>Browse our selection of premium aluminum products</p>
      </div>

      <div class="catalog-controls">
        <input type="text" id="search-input" placeholder="Search products..." class="form-control">
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
            <div class="product-header">
              <h3>${escapeHtml(product.name)}</h3>
              <span class="product-category">${escapeHtml(product.category)}</span>
            </div>
            <div class="product-body">
              <p>${escapeHtml(product.description)}</p>
              <div class="product-info">
                <div class="info-item">
                  <span class="label">Seller:</span>
                  <span class="value">${escapeHtml(product.seller)}</span>
                </div>
                <div class="info-item">
                  <span class="label">Price:</span>
                  <span class="value">$${product.price}/${escapeHtml(product.unit)}</span>
                </div>
                <div class="info-item">
                  <span class="label">Min Order:</span>
                  <span class="value">${product.minOrder} ${escapeHtml(product.unit)}</span>
                </div>
                <div class="info-item">
                  <span class="label">Stock:</span>
                  <span class="value">${product.stock} ${escapeHtml(product.unit)}</span>
                </div>
              </div>
            </div>
            <div class="product-footer">
              <button class="btn btn-primary" data-product-id="${product.id}">
                <i data-lucide="shopping-cart"></i>
                Add to Cart
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
      const productId = btn.getAttribute('data-product-id');
      window.toast.success('Product added to cart!');
    });
  });

  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
}
