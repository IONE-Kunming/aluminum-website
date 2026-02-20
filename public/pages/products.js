import { renderPageWithLayout } from '../js/layout.js';
import authManager from '../js/auth.js';
import languageManager from '../js/language.js';
import dataService from '../js/dataService.js';
import { escapeHtml, showConfirm } from '../js/utils.js';
import { 
  getSubcategories, 
  getMainCategories,
  getMainCategoryForSubcategory,
  isMainCategory,
  isSubcategory
} from '../js/categoryHierarchy.js';

// Constants for dropdown placeholders
const PLACEHOLDER_MAIN_CATEGORY = 'Select main category';
const PLACEHOLDER_SUBCATEGORY = 'Select subcategory';

export async function renderProducts() {
  const t = languageManager.t.bind(languageManager);
  
  const content = `
    <div class="products-page">
      <div class="page-header">
        <h1>${t('products.title')}</h1>
        <p>${t('products.viewAllProducts')}</p>
        <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
          <button class="btn btn-primary" id="add-product-btn">
            <i data-lucide="plus"></i>
            ${t('products.addProduct')}
          </button>
          <button class="btn btn-secondary" id="bulk-import-btn">
            <i data-lucide="upload"></i>
            ${t('products.bulkImport')}
          </button>
          <button class="btn btn-secondary" id="bulk-edit-btn">
            <i data-lucide="layers"></i>
            Bulk Edit
          </button>
          <div id="bulk-actions-container" style="display: none; margin-left: auto; gap: 12px; align-items: center;">
            <span id="selected-count" style="font-size: 14px; color: #6b7280;">0 selected</span>
            <button class="btn btn-danger" id="bulk-delete-btn">
              <i data-lucide="trash-2"></i>
              Delete Selected
            </button>
            <button class="btn btn-text" id="cancel-selection-btn">Cancel</button>
          </div>
        </div>
      </div>

      <!-- Add Product Modal -->
      <div id="add-product-modal" class="modal" style="display: none;">
        <div class="modal-content" style="max-width: 600px;">
          <div class="modal-header">
            <h2>${t('products.addProduct')}</h2>
            <button class="modal-close" id="close-add-modal-btn">
              <i data-lucide="x"></i>
            </button>
          </div>
          <div class="modal-body">
            <form id="add-product-form">
              <div class="form-group">
                <label for="add-model-number">${t('products.modelNumber')} *</label>
                <input type="text" id="add-model-number" class="form-control" required />
              </div>
              
              <div class="form-group">
                <label for="add-category">${t('products.category')} *</label>
                <input type="text" id="add-category" class="form-control" required />
              </div>
              
              <div class="form-group">
                <label for="add-price">${t('products.pricePerMeter')} *</label>
                <input type="number" id="add-price" class="form-control" step="0.01" min="0" required />
              </div>
              
              <div class="form-group">
                <label for="add-stock">${t('products.stock')}</label>
                <input type="number" id="add-stock" class="form-control" min="0" value="0" />
              </div>
              
              <div class="form-group">
                <label for="add-description">${t('products.description')}</label>
                <textarea id="add-description" class="form-control" rows="3"></textarea>
              </div>
              
              <div class="form-group">
                <label for="add-image">${t('products.imagePath')}</label>
                <input type="file" id="add-image" class="form-control" accept="image/*" />
                <small style="color: #6b7280; font-size: 12px;">Optional: Upload product image</small>
              </div>
              
              <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;">
                <button type="button" class="btn btn-secondary" id="cancel-add-btn">${t('common.cancel')}</button>
                <button type="submit" class="btn btn-primary" id="submit-add-btn">
                  <i data-lucide="plus"></i>
                  ${t('products.addProduct')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Edit Product Modal -->
      <div id="edit-product-modal" class="modal" style="display: none;">
        <div class="modal-content" style="max-width: 600px;">
          <div class="modal-header">
            <h2>Edit Product</h2>
            <button class="modal-close" id="close-edit-modal-btn">
              <i data-lucide="x"></i>
            </button>
          </div>
          <div class="modal-body">
            <form id="edit-product-form">
              <input type="hidden" id="edit-product-id" />
              
              <div class="form-group">
                <label for="edit-model-number">${t('products.modelNumber')} *</label>
                <input type="text" id="edit-model-number" class="form-control" required />
              </div>
              
              <div class="form-group">
                <label for="edit-main-category">${t('products.mainCategory')} *</label>
                <select id="edit-main-category" class="form-control" required>
                  <option value="">${PLACEHOLDER_MAIN_CATEGORY}</option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="edit-subcategory">${t('products.subcategory')} *</label>
                <select id="edit-subcategory" class="form-control" required>
                  <option value="">${PLACEHOLDER_SUBCATEGORY}</option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="edit-price">${t('products.pricePerMeter')} *</label>
                <input type="number" id="edit-price" class="form-control" step="0.01" min="0" required />
              </div>
              
              <div class="form-group">
                <label for="edit-stock">${t('products.stock')}</label>
                <select id="edit-stock" class="form-control">
                  <option value="available">${t('products.available') || 'Available'}</option>
                  <option value="unavailable">${t('products.unavailable') || 'Out of Stock'}</option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="edit-description">${t('products.description')}</label>
                <textarea id="edit-description" class="form-control" rows="3"></textarea>
              </div>
              
              <div class="form-group">
                <label for="edit-image">${t('products.imagePath')}</label>
                <input type="file" id="edit-image" class="form-control" accept="image/*" />
                <small style="color: #6b7280; font-size: 12px;">Optional: Upload new product image (leave empty to keep current image)</small>
              </div>
              
              <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;">
                <button type="button" class="btn btn-secondary" id="cancel-edit-btn">${t('common.cancel')}</button>
                <button type="submit" class="btn btn-primary" id="submit-edit-btn">
                  <i data-lucide="save"></i>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Bulk Import Modal -->
      <div id="bulk-import-modal" class="modal" style="display: none;">
        <div class="modal-content">
          <div class="modal-header">
            <h2>${t('products.bulkImport')} ${t('products.title')}</h2>
            <button class="modal-close" id="close-modal-btn">
              <i data-lucide="x"></i>
            </button>
          </div>
          <div class="modal-body">
            <p class="import-instructions">
              ${t('products.importInstructions')}
            </p>
            
            <div style="margin-bottom: 16px;">
              <a href="${(import.meta.env.BASE_URL || '/') + 'sample-products-import.csv'}" download="sample-products-import.csv" class="btn btn-secondary" style="text-decoration: none; display: inline-flex; align-items: center; gap: 8px;">
                <i data-lucide="download"></i>
                ${t('products.downloadTemplate')}
              </a>
            </div>
            
            <div class="file-upload-area" id="file-upload-area">
              <i data-lucide="file-spreadsheet" style="width: 48px; height: 48px; opacity: 0.5;"></i>
              <p>${t('products.selectFile')}</p>
              <input type="file" id="excel-file-input" accept=".xlsx,.xls" style="display: none;" />
            </div>
            
            <div id="file-info" style="display: none; margin-top: 16px;">
              <p><strong>Selected file:</strong> <span id="file-name"></span></p>
              <p><strong>Rows to import:</strong> <span id="row-count">0</span></p>
            </div>
            
            <div id="image-upload-area" style="display: none; margin-top: 16px;">
              <label for="images-input" class="form-label">
                <i data-lucide="image"></i>
                Upload Product Images and Videos (Multiple files supported)
              </label>
              <input type="file" id="images-input" accept="image/*,video/*" multiple class="form-control" />
              <p class="help-text">Upload all images and videos referenced in your Excel file. Supported: All common image and video formats</p>
            </div>
            
            <div id="import-progress" style="display: none; margin-top: 16px;">
              <div class="progress-bar">
                <div class="progress-fill" id="progress-fill"></div>
              </div>
              <p id="progress-text">Importing products...</p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="cancel-import-btn">Cancel</button>
            <button class="btn btn-primary" id="start-import-btn" disabled>Import Products</button>
          </div>
        </div>
      </div>

      <!-- Bulk Edit Modal -->
      <div id="bulk-edit-modal" class="modal" style="display: none;">
        <div class="modal-content" style="max-width: 550px;">
          <div class="modal-header">
            <h2><i data-lucide="layers"></i> Bulk Edit Products</h2>
            <button class="modal-close" id="close-bulk-edit-modal"><i data-lucide="x"></i></button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Main Category *</label>
              <select id="bulk-main-category" class="form-control">
                <option value="">Select main category</option>
              </select>
            </div>
            <div class="form-group">
              <label>Subcategory</label>
              <select id="bulk-subcategory" class="form-control" disabled>
                <option value="">All subcategories</option>
              </select>
            </div>
            <div id="bulk-product-count" style="margin-bottom: 16px; font-size: 14px; color: var(--text-secondary);"></div>
            <hr style="border-color: var(--border-color); margin: 16px 0;" />
            <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">Leave fields empty to keep existing values unchanged:</p>
            <div class="form-group">
              <label>New Price (per meter)</label>
              <input type="number" id="bulk-price" class="form-control" placeholder="Leave empty to keep current" step="0.01" min="0" />
            </div>
            <div class="form-group">
              <label>Stock Status</label>
              <select id="bulk-stock" class="form-control">
                <option value="">No change</option>
                <option value="available">Available</option>
                <option value="unavailable">Out of Stock</option>
              </select>
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea id="bulk-description" class="form-control" rows="3" placeholder="Leave empty to keep current"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="cancel-bulk-edit">Cancel</button>
            <button class="btn btn-primary" id="submit-bulk-edit">
              <i data-lucide="layers"></i> Apply to All Matching Products
            </button>
          </div>
        </div>
      </div>

      <!-- Products Loading State -->
      <div id="products-loading" style="display: flex; justify-content: center; padding: 40px;">
        <div class="spinner"></div>
        <p style="margin-left: 12px;">Loading products...</p>
      </div>

      <!-- Products Grid -->
      <div id="products-grid" style="display: none;">
        <!-- Products will be loaded here -->
      </div>

      <!-- Empty State -->
      <div id="empty-state" class="empty-state" style="display: none;">
        <i data-lucide="package" style="width: 64px; height: 64px; opacity: 0.3;"></i>
        <h2>No products yet</h2>
        <p>Start by adding your first product or use bulk import</p>
      </div>
    </div>
  `;

  renderPageWithLayout(content, 'seller');
  if (window.lucide) window.lucide.createIcons();
  
  // Load and display products
  await loadProducts();
  
  // Initialize add product functionality
  initializeAddProduct();
  
  // Initialize edit product functionality
  initializeEditProduct();
  
  // Initialize bulk import functionality
  initializeBulkImport();

  // Initialize bulk edit functionality
  initializeBulkEdit();
}

