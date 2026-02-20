import { renderPageWithLayout } from '../js/layout.js';
import authManager from '../js/auth.js';
import dataService from '../js/dataService.js';
import languageManager from '../js/language.js';
import { escapeHtml, showConfirm } from '../js/utils.js';
import {
  getSubcategories,
  getMainCategories,
  getMainCategoryForSubcategory
} from '../js/categoryHierarchy.js';

let allProducts = [];
let sellers = {};

export async function renderAdminBulkEdit() {
  const t = languageManager.t.bind(languageManager);

  const profile = authManager.getUserProfile();
  if (profile?.role !== 'admin') {
    renderPageWithLayout('<div class="error">Access denied. Admin privileges required.</div>', 'admin');
    return;
  }

  const content = `
    <div class="admin-bulk-edit-page">
      <div class="page-header">
        <h1><i data-lucide="table"></i> Bulk Edit Products</h1>
        <p>Edit multiple products at once using the table below</p>
        <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-top: 12px;">
          <button class="btn btn-secondary" id="back-to-products-btn">
            <i data-lucide="arrow-left"></i> Back to Products
          </button>
          <button class="btn btn-primary" id="save-all-btn" disabled>
            <i data-lucide="save"></i> Save All Changes
          </button>
        </div>
      </div>

      <div class="admin-controls">
        <div class="search-box">
          <i data-lucide="search"></i>
          <input type="text" id="bulk-search" placeholder="Search products by name or model number..." />
        </div>
        <div class="filter-controls">
          <select id="bulk-category-filter">
            <option value="">All Categories</option>
          </select>
          <select id="bulk-seller-filter">
            <option value="">All Sellers</option>
          </select>
        </div>
      </div>

      <div id="bulk-loading" class="loading-spinner">
        <i data-lucide="loader"></i> Loading products...
      </div>

      <div id="bulk-table-container" style="display: none;">
        <!-- Table will be rendered here -->
      </div>
    </div>
  `;

  renderPageWithLayout(content, 'admin');
  if (window.lucide) window.lucide.createIcons();

  document.getElementById('back-to-products-btn').addEventListener('click', () => {
    window.router.navigate('/admin/products');
  });

  await loadBulkProducts();

  document.getElementById('bulk-search').addEventListener('input', filterBulkProducts);
  document.getElementById('bulk-category-filter').addEventListener('change', filterBulkProducts);
  document.getElementById('bulk-seller-filter').addEventListener('change', filterBulkProducts);
}

async function loadBulkProducts() {
  try {
    await dataService.init();
    const products = await dataService.getProducts({ limit: 1000000 });
    allProducts = products;

    const sellersSnapshot = await dataService.db.collection('users').where('role', '==', 'seller').get();
    sellers = {};
    sellersSnapshot.docs.forEach(doc => {
      sellers[doc.id] = doc.data().companyName || doc.data().displayName || 'Unknown';
    });

    populateBulkFilters();
    displayBulkTable(allProducts);
  } catch (error) {
    console.error('Error loading products for bulk edit:', error);
    document.getElementById('bulk-loading').innerHTML = '<div class="error">Failed to load products</div>';
  }
}

function populateBulkFilters() {
  const categories = [...new Set(allProducts.map(p => p.category).filter(Boolean))].sort();
  const categoryFilter = document.getElementById('bulk-category-filter');
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });

  const sellerFilter = document.getElementById('bulk-seller-filter');
  Object.entries(sellers).forEach(([id, name]) => {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = name;
    sellerFilter.appendChild(option);
  });
}

function filterBulkProducts() {
  const searchTerm = document.getElementById('bulk-search').value.toLowerCase();
  const categoryFilter = document.getElementById('bulk-category-filter').value;
  const sellerFilter = document.getElementById('bulk-seller-filter').value;

  let filtered = allProducts;

  if (searchTerm) {
    filtered = filtered.filter(p =>
      (p.name && p.name.toLowerCase().includes(searchTerm)) ||
      (p.modelNumber && p.modelNumber.toLowerCase().includes(searchTerm))
    );
  }
  if (categoryFilter) {
    filtered = filtered.filter(p => p.category === categoryFilter);
  }
  if (sellerFilter) {
    filtered = filtered.filter(p => p.sellerId === sellerFilter);
  }

  displayBulkTable(filtered);
}

