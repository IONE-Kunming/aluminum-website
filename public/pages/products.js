import { renderPageWithLayout } from '../js/layout.js';
import authManager from '../js/auth.js';

export function renderProducts() {
  const content = `
    <div class="products-page">
      <div class="page-header">
        <h1>My Products</h1>
        <p>Manage your product listings</p>
        <div style="display: flex; gap: 12px;">
          <button class="btn btn-primary" id="add-product-btn">
            <i data-lucide="plus"></i>
            Add Product
          </button>
          <button class="btn btn-secondary" id="bulk-import-btn">
            <i data-lucide="upload"></i>
            Bulk Import
          </button>
        </div>
      </div>

      <!-- Bulk Import Modal -->
      <div id="bulk-import-modal" class="modal" style="display: none;">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Bulk Import Products</h2>
            <button class="modal-close" id="close-modal-btn">
              <i data-lucide="x"></i>
            </button>
          </div>
          <div class="modal-body">
            <p class="import-instructions">
              Upload an Excel file (.xlsx) with the following columns:<br>
              <strong>Model Number</strong>, <strong>Category</strong>, <strong>Price per Meter</strong>, <strong>Image Path</strong>
            </p>
            
            <div style="margin-bottom: 16px;">
              <a href="/sample-products-import.csv" download="sample-products-import.csv" class="btn btn-secondary" style="text-decoration: none; display: inline-flex; align-items: center; gap: 8px;">
                <i data-lucide="download"></i>
                Download Excel Template
              </a>
            </div>
            
            <div class="file-upload-area" id="file-upload-area">
              <i data-lucide="file-spreadsheet" style="width: 48px; height: 48px; opacity: 0.5;"></i>
              <p>Click to select Excel file or drag and drop</p>
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

      <div class="empty-state">
        <i data-lucide="package" style="width: 64px; height: 64px; opacity: 0.3;"></i>
        <h2>No products yet</h2>
        <p>Start by adding your first product or use bulk import</p>
      </div>
    </div>
  `;

  renderPageWithLayout(content, 'seller');
  if (window.lucide) window.lucide.createIcons();
  
  // Initialize bulk import functionality
  initializeBulkImport();
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