// Load products from Firestore
let allProducts = []; // Store all products globally for filtering

async function loadProducts() {
  const loadingEl = document.getElementById('products-loading');
  const gridEl = document.getElementById('products-grid');
  const emptyStateEl = document.getElementById('empty-state');
  
  try {
    const user = authManager.getCurrentUser();
    if (!user) {
      console.error('No user logged in');
      showEmptyState();
      return;
    }

    // Fetch only this seller's products
    allProducts = await dataService.getProducts({ sellerId: user.uid, limit: 2000 });
    
    if (loadingEl) loadingEl.style.display = 'none';
    
    if (allProducts.length === 0) {
      showEmptyState();
    } else {
      displayProducts(allProducts);
    }
  } catch (error) {
    console.error('Error loading products:', error);
    if (loadingEl) loadingEl.style.display = 'none';
    showEmptyState();
    if (window.toast) {
      window.toast.error('Failed to load products');
    }
  }
}

// Show empty state
function showEmptyState() {
  const loadingEl = document.getElementById('products-loading');
  const gridEl = document.getElementById('products-grid');
  const emptyStateEl = document.getElementById('empty-state');
  
  if (loadingEl) loadingEl.style.display = 'none';
  if (gridEl) gridEl.style.display = 'none';
  if (emptyStateEl) {
    emptyStateEl.style.display = 'flex';
    if (window.lucide) window.lucide.createIcons();
  }
}

