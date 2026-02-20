import { renderPageWithLayout } from '../js/layout.js';
import authManager from '../js/auth.js';
import dataService from '../js/dataService.js';
import languageManager from '../js/language.js';
import { escapeHtml, showConfirm } from '../js/utils.js';

export async function renderAdminProducts() {
  const t = languageManager.t.bind(languageManager);
  
  // Check if user is admin
  const profile = authManager.getUserProfile();
  if (profile?.role !== 'admin') {
    renderPageWithLayout('<div class="error">Access denied. Admin privileges required.</div>', 'admin');
    return;
  }
  
  const content = `
    <div class="admin-products-page">
      <div class="page-header">
        <h1><i data-lucide="package"></i> ${t('nav.products')} Management</h1>
        <p>Manage all products on the platform</p>
        <div style="margin-top: 12px;">
          <button class="btn btn-secondary" id="bulk-edit-nav-btn">
            <i data-lucide="table"></i> Bulk Edit
          </button>
        </div>
      </div>
      
      <div class="admin-controls">
        <div class="search-box">
          <i data-lucide="search"></i>
          <input type="text" id="product-search" placeholder="Search products by name..." />
        </div>
        <div class="filter-controls">
          <select id="category-filter">
            <option value="">All Categories</option>
          </select>
          <select id="seller-filter">
            <option value="">All Sellers</option>
          </select>
          <select id="status-filter">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
      
      <div id="products-loading" class="loading-spinner">
        <i data-lucide="loader"></i> Loading products...
      </div>
      
      <div id="products-container" style="display: none;">
        <!-- Products table will be rendered here -->
      </div>
    </div>
  `;
  
  renderPageWithLayout(content, 'admin');
  if (window.lucide) window.lucide.createIcons();
  
  // Load and display products
  await loadProducts();
  
  // Setup event listeners
  document.getElementById('product-search').addEventListener('input', filterProducts);
  document.getElementById('category-filter').addEventListener('change', filterProducts);
  document.getElementById('seller-filter').addEventListener('change', filterProducts);
  document.getElementById('status-filter').addEventListener('change', filterProducts);
  document.getElementById('bulk-edit-nav-btn').addEventListener('click', () => {
    window.router.navigate('/admin/bulk-edit');
  });
}

let allProducts = [];
let sellers = {};

async function loadProducts() {
  try {
    await dataService.init(); // Initialize dataService before accessing db
    // Load products with high limit
    const products = await dataService.getProducts({ limit: 1000000 });
    allProducts = products;
    
    // Load sellers for filtering
    const sellersSnapshot = await dataService.db.collection('users').where('role', '==', 'seller').get();
    sellers = {};
    sellersSnapshot.docs.forEach(doc => {
      sellers[doc.id] = doc.data().companyName || doc.data().displayName || 'Unknown';
    });
    
    // Populate filters
    populateFilters();
    displayProducts(allProducts);
  } catch (error) {
    console.error('Error loading products:', error);
    document.getElementById('products-loading').innerHTML = '<div class="error">Failed to load products</div>';
  }
}

function populateFilters() {
  // Category filter
  const categories = [...new Set(allProducts.map(p => p.category).filter(Boolean))];
  const categoryFilter = document.getElementById('category-filter');
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });
  
  // Seller filter
  const sellerFilter = document.getElementById('seller-filter');
  Object.entries(sellers).forEach(([id, name]) => {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = name;
    sellerFilter.appendChild(option);
  });
}

function displayProducts(products) {
  const container = document.getElementById('products-container');
  const loading = document.getElementById('products-loading');
  
  loading.style.display = 'none';
  container.style.display = 'block';
  
  if (products.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="package"></i>
        <p>No products found</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }
  
  container.innerHTML = `
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Seller</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${products.map(product => renderProductRow(product)).join('')}
        </tbody>
      </table>
    </div>
  `;
  
  if (window.lucide) window.lucide.createIcons();
  
  // Setup action buttons
  products.forEach(product => {
    const editBtn = document.getElementById(`edit-product-${product.id}`);
    const deleteBtn = document.getElementById(`delete-product-${product.id}`);
    const toggleBtn = document.getElementById(`toggle-product-${product.id}`);
    
    if (editBtn) {
      editBtn.addEventListener('click', () => editProduct(product));
    }
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => deleteProduct(product));
    }
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => toggleProductStatus(product));
    }
  });
}