function displayBulkTable(products) {
  const container = document.getElementById('bulk-table-container');
  const loading = document.getElementById('bulk-loading');

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

  // Build the main categories and subcategories for dropdowns
  const mainCategories = getMainCategories();

  container.innerHTML = `
    <div class="table-container bulk-edit-table-wrapper">
      <table class="data-table bulk-edit-table">
        <thead>
          <tr>
            <th style="min-width: 100px;">Image</th>
            <th style="min-width: 160px;">Name</th>
            <th style="min-width: 140px;">Model Number</th>
            <th style="min-width: 90px;">Stock</th>
            <th style="min-width: 140px;">Category</th>
            <th style="min-width: 160px;">Sub Category</th>
            <th style="min-width: 180px;">Additional Images</th>
            <th style="min-width: 80px;">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${products.map(product => renderBulkRow(product, mainCategories)).join('')}
        </tbody>
      </table>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
  setupBulkRowListeners(products, mainCategories);
}

function renderBulkRow(product, mainCategories) {
  const currentCategory = product.category || '';
  const mainCat = product.mainCategory || getMainCategoryForSubcategory(currentCategory) || '';
  const images = product.images || [];
  const primaryImage = product.imageUrl || (images.length > 0 ? images[0] : '');

  // Build subcategory options for current main category
  const subcategories = mainCat ? getSubcategories(mainCat) : [];

  return `
    <tr data-product-id="${product.id}">
      <td>
        <div class="bulk-image-cell">
          ${primaryImage
            ? `<img src="${primaryImage}" alt="${escapeHtml(product.name || product.modelNumber || '')}" class="bulk-product-thumb" />`
            : `<div class="bulk-product-thumb-placeholder"><i data-lucide="image"></i></div>`
          }
        </div>
      </td>
      <td>
        <input type="text" class="form-control bulk-input" data-field="name" data-id="${product.id}"
               value="${escapeHtml(product.name || product.modelNumber || '')}" />
      </td>
      <td>
        <input type="text" class="form-control bulk-input" data-field="modelNumber" data-id="${product.id}"
               value="${escapeHtml(product.modelNumber || '')}" />
      </td>
      <td>
        <input type="number" class="form-control bulk-input" data-field="stock" data-id="${product.id}"
               value="${product.stock || product.stockQuantity || 0}" min="0" />
      </td>
      <td>
        <select class="form-control bulk-input bulk-main-cat" data-field="mainCategory" data-id="${product.id}">
          <option value="">Select</option>
          ${mainCategories.map(cat => `<option value="${escapeHtml(cat)}" ${cat === mainCat ? 'selected' : ''}>${escapeHtml(cat)}</option>`).join('')}
        </select>
      </td>
      <td>
        <select class="form-control bulk-input bulk-sub-cat" data-field="category" data-id="${product.id}">
          <option value="">Select</option>
          ${subcategories.map(sub => `<option value="${escapeHtml(sub)}" ${sub === currentCategory ? 'selected' : ''}>${escapeHtml(sub)}</option>`).join('')}
        </select>
      </td>
      <td>
        <div class="bulk-additional-images" data-id="${product.id}">
          ${(images.length > 1 ? images.slice(1) : []).map((img, idx) => `
            <div class="bulk-extra-img-wrapper">
              <img src="${img}" class="bulk-extra-thumb" alt="Extra ${idx + 1}" />
              <button class="bulk-remove-img-btn" data-id="${product.id}" data-img-index="${idx + 1}" title="Remove image">&times;</button>
            </div>
          `).join('')}
          <label class="bulk-add-img-btn" title="Add image">
            <i data-lucide="plus"></i>
            <input type="file" accept="image/*" multiple class="bulk-img-upload" data-id="${product.id}" style="display:none;" />
          </label>
        </div>
      </td>
      <td>
        <button class="btn-icon bulk-save-row" data-id="${product.id}" title="Save this row" disabled>
          <i data-lucide="check"></i>
        </button>
      </td>
    </tr>
  `;
}

function setupBulkRowListeners(products, mainCategories) {
  const saveAllBtn = document.getElementById('save-all-btn');
  const changedRows = new Set();

  // Mark row as changed
  function markChanged(productId) {
    changedRows.add(productId);
    const rowSaveBtn = document.querySelector(`.bulk-save-row[data-id="${productId}"]`);
    if (rowSaveBtn) rowSaveBtn.disabled = false;
    if (saveAllBtn) saveAllBtn.disabled = false;
  }

  // Track input changes
  document.querySelectorAll('.bulk-input').forEach(input => {
    input.addEventListener('change', () => {
      markChanged(input.getAttribute('data-id'));
    });
    input.addEventListener('input', () => {
      markChanged(input.getAttribute('data-id'));
    });
  });

  // Main category change -> update subcategory dropdown
  document.querySelectorAll('.bulk-main-cat').forEach(select => {
    select.addEventListener('change', () => {
      const productId = select.getAttribute('data-id');
      const mainCat = select.value;
      const subSelect = document.querySelector(`.bulk-sub-cat[data-id="${productId}"]`);
      if (subSelect) {
        const subs = mainCat ? getSubcategories(mainCat) : [];
        subSelect.innerHTML = `<option value="">Select</option>` +
          subs.map(sub => `<option value="${escapeHtml(sub)}">${escapeHtml(sub)}</option>`).join('');
      }
    });
  });

  // Image upload
  document.querySelectorAll('.bulk-img-upload').forEach(input => {
    input.addEventListener('change', async (e) => {
      const productId = input.getAttribute('data-id');
      const files = Array.from(e.target.files);
      if (files.length === 0) return;

      const product = allProducts.find(p => p.id === productId);
      if (!product) return;

      try {
        window.toast.info('Uploading images...');
        const storage = firebase.storage();
        const newUrls = [];

        for (const file of files) {
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const imageRef = storage.ref(`products/${product.sellerId || 'admin'}/${Date.now()}_${safeName}`);
          await imageRef.put(file);
          const url = await imageRef.getDownloadURL();
          newUrls.push(url);
        }

        // Append new images to existing images array
        if (!product.images) product.images = [];
        if (product.imageUrl && product.images.length === 0) {
          product.images.push(product.imageUrl);
        }
        product.images.push(...newUrls);

        // Save immediately to Firestore
        await dataService.db.collection('products').doc(productId).update({
          images: product.images
        });

        window.toast.success(`${newUrls.length} image(s) uploaded`);
        // Refresh the table
        filterBulkProducts();
      } catch (error) {
        console.error('Error uploading images:', error);
        window.toast.error('Failed to upload images');
      }
    });
  });

  // Remove extra image buttons
  document.querySelectorAll('.bulk-remove-img-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const productId = btn.getAttribute('data-id');
      const imgIndex = parseInt(btn.getAttribute('data-img-index'));
      const product = allProducts.find(p => p.id === productId);
      if (!product || !product.images) return;

      if (!await showConfirm('Remove this image?')) return;

      product.images.splice(imgIndex, 1);
      try {
        await dataService.db.collection('products').doc(productId).update({
          images: product.images
        });
        window.toast.success('Image removed');
        filterBulkProducts();
      } catch (error) {
        console.error('Error removing image:', error);
        window.toast.error('Failed to remove image');
      }
    });
  });

  // Individual row save
  document.querySelectorAll('.bulk-save-row').forEach(btn => {
    btn.addEventListener('click', async () => {
      const productId = btn.getAttribute('data-id');
      await saveRow(productId);
      changedRows.delete(productId);
      btn.disabled = true;
      if (changedRows.size === 0 && saveAllBtn) saveAllBtn.disabled = true;
    });
  });

  // Save all button
  if (saveAllBtn) {
    saveAllBtn.addEventListener('click', async () => {
      if (changedRows.size === 0) return;
      if (!await showConfirm(`Save changes for ${changedRows.size} product(s)?`)) return;

      saveAllBtn.disabled = true;
      saveAllBtn.innerHTML = '<i data-lucide="loader"></i> Saving...';
      if (window.lucide) window.lucide.createIcons();

      try {
        for (const productId of changedRows) {
          await saveRow(productId);
        }
        changedRows.clear();
        window.toast.success('All changes saved');
        document.querySelectorAll('.bulk-save-row').forEach(b => b.disabled = true);
      } catch (error) {
        console.error('Error saving bulk changes:', error);
        window.toast.error('Failed to save some changes');
      } finally {
        saveAllBtn.disabled = changedRows.size === 0;
        saveAllBtn.innerHTML = '<i data-lucide="save"></i> Save All Changes';
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }
}

async function saveRow(productId) {
  const row = document.querySelector(`tr[data-product-id="${productId}"]`);
  if (!row) return;

  const name = row.querySelector('[data-field="name"]')?.value?.trim() || '';
  const modelNumber = row.querySelector('[data-field="modelNumber"]')?.value?.trim() || '';
  const stock = parseInt(row.querySelector('[data-field="stock"]')?.value) || 0;
  const mainCategory = row.querySelector('[data-field="mainCategory"]')?.value || '';
  const category = row.querySelector('[data-field="category"]')?.value || '';

  const updateData = {
    name: name,
    modelNumber: modelNumber,
    stock: stock,
    stockQuantity: stock,
    updatedAt: new Date().toISOString()
  };

  if (mainCategory) updateData.mainCategory = mainCategory;
  if (category) updateData.category = category;

  await dataService.db.collection('products').doc(productId).update(updateData);

  // Update local copy
  const product = allProducts.find(p => p.id === productId);
  if (product) {
    Object.assign(product, updateData);
  }
}