// Display products in grid
let selectedSubcategory = null; // Track selected subcategory filter

function displayProducts(products, filterSubcategory = null) {
  const t = languageManager.t.bind(languageManager);
  const gridEl = document.getElementById('products-grid');
  const emptyStateEl = document.getElementById('empty-state');
  
  if (!gridEl) return;
  
  if (emptyStateEl) emptyStateEl.style.display = 'none';
  gridEl.style.display = 'grid';
  
  // Get unique subcategories from all products
  // Note: Product subcategories are stored in the 'category' field
  const subcategories = [...new Set(allProducts.map(p => p.category).filter(Boolean))].sort();
  
  // Filter products if a subcategory is selected
  const displayedProducts = filterSubcategory 
    ? products.filter(p => p.category === filterSubcategory)
    : products;
  
  gridEl.innerHTML = `
    <div style="margin-bottom: 16px; display: flex; align-items: center; gap: 12px;">
      <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; user-select: none;">
        <input type="checkbox" id="select-all-checkbox" style="width: 18px; height: 18px; cursor: pointer;" />
        <span style="font-size: 14px; font-weight: 500; color: #374151;">Select All</span>
      </label>
    </div>
    
    ${subcategories.length > 0 ? `
      <div class="category-chips-section">
        <p class="category-chips-title">
          ${t('products.filterBySubcategory')}
        </p>
        <div class="category-chips">
          ${subcategories.map(subcat => {
            const isSelected = filterSubcategory === subcat;
            return `
              <button 
                class="category-chip${isSelected ? ' active' : ''}" 
                data-subcategory="${escapeHtml(subcat)}"
              >
                <span class="chip-dot"></span>
                <span>${escapeHtml(subcat)}</span>
              </button>
            `;
          }).join('')}
        </div>
      </div>
    ` : ''}
    
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; padding: 20px 0;">
      ${displayedProducts.map(product => `
        <div class="product-card" data-product-id="${product.id}" style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; background: white; position: relative; display: flex; flex-direction: column;">
          <div style="position: absolute; top: 12px; right: 12px; z-index: 10;">
            <input type="checkbox" class="product-checkbox" data-id="${product.id}" style="width: 20px; height: 20px; cursor: pointer;" />
          </div>
          ${product.imageUrl ? `
            <img src="${product.imageUrl}" 
                 alt="${escapeHtml(product.modelNumber || 'Product')}" 
                 loading="lazy"
                 onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='flex';"
                 style="width: 100%; height: 180px; object-fit: cover; border-radius: 4px; margin-bottom: 12px;" />
            <div style="width: 100%; height: 180px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 4px; margin-bottom: 12px; display: none; align-items: center; justify-content: center; flex-direction: column; color: white;">
              <i data-lucide="image-off" style="width: 48px; height: 48px; opacity: 0.8; margin-bottom: 8px;"></i>
              <span style="font-size: 12px; opacity: 0.8;">Image not available</span>
            </div>
          ` : `
            <div style="width: 100%; height: 180px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 4px; margin-bottom: 12px; display: flex; align-items: center; justify-content: center; flex-direction: column; color: white;">
              <i data-lucide="package" style="width: 48px; height: 48px; opacity: 0.8; margin-bottom: 8px;"></i>
              <span style="font-size: 12px; opacity: 0.8;">No image</span>
            </div>
          `}
          <h3 style="font-size: 16px; font-weight: 600; margin: 0 0 8px 0; color: #111827; word-wrap: break-word; overflow-wrap: break-word;">
            ${escapeHtml(product.modelNumber || 'Unnamed Product')}
          </h3>
          <p style="font-size: 14px; color: #6b7280; margin: 0 0 8px 0; word-wrap: break-word; overflow-wrap: break-word;">
            ${escapeHtml(product.category || 'No category')}
          </p>
          <p style="font-size: 18px; font-weight: 700; color: #047857; margin: 0 0 12px 0;">
            $${product.pricePerMeter ? product.pricePerMeter.toFixed(2) : '0.00'}/m
          </p>
          ${product.description ? `
            <p style="font-size: 14px; color: #6b7280; margin: 0 0 12px 0; line-height: 1.5; word-wrap: break-word; overflow-wrap: break-word; flex-grow: 1;">
              ${escapeHtml(product.description.substring(0, 100))}${product.description.length > 100 ? '...' : ''}
            </p>
          ` : '<div style="flex-grow: 1;"></div>'}
          <div style="display: flex; gap: 8px; margin-top: auto;">
            <button class="btn btn-sm btn-secondary edit-product-btn" data-id="${product.id}" style="flex: 1; font-size: 14px; padding: 6px 12px;">
              <i data-lucide="edit-2" style="width: 14px; height: 14px;"></i>
              Edit
            </button>
            <button class="btn btn-sm btn-danger delete-product-btn" data-id="${product.id}" style="flex: 1; font-size: 14px; padding: 6px 12px;">
              <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
              Delete
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  
  if (window.lucide) window.lucide.createIcons();
  
  // Initialize bulk selection
  initializeBulkSelection();
  
  // Initialize subcategory filter buttons
  initializeSubcategoryFilter();
  
  // Add event listeners for edit and delete buttons
  document.querySelectorAll('.edit-product-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const productId = e.currentTarget.getAttribute('data-id');
      editProduct(productId);
    });
  });
  
  document.querySelectorAll('.delete-product-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const productId = e.currentTarget.getAttribute('data-id');
      deleteProduct(productId);
    });
  });
}