function renderProductRow(product) {
  const isActive = product.isActive !== false;
  const statusClass = isActive ? 'status-active' : 'status-inactive';
  const statusText = isActive ? 'Active' : 'Inactive';
  const sellerName = sellers[product.sellerId] || 'Unknown';
  
  return `
    <tr>
      <td>
        <div class="product-cell">
          ${product.images && product.images[0] ? 
            `<img src="${product.images[0]}" alt="${escapeHtml(product.name)}" class="product-thumb" />` : 
            '<div class="product-thumb-placeholder"><i data-lucide="image"></i></div>'}
          <span>${escapeHtml(product.name || 'Unnamed Product')}</span>
        </div>
      </td>
      <td>${escapeHtml(product.category || 'N/A')}</td>
      <td>${escapeHtml(sellerName)}</td>
      <td>$${(product.pricePerUnit || 0).toFixed(2)}</td>
      <td>${product.stockQuantity || 0} ${escapeHtml(product.unit || 'units')}</td>
      <td><span class="status-badge ${statusClass}">${statusText}</span></td>
      <td class="actions">
        <button class="btn-icon" id="edit-product-${product.id}" title="Edit Product">
          <i data-lucide="edit"></i>
        </button>
        <button class="btn-icon" id="toggle-product-${product.id}" title="${isActive ? 'Deactivate' : 'Activate'} Product">
          <i data-lucide="${isActive ? 'eye-off' : 'eye'}"></i>
        </button>
        <button class="btn-icon btn-danger" id="delete-product-${product.id}" title="Delete Product">
          <i data-lucide="trash-2"></i>
        </button>
      </td>
    </tr>
  `;
}

function filterProducts() {
  const searchTerm = document.getElementById('product-search').value.toLowerCase();
  const categoryFilter = document.getElementById('category-filter').value;
  const sellerFilter = document.getElementById('seller-filter').value;
  const statusFilter = document.getElementById('status-filter').value;
  
  let filtered = allProducts;
  
  // Search filter
  if (searchTerm) {
    filtered = filtered.filter(product => 
      (product.name && product.name.toLowerCase().includes(searchTerm)) ||
      (product.description && product.description.toLowerCase().includes(searchTerm))
    );
  }
  
  // Category filter
  if (categoryFilter) {
    filtered = filtered.filter(product => product.category === categoryFilter);
  }
  
  // Seller filter
  if (sellerFilter) {
    filtered = filtered.filter(product => product.sellerId === sellerFilter);
  }
  
  // Status filter
  if (statusFilter) {
    const isActive = statusFilter === 'active';
    filtered = filtered.filter(product => (product.isActive !== false) === isActive);
  }
  
  displayProducts(filtered);
}

