import { renderPageWithLayout } from '../js/layout.js';
import authManager from '../js/auth.js';
import languageManager from '../js/language.js';
import dataService from '../js/dataService.js';

export async function renderProducts() {
  const t = languageManager.t.bind(languageManager);
  
  const content = `
    <div class="products-page">
      <div class="page-header">
        <h1>${t('products.myProducts')}</h1>
        <p>${t('products.manageProductListings')}</p>
        <div style="display: flex; gap: 12px;">
          <button class="btn btn-primary" id="add-product-btn">
            <i data-lucide="plus"></i>
            ${t('products.addProduct')}
          </button>
          <button class="btn btn-secondary" id="bulk-import-btn">
            <i data-lucide="upload"></i>
            ${t('products.bulkImport')}
          </button>
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
              <a href="/sample-products-import.csv" download="sample-products-import.csv" class="btn btn-secondary" style="text-decoration: none; display: inline-flex; align-items: center; gap: 8px;">
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
                Upload Product Images (Multiple files supported)
              </label>
              <input type="file" id="images-input" accept="image/*" multiple class="form-control" />
              <p class="help-text">Upload all images referenced in your Excel file</p>
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
  
  // Initialize bulk import functionality
  initializeBulkImport();
}

// Load products from Firestore
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

    // Fetch products for current seller
    const products = await dataService.getProducts({ sellerId: user.uid });
    
    if (loadingEl) loadingEl.style.display = 'none';
    
    if (products.length === 0) {
      showEmptyState();
    } else {
      displayProducts(products);
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
function displayProducts(products) {
  const gridEl = document.getElementById('products-grid');
  const emptyStateEl = document.getElementById('empty-state');
  
  if (!gridEl) return;
  
  if (emptyStateEl) emptyStateEl.style.display = 'none';
  gridEl.style.display = 'grid';
  
  gridEl.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; padding: 20px 0;">
      ${products.map(product => `
        <div class="product-card" style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; background: white;">
          ${product.imageUrl ? `
            <img src="${product.imageUrl}" alt="${product.modelNumber || 'Product'}" 
                 style="width: 100%; height: 180px; object-fit: cover; border-radius: 4px; margin-bottom: 12px;" />
          ` : `
            <div style="width: 100%; height: 180px; background: #f3f4f6; border-radius: 4px; margin-bottom: 12px; display: flex; align-items: center; justify-content: center;">
              <i data-lucide="package" style="width: 48px; height: 48px; opacity: 0.3;"></i>
            </div>
          `}
          <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 8px; color: #111827;">
            ${product.modelNumber || 'Unnamed Product'}
          </h3>
          <p style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">
            ${product.category || 'No category'}
          </p>
          <p style="font-size: 18px; font-weight: 700; color: #047857; margin-bottom: 12px;">
            $${product.pricePerMeter ? product.pricePerMeter.toFixed(2) : '0.00'}/m
          </p>
          ${product.description ? `
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 12px; line-height: 1.4;">
              ${product.description.substring(0, 100)}${product.description.length > 100 ? '...' : ''}
            </p>
          ` : ''}
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

// Edit product (placeholder for future implementation)
function editProduct(productId) {
  if (window.toast) {
    window.toast.info('Edit product feature coming soon');
  }
  console.log('Edit product:', productId);
}

// Delete product
async function deleteProduct(productId) {
  if (!confirm('Are you sure you want to delete this product?')) {
    return;
  }
  
  try {
    const db = firebase.firestore();
    await db.collection('products').doc(productId).delete();
    
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
    
    startImportBtn.disabled = true;
    cancelImportBtn.disabled = true;
    document.getElementById('import-progress').style.display = 'block';
    
    try {
      // Get Firebase instances
      const db = firebase.firestore();
      const storage = firebase.storage();
      
      const totalProducts = excelData.length;
      let importedCount = 0;
      
      for (const row of excelData) {
        try {
          // Map Excel columns to product fields
          const modelNumber = row['Model Number'] || row['model_number'] || row['ModelNumber'];
          const category = row['Category'] || row['category'];
          const pricePerMeter = row['Price per Meter'] || row['price_per_meter'] || row['PricePerMeter'];
          const imagePath = row['Image Path'] || row['image_path'] || row['ImagePath'];
          
          // Upload image if provided
          let imageUrl = '';
          if (imagePath && uploadedImages) {
            const imageName = imagePath.split('/').pop().split('\\').pop();
            const imageFile = uploadedImages[imageName];
            if (imageFile) {
              const imageRef = storage.ref(`products/${profile.uid}/${Date.now()}_${imageName}`);
              await imageRef.put(imageFile);
              imageUrl = await imageRef.getDownloadURL();
            }
          }
          
          // Create product document
          await db.collection('products').add({
            sellerId: profile.uid,
            sellerName: profile.displayName,
            modelNumber: modelNumber,
            category: category,
            pricePerMeter: parseFloat(pricePerMeter),
            imageUrl: imageUrl,
            createdAt: new Date().toISOString(),
            stock: 0,
            description: ''
          });
          
          importedCount++;
          const progress = (importedCount / totalProducts) * 100;
          document.getElementById('progress-fill').style.width = `${progress}%`;
          document.getElementById('progress-text').textContent = 
            `Importing products... ${importedCount} of ${totalProducts}`;
        } catch (rowError) {
          console.error('Error importing row:', row, rowError);
        }
      }
      
      alert(`Successfully imported ${importedCount} products!`);
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