// Edit product
async function editProduct(productId) {
  try {
    // Get product details
    const product = await dataService.getProductById(productId);
    
    if (!product) {
      if (window.toast) {
        window.toast.error('Product not found');
      }
      return;
    }
    
    // Populate main category dropdown
    const mainCategorySelect = document.getElementById('edit-main-category');
    const subcategorySelect = document.getElementById('edit-subcategory');
    
    // Clear existing options
    mainCategorySelect.innerHTML = `<option value="">${PLACEHOLDER_MAIN_CATEGORY}</option>`;
    subcategorySelect.innerHTML = `<option value="">${PLACEHOLDER_SUBCATEGORY}</option>`;
    
    // Add main categories
    const mainCategories = getMainCategories();
    mainCategories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = cat;
      mainCategorySelect.appendChild(option);
    });
    
    // Determine the current category structure
    let currentMainCategory = '';
    let currentSubcategory = '';
    
    if (product.category) {
      if (isMainCategory(product.category)) {
        currentMainCategory = product.category;
      } else if (isSubcategory(product.category)) {
        currentSubcategory = product.category;
        currentMainCategory = getMainCategoryForSubcategory(product.category);
      } else {
        // If category doesn't match hierarchy, default to first main category
        currentMainCategory = mainCategories.length > 0 ? mainCategories[0] : '';
        currentSubcategory = product.category;
      }
    }
    
    // Set main category and populate subcategories
    if (currentMainCategory) {
      mainCategorySelect.value = currentMainCategory;
      const subcategories = getSubcategories(currentMainCategory);
      subcategories.forEach(subcat => {
        const option = document.createElement('option');
        option.value = subcat;
        option.textContent = subcat;
        subcategorySelect.appendChild(option);
      });
      
      if (currentSubcategory) {
        subcategorySelect.value = currentSubcategory;
      }
    }
    
    // Open edit modal and populate with product data
    const modal = document.getElementById('edit-product-modal');
    document.getElementById('edit-product-id').value = productId;
    document.getElementById('edit-model-number').value = product.modelNumber || '';
    document.getElementById('edit-price').value = product.pricePerMeter || product.price || '';
    
    // Set stock dropdown value based on product stock
    // If stock is a string (available/unavailable), use it directly
    // Otherwise, convert number to available/unavailable (legacy compatibility)
    let stockValue = 'available';
    if (typeof product.stock === 'string') {
      stockValue = product.stock;
    } else if (typeof product.stock === 'number') {
      stockValue = product.stock > 0 ? 'available' : 'unavailable';
    }
    document.getElementById('edit-stock').value = stockValue;
    
    document.getElementById('edit-description').value = product.description || '';
    
    modal.style.display = 'flex';
    if (window.lucide) window.lucide.createIcons();
    
  } catch (error) {
    console.error('Error loading product for edit:', error);
    if (window.toast) {
      window.toast.error('Failed to load product details');
    }
  }
}

// Delete product
async function deleteProduct(productId) {
  if (!await showConfirm('Are you sure you want to delete this product?')) {
    return;
  }
  
  try {
    await dataService.deleteProduct(productId);
    
    if (window.toast) {
      window.toast.success('Product deleted successfully');
    }
    
    // Reload products
    await loadProducts();
  } catch (error) {
    console.error('Error deleting product:', error);
    if (window.toast) {
      window.toast.error('Failed to delete product');
    }
  }
}

// Initialize Add Product functionality
function initializeAddProduct() {
  const addProductBtn = document.getElementById('add-product-btn');
  const modal = document.getElementById('add-product-modal');
  const closeModalBtn = document.getElementById('close-add-modal-btn');
  const cancelBtn = document.getElementById('cancel-add-btn');
  const form = document.getElementById('add-product-form');
  const submitBtn = document.getElementById('submit-add-btn');
  
  const closeModal = () => {
    modal.style.display = 'none';
    form.reset();
  };
  
  // Open modal
  if (addProductBtn) {
    addProductBtn.addEventListener('click', () => {
      modal.style.display = 'flex';
      if (window.lucide) window.lucide.createIcons();
    });
  }
  
  // Close modal
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
  }
  
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeModal);
  }
  
  // Handle form submission
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const modelNumber = document.getElementById('add-model-number').value.trim();
      const category = document.getElementById('add-category').value.trim();
      const pricePerMeter = parseFloat(document.getElementById('add-price').value);
      const stock = parseInt(document.getElementById('add-stock').value) || 0;
      const description = document.getElementById('add-description').value.trim();
      const imageFile = document.getElementById('add-image').files[0];
      
      if (!modelNumber || !category || !pricePerMeter || pricePerMeter <= 0) {
        if (window.toast) {
          window.toast.error('Please fill in all required fields with valid values');
        }
        return;
      }
      
      try {
        // Disable submit button
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i data-lucide="loader"></i> Adding...';
        if (window.lucide) window.lucide.createIcons();
        
        let imageUrl = '';
        
        // Upload image if provided
        if (imageFile) {
          const storage = firebase.storage();
          const user = authManager.getCurrentUser();
          const imageRef = storage.ref(`products/${user.uid}/${Date.now()}_${imageFile.name}`);
          await imageRef.put(imageFile);
          imageUrl = await imageRef.getDownloadURL();
        }
        
        // Add product to database
        const productData = {
          modelNumber,
          category,
          pricePerMeter,
          stock,
          description,
          imageUrl
        };
        
        await dataService.addProduct(productData);
        
        if (window.toast) {
          window.toast.success('Product added successfully!');
        }
        
        // Close modal and reload products
        closeModal();
        await loadProducts();
      } catch (error) {
        console.error('Error adding product:', error);
        if (window.toast) {
          window.toast.error('Failed to add product: ' + error.message);
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i data-lucide="plus"></i> Add Product';
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }
}