async function editProduct(product) {
  const t = languageManager.t.bind(languageManager);
  
  // Get categories for dropdown
  const categories = Object.keys(allProducts.reduce((acc, p) => {
    if (p.category) acc[p.category] = true;
    return acc;
  }, {})).sort();
  
  // Create modal
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 700px;">
      <div class="modal-header">
        <h2><i data-lucide="edit"></i> ${t('admin.editProduct')}</h2>
        <button class="modal-close" id="close-edit-modal">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="modal-body">
        <form id="edit-product-form">
          <div class="form-group">
            <label for="edit-product-name">${t('product.name')}</label>
            <input type="text" id="edit-product-name" value="${escapeHtml(product.name || '')}" required />
          </div>
          <div class="form-group">
            <label for="edit-product-category">${t('product.category')}</label>
            <input type="text" id="edit-product-category" value="${escapeHtml(product.category || '')}" list="category-list" required />
            <datalist id="category-list">
              ${categories.map(cat => `<option value="${escapeHtml(cat)}">`).join('')}
            </datalist>
          </div>
          <div class="form-group">
            <label for="edit-product-description">${t('product.description')}</label>
            <textarea id="edit-product-description" rows="3">${escapeHtml(product.description || '')}</textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="edit-product-price">${t('product.price')}</label>
              <input type="number" id="edit-product-price" value="${product.pricePerUnit || 0}" step="0.01" min="0" required />
            </div>
            <div class="form-group">
              <label for="edit-product-stock">${t('product.stock')}</label>
              <input type="number" id="edit-product-stock" value="${product.stockQuantity || 0}" min="0" required />
            </div>
            <div class="form-group">
              <label for="edit-product-unit">${t('product.unit')}</label>
              <input type="text" id="edit-product-unit" value="${escapeHtml(product.unit || 'units')}" required />
            </div>
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" id="edit-product-isActive" ${product.isActive !== false ? 'checked' : ''} />
              ${t('admin.activeStatus')}
            </label>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="cancel-edit-product">${t('common.cancel')}</button>
        <button class="btn btn-primary" id="save-edit-product">${t('common.save')}</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  if (window.lucide) window.lucide.createIcons();
  
  // Modal event listeners
  const closeModal = () => {
    modal.remove();
  };
  
  document.getElementById('close-edit-modal').addEventListener('click', closeModal);
  document.getElementById('cancel-edit-product').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  
  // Save button handler
  document.getElementById('save-edit-product').addEventListener('click', async () => {
    const priceValue = parseFloat(document.getElementById('edit-product-price').value);
    const stockValue = parseInt(document.getElementById('edit-product-stock').value);
    
    // Validate numeric inputs
    if (isNaN(priceValue) || priceValue < 0) {
      window.toast.error(t('admin.invalidPrice'));
      return;
    }
    if (isNaN(stockValue) || stockValue < 0) {
      window.toast.error(t('admin.invalidStock'));
      return;
    }
    
    const updatedData = {
      name: document.getElementById('edit-product-name').value,
      category: document.getElementById('edit-product-category').value,
      description: document.getElementById('edit-product-description').value,
      pricePerUnit: priceValue,
      stockQuantity: stockValue,
      unit: document.getElementById('edit-product-unit').value,
      isActive: document.getElementById('edit-product-isActive').checked
    };

    if (!await showConfirm(`Are you sure you want to save changes for product "${product.name}"?`)) {
      return;
    }
    
    try {
      await dataService.db.collection('products').doc(product.id).update(updatedData);
      window.toast.success(t('admin.productUpdated'));
      closeModal();
      await loadProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      window.toast.error(t('admin.productUpdateFailed'));
    }
  });
}

async function deleteProduct(product) {
  if (!await showConfirm(`Are you sure you want to delete product "${product.name}"?`)) {
    return;
  }
  
  const t = languageManager.t.bind(languageManager);
  try {
    await dataService.db.collection('products').doc(product.id).delete();
    window.toast.success(t('admin.productDeleted'));
    await loadProducts();
  } catch (error) {
    console.error('Error deleting product:', error);
    window.toast.error(t('admin.productDeleteFailed'));
  }
}

async function toggleProductStatus(product) {
  const newStatus = !(product.isActive !== false);
  const t = languageManager.t.bind(languageManager);
  const action = newStatus ? 'activate' : 'deactivate';
  if (!await showConfirm(`Are you sure you want to ${action} product "${product.name}"?`)) {
    return;
  }
  try {
    await dataService.db.collection('products').doc(product.id).update({
      isActive: newStatus
    });
    window.toast.success(t(newStatus ? 'admin.productActivated' : 'admin.productDeactivated'));
    await loadProducts();
  } catch (error) {
    console.error('Error updating product status:', error);
    window.toast.error(t('admin.productStatusUpdateFailed'));
  }
}