// Initialize Edit Product functionality
function initializeEditProduct() {
  const modal = document.getElementById('edit-product-modal');
  const closeModalBtn = document.getElementById('close-edit-modal-btn');
  const cancelBtn = document.getElementById('cancel-edit-btn');
  const form = document.getElementById('edit-product-form');
  const submitBtn = document.getElementById('submit-edit-btn');
  const mainCategorySelect = document.getElementById('edit-main-category');
  const subcategorySelect = document.getElementById('edit-subcategory');
  
  const closeModal = () => {
    modal.style.display = 'none';
    form.reset();
  };
  
  // Close modal
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
  }
  
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeModal);
  }
  
  // Handle main category change - update subcategories
  if (mainCategorySelect) {
    mainCategorySelect.addEventListener('change', (e) => {
      const selectedMainCategory = e.target.value;
      subcategorySelect.innerHTML = `<option value="">${PLACEHOLDER_SUBCATEGORY}</option>`;
      
      if (selectedMainCategory) {
        const subcategories = getSubcategories(selectedMainCategory);
        subcategories.forEach(subcat => {
          const option = document.createElement('option');
          option.value = subcat;
          option.textContent = subcat;
          subcategorySelect.appendChild(option);
        });
      }
    });
  }
  
  // Handle form submission
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const productId = document.getElementById('edit-product-id').value;
      const modelNumber = document.getElementById('edit-model-number').value.trim();
      const subcategory = document.getElementById('edit-subcategory').value.trim();
      const pricePerMeter = parseFloat(document.getElementById('edit-price').value);
      const stock = document.getElementById('edit-stock').value; // Get string value: 'available' or 'unavailable'
      const description = document.getElementById('edit-description').value.trim();
      const imageFile = document.getElementById('edit-image').files[0];
      
      if (!modelNumber || !subcategory || !pricePerMeter || pricePerMeter <= 0) {
        if (window.toast) {
          window.toast.error('Please fill in all required fields with valid values');
        }
        return;
      }

      if (!await showConfirm(`Are you sure you want to save changes for product "${modelNumber}"?`)) {
        return;
      }
      
      try {
        // Disable submit button
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i data-lucide="loader"></i> Saving...';
        if (window.lucide) window.lucide.createIcons();
        
        // Get current product to preserve existing imageUrl if no new image
        const currentProduct = await dataService.getProductById(productId);
        let imageUrl = currentProduct.imageUrl || '';
        
        // Upload new image if provided
        if (imageFile) {
          const storage = firebase.storage();
          const user = authManager.getCurrentUser();
          const imageRef = storage.ref(`products/${user.uid}/${Date.now()}_${imageFile.name}`);
          await imageRef.put(imageFile);
          imageUrl = await imageRef.getDownloadURL();
        }
        
        // Update product in database
        const productData = {
          modelNumber,
          category: subcategory,
          pricePerMeter,
          stock,
          description,
          imageUrl
        };
        
        await dataService.updateProduct(productId, productData);
        
        if (window.toast) {
          window.toast.success('Product updated successfully!');
        }
        
        // Close modal and reload products
        closeModal();
        await loadProducts();
      } catch (error) {
        console.error('Error updating product:', error);
        if (window.toast) {
          window.toast.error('Failed to update product: ' + error.message);
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i data-lucide="save"></i> Save Changes';
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }
}

function initializeBulkImport() {
  const bulkImportBtn = document.getElementById('bulk-import-btn');
  const modal = document.getElementById('bulk-import-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const cancelImportBtn = document.getElementById('cancel-import-btn');
  const fileUploadArea = document.getElementById('file-upload-area');
  const excelFileInput = document.getElementById('excel-file-input');
  const startImportBtn = document.getElementById('start-import-btn');
  
  let excelData = null;
  let uploadedImages = {};
  
  // Load SheetJS library dynamically
  const loadSheetJS = () => {
    return new Promise((resolve, reject) => {
      if (window.XLSX) {
        resolve(window.XLSX);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js';
      script.onload = () => resolve(window.XLSX);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };
  
  bulkImportBtn.addEventListener('click', () => {
    modal.style.display = 'flex';
    if (window.lucide) window.lucide.createIcons();
  });
  
  closeModalBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });
  
  cancelImportBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });
  
  fileUploadArea.addEventListener('click', () => {
    excelFileInput.click();
  });
  
  excelFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const XLSX = await loadSheetJS();
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);
      
      excelData = jsonData;
      
      document.getElementById('file-name').textContent = file.name;
      document.getElementById('row-count').textContent = jsonData.length;
      document.getElementById('file-info').style.display = 'block';
      document.getElementById('image-upload-area').style.display = 'block';
      startImportBtn.disabled = false;
      
      if (window.lucide) window.lucide.createIcons();
    } catch (error) {
      console.error('Error reading Excel file:', error);
      alert('Error reading Excel file. Please make sure it is a valid .xlsx file.');
    }
  });
  
  const imagesInput = document.getElementById('images-input');
  imagesInput.addEventListener('change', (e) => {
    const files = e.target.files;
    uploadedImages = {};
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      uploadedImages[file.name] = file;
    }
  });
  
  startImportBtn.addEventListener('click', async () => {
    if (!excelData || excelData.length === 0) {
      alert('No data to import');
      return;
    }
    
    const profile = authManager.getUserProfile();
    if (!profile) {
      alert('You must be logged in to import products');
      return;
    }
    
    // Get Firebase instances at the start
    const db = firebase.firestore();
    const storage = firebase.storage();
    
    // Validate data before importing
    const validationErrors = [];
    const seenModelNumbers = new Set();
    const duplicatesInFile = [];
    
    excelData.forEach((row, index) => {
      const rowNum = index + 2; // +2 because Excel starts at 1 and has header row
      const modelNumber = row['Model Number'] || row['model_number'] || row['ModelNumber'];
      const pricePerMeter = row['Price per Meter'] || row['price_per_meter'] || row['PricePerMeter'];
      const category = row['Category'] || row['category'];
      const subcategory = row['Subcategory'] || row['subcategory'] || row['SubCategory'];
      
      // Check for required fields
      if (!modelNumber) {
        validationErrors.push(`Row ${rowNum}: Model Number is required`);
      }
      
      // Check for category and subcategory - both are required
      if (!category || category.trim() === '') {
        validationErrors.push(`Row ${rowNum}: Category is required`);
      }
      
      if (!subcategory || subcategory.trim() === '') {
        validationErrors.push(`Row ${rowNum}: Subcategory is required`);
      }
      
      // Validate category hierarchy
      if (category && subcategory) {
        const trimmedCategory = category.trim();
        const trimmedSubcategory = subcategory.trim();
        
        // Check if category is a valid main category
        if (!isMainCategory(trimmedCategory)) {
          validationErrors.push(`Row ${rowNum}: Invalid category "${trimmedCategory}". Please refer to the sample template for valid categories.`);
        } else {
          // Check if subcategory is valid for this main category
          const validSubcategories = getSubcategories(trimmedCategory);
          if (!validSubcategories.includes(trimmedSubcategory)) {
            // Show only first 5 subcategories to keep error message readable
            const subcatList = validSubcategories.slice(0, 5).join(', ');
            const moreCount = validSubcategories.length - 5;
            const subcatDisplay = validSubcategories.length > 5 
              ? `${subcatList} (and ${moreCount} more)` 
              : subcatList;
            validationErrors.push(`Row ${rowNum}: Invalid subcategory "${trimmedSubcategory}" for category "${trimmedCategory}". Valid options include: ${subcatDisplay}. See sample template for full list.`);
          }
        }
      }
      
      // Check for duplicate model numbers in file
      if (modelNumber) {
        if (seenModelNumbers.has(modelNumber)) {
          duplicatesInFile.push(`Row ${rowNum}: Duplicate Model Number "${modelNumber}"`);
        } else {
          seenModelNumbers.add(modelNumber);
        }
      }
      
      // Validate price
      if (pricePerMeter !== undefined && pricePerMeter !== null && pricePerMeter !== '') {
        const price = parseFloat(pricePerMeter);
        if (isNaN(price)) {
          validationErrors.push(`Row ${rowNum}: Invalid price "${pricePerMeter}" - must be a number`);
        } else if (price <= 0) {
          validationErrors.push(`Row ${rowNum}: Invalid price "${price}" - must be greater than 0`);
        }
      }
    });
    
    // Show validation errors
    if (validationErrors.length > 0) {
      const errorMessage = `Found ${validationErrors.length} validation error(s):\n\n${validationErrors.slice(0, 10).join('\n')}${validationErrors.length > 10 ? `\n... and ${validationErrors.length - 10} more errors` : ''}`;
      alert(errorMessage);
      return;
    }
    
    // Check for duplicates in database
    const existingProducts = await db.collection('products')
      .where('sellerId', '==', profile.uid)
      .get();
    
    const existingModelNumbers = new Set(
      existingProducts.docs.map(doc => doc.data().modelNumber)
    );
    
    const duplicatesInDb = [];
    seenModelNumbers.forEach(modelNumber => {
      if (existingModelNumbers.has(modelNumber)) {
        duplicatesInDb.push(modelNumber);
      }
    });
    
    // Warn about duplicates in file
    if (duplicatesInFile.length > 0) {
      const warningMessage = `Found ${duplicatesInFile.length} duplicate(s) within the file:\n\n${duplicatesInFile.slice(0, 5).join('\n')}${duplicatesInFile.length > 5 ? `\n... and ${duplicatesInFile.length - 5} more` : ''}\n\nPlease remove duplicates from the file and try again.`;
      alert(warningMessage);
      return;
    }
    
    // Warn about duplicates in database and ask for confirmation
    if (duplicatesInDb.length > 0) {
      const dupList = duplicatesInDb.slice(0, 5).join(', ') + (duplicatesInDb.length > 5 ? ` and ${duplicatesInDb.length - 5} more` : '');
      const confirmed = await showConfirm(
        `Warning: ${duplicatesInDb.length} product(s) already exist (${dupList}). Importing will create duplicates. Do you want to continue?`
      );
      
      if (!confirmed) {
        return;
      }
    }
    
    startImportBtn.disabled = true;
    cancelImportBtn.disabled = true;
    document.getElementById('import-progress').style.display = 'block';
    
    try {
      const totalProducts = excelData.length;
      let importedCount = 0;
      let skippedCount = 0;
      
      // Process products in batches for better performance
      const BATCH_SIZE = 10; // Process 10 products at a time
      const batches = [];
      
      for (let i = 0; i < excelData.length; i += BATCH_SIZE) {
        batches.push(excelData.slice(i, i + BATCH_SIZE));
      }
      
      for (const batch of batches) {
        // Process batch items in parallel
        const batchPromises = batch.map(async (row) => {
          try {
            // Map Excel columns to product fields
            const modelNumber = row['Model Number'] || row['model_number'] || row['ModelNumber'];
            const mainCategory = row['Category'] || row['category'];
            const subcategory = row['Subcategory'] || row['subcategory'] || row['SubCategory'];
            const pricePerMeter = row['Price per Meter'] || row['price_per_meter'] || row['PricePerMeter'];
            // Support both legacy 'Image Path' and new multi-media columns
            const imagePaths = [
              row['Image 1'] || row['Image Path'] || row['image_path'] || row['ImagePath'] || '',
              row['Image 2'] || '',
              row['Image 3'] || ''
            ].filter(Boolean);
            const videoPaths = [
              row['Video 1'] || '',
              row['Video 2'] || ''
            ].filter(Boolean);
            
            // Parse and use the validated price
            const price = parseFloat(pricePerMeter);
            
            // Upload all images and collect URLs
            const uploadMedia = async (paths) => {
              const urls = [];
              for (const filePath of paths) {
                const fileName = filePath.split('/').pop().split('\\').pop();
                const file = uploadedImages ? uploadedImages[fileName] : null;
                if (file) {
                  const ref = storage.ref(`products/${profile.uid}/${Date.now()}_${crypto.randomUUID()}_${fileName}`);
                  await ref.put(file);
                  urls.push(await ref.getDownloadURL());
                }
              }
              return urls;
            };

            const imageUrls = await uploadMedia(imagePaths);
            const videoUrls = await uploadMedia(videoPaths);
            
            // Return product data for batch write
            return {
              sellerId: profile.uid,
              sellerName: profile.displayName,
              modelNumber: modelNumber,
              mainCategory: mainCategory,
              category: subcategory, // Store subcategory in 'category' field for backward compatibility
              subcategory: subcategory, // Also store in dedicated subcategory field
              pricePerMeter: price,
              imageUrl: imageUrls[0] || '',
              imageUrls: imageUrls,
              videoUrls: videoUrls,
              createdAt: new Date().toISOString(),
              stock: 0,
              description: ''
            };
          } catch (rowError) {
            console.error('Error processing row:', row, rowError);
            skippedCount++;
            return null;
          }
        });
        
        // Wait for all items in batch to be processed
        const batchResults = await Promise.all(batchPromises);
        
        // Use Firestore batch write for better performance
        const firestoreBatch = db.batch();
        batchResults.forEach(productData => {
          if (productData) {
            const docRef = db.collection('products').doc();
            firestoreBatch.set(docRef, productData);
            importedCount++;
          }
        });
        
        // Commit the batch
        await firestoreBatch.commit();
        
        // Update progress
        const progress = ((importedCount + skippedCount) / totalProducts) * 100;
        document.getElementById('progress-fill').style.width = `${progress}%`;
        document.getElementById('progress-text').textContent = 
          `Importing products... ${importedCount} imported, ${skippedCount} skipped of ${totalProducts}`;
      }
      
      const message = skippedCount > 0 
        ? `Successfully imported ${importedCount} products! ${skippedCount} products were skipped due to errors.`
        : `Successfully imported ${importedCount} products!`;
      alert(message);
      modal.style.display = 'none';
      
      // Reload the page to show new products
      renderProducts();
    } catch (error) {
      console.error('Error during bulk import:', error);
      alert('An error occurred during import. Please try again.');
    } finally {
      startImportBtn.disabled = false;
      cancelImportBtn.disabled = false;
      document.getElementById('import-progress').style.display = 'none';
    }
  });
}

// Initialize subcategory filter functionality
function initializeSubcategoryFilter() {
  const filterButtons = document.querySelectorAll('.category-chip');
  
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const subcategory = btn.getAttribute('data-subcategory');
      
      // If clicking the same subcategory, clear the filter
      if (selectedSubcategory === subcategory) {
        selectedSubcategory = null;
        displayProducts(allProducts, null);
      } else {
        // Set new filter
        selectedSubcategory = subcategory;
        displayProducts(allProducts, subcategory);
      }
    });
  });
}

// Initialize bulk selection functionality
function initializeBulkSelection() {
  const selectAllCheckbox = document.getElementById('select-all-checkbox');
  const bulkActionsContainer = document.getElementById('bulk-actions-container');
  const selectedCountEl = document.getElementById('selected-count');
  const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
  const cancelSelectionBtn = document.getElementById('cancel-selection-btn');
  
  // Track selected products
  let selectedProducts = new Set();
  
  // Get fresh product checkboxes (helper function)
  const getProductCheckboxes = () => document.querySelectorAll('.product-checkbox');
  
  // Update UI based on selection
  function updateSelectionUI() {
    const productCheckboxes = getProductCheckboxes();
    const count = selectedProducts.size;
    selectedCountEl.textContent = `${count} selected`;
    
    if (count > 0) {
      bulkActionsContainer.style.display = 'flex';
    } else {
      bulkActionsContainer.style.display = 'none';
    }
    
    // Update select all checkbox state
    if (selectAllCheckbox) {
      selectAllCheckbox.checked = count === productCheckboxes.length && count > 0;
      selectAllCheckbox.indeterminate = count > 0 && count < productCheckboxes.length;
    }
  }
  
  // Select all functionality
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', (e) => {
      const productCheckboxes = getProductCheckboxes();
      const isChecked = e.target.checked;
      productCheckboxes.forEach(checkbox => {
        checkbox.checked = isChecked;
        const productId = checkbox.getAttribute('data-id');
        if (isChecked) {
          selectedProducts.add(productId);
        } else {
          selectedProducts.delete(productId);
        }
      });
      updateSelectionUI();
    });
  }
  
  // Individual checkbox functionality
  const productCheckboxes = getProductCheckboxes();
  productCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const productId = e.target.getAttribute('data-id');
      if (e.target.checked) {
        selectedProducts.add(productId);
      } else {
        selectedProducts.delete(productId);
      }
      updateSelectionUI();
    });
  });
  
  // Bulk delete functionality
  if (bulkDeleteBtn) {
    bulkDeleteBtn.addEventListener('click', async () => {
      if (selectedProducts.size === 0) {
        if (window.toast) {
          window.toast.error('No products selected');
        }
        return;
      }
      
      const count = selectedProducts.size;
      if (!await showConfirm(`Are you sure you want to delete ${count} product${count > 1 ? 's' : ''}?`)) {
        return;
      }
      
      try {
        // Show loading state
        bulkDeleteBtn.disabled = true;
        bulkDeleteBtn.innerHTML = '<span style="display: inline-block; animation: spin 1s linear infinite;">⏳</span> Deleting...';
        
        // Delete all selected products with error handling for each
        const deletePromises = Array.from(selectedProducts).map(async (productId) => {
          try {
            await dataService.deleteProduct(productId);
            return { success: true, productId };
          } catch (error) {
            return { success: false, productId, error };
          }
        });
        
        const results = await Promise.all(deletePromises);
        
        // Count successes and failures
        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;
        
        if (failureCount === 0) {
          if (window.toast) {
            window.toast.success(`Successfully deleted ${successCount} product${successCount > 1 ? 's' : ''}`);
          }
        } else if (successCount === 0) {
          if (window.toast) {
            window.toast.error(`Failed to delete all ${count} product${count > 1 ? 's' : ''}`);
          }
        } else {
          if (window.toast) {
            window.toast.warning(`Deleted ${successCount} product${successCount > 1 ? 's' : ''}, but ${failureCount} failed`);
          }
        }
        
        // Clear selection and reload products
        selectedProducts.clear();
        await loadProducts();
        
        // Reset button state after reload completes
        bulkDeleteBtn.disabled = false;
        bulkDeleteBtn.innerHTML = '<i data-lucide="trash-2"></i> Delete Selected';
        if (window.lucide) window.lucide.createIcons();
      } catch (error) {
        console.error('Error deleting products:', error);
        if (window.toast) {
          window.toast.error('Failed to delete some products');
        }
        bulkDeleteBtn.disabled = false;
        bulkDeleteBtn.innerHTML = '<i data-lucide="trash-2"></i> Delete Selected';
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }
  
  // Cancel selection
  if (cancelSelectionBtn) {
    cancelSelectionBtn.addEventListener('click', () => {
      const productCheckboxes = getProductCheckboxes();
      selectedProducts.clear();
      productCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
      });
      if (selectAllCheckbox) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
      }
      updateSelectionUI();
    });
  }
}

function getMatchingProducts(mainCat, subCat) {
  return allProducts.filter(p => {
    const productMain = p.mainCategory || getMainCategoryForSubcategory(p.category || p.subcategory || '');
    const productSub = p.subcategory || p.category || '';
    const mainMatch = productMain === mainCat || (p.category || '') === mainCat || (p.subcategory || '') === mainCat;
    if (!mainMatch) return false;
    if (!subCat) return true;
    return productSub === subCat || p.category === subCat;
  });
}

function initializeBulkEdit() {
  const bulkEditBtn = document.getElementById('bulk-edit-btn');
  const modal = document.getElementById('bulk-edit-modal');
  const closeBtn = document.getElementById('close-bulk-edit-modal');
  const cancelBtn = document.getElementById('cancel-bulk-edit');
  const submitBtn = document.getElementById('submit-bulk-edit');
  const mainCategorySelect = document.getElementById('bulk-main-category');
  const subcategorySelect = document.getElementById('bulk-subcategory');
  const countLabel = document.getElementById('bulk-product-count');

  if (!bulkEditBtn || !modal) return;

  const closeModal = () => {
    modal.style.display = 'none';
    document.getElementById('bulk-price').value = '';
    document.getElementById('bulk-stock').value = '';
    document.getElementById('bulk-description').value = '';
  };

  // Populate main categories
  const mainCategories = getMainCategories();
  mainCategorySelect.innerHTML = '<option value="">Select main category</option>' +
    mainCategories.map(cat => `<option value="${cat}">${cat}</option>`).join('');

  const updateCount = () => {
    const mainCat = mainCategorySelect.value;
    const subCat = subcategorySelect.value;
    if (!mainCat) {
      countLabel.textContent = '';
      return;
    }
    const matched = getMatchingProducts(mainCat, subCat);
    countLabel.textContent = `${matched.length} product${matched.length !== 1 ? 's' : ''} found in ${subCat || mainCat}`;
  };

  mainCategorySelect.addEventListener('change', () => {
    const mainCat = mainCategorySelect.value;
    subcategorySelect.innerHTML = '<option value="">All subcategories</option>';
    if (mainCat) {
      const subs = getSubcategories(mainCat);
      subs.forEach(sub => {
        const opt = document.createElement('option');
        opt.value = sub;
        opt.textContent = sub;
        subcategorySelect.appendChild(opt);
      });
      subcategorySelect.disabled = false;
    } else {
      subcategorySelect.disabled = true;
    }
    updateCount();
  });

  subcategorySelect.addEventListener('change', updateCount);

  bulkEditBtn.addEventListener('click', () => {
    modal.style.display = 'flex';
    if (window.lucide) window.lucide.createIcons();
    updateCount();
  });

  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);

  submitBtn.addEventListener('click', async () => {
    const mainCat = mainCategorySelect.value;
    if (!mainCat) {
      window.toast?.error('Please select a main category');
      return;
    }

    const subCat = subcategorySelect.value;
    const newPrice = document.getElementById('bulk-price').value;
    const newStock = document.getElementById('bulk-stock').value;
    const newDescription = document.getElementById('bulk-description').value.trim();

    if (!newPrice && !newStock && !newDescription) {
      window.toast?.error('Please fill in at least one field to update');
      return;
    }

    const matched = getMatchingProducts(mainCat, subCat);

    if (matched.length === 0) {
      window.toast?.error('No matching products found');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = `Updating ${matched.length} products...`;

    try {
      await dataService.init();
      const updates = {};
      if (newPrice) updates.price = parseFloat(newPrice);
      if (newStock) updates.stock = newStock;
      if (newDescription) updates.description = newDescription;

      // Use Firestore batch writes (max 500 per batch)
      const BATCH_SIZE = 500;
      for (let i = 0; i < matched.length; i += BATCH_SIZE) {
        const batch = dataService.db.batch();
        matched.slice(i, i + BATCH_SIZE).forEach(p => {
          batch.update(dataService.db.collection('products').doc(p.id), updates);
        });
        await batch.commit();
      }

      window.toast?.success(`Updated ${matched.length} products successfully`);
      closeModal();
      await loadProducts();
    } catch (error) {
      console.error('Error bulk updating products:', error);
      window.toast?.error('Failed to update products: ' + error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i data-lucide="layers"></i> Apply to All Matching Products';
      if (window.lucide) window.lucide.createIcons();
    }
  });
}
