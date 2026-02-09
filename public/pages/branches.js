import { renderPageWithLayout } from '../js/layout.js';
import languageManager from '../js/language.js';
import authManager from '../js/auth.js';
import { escapeHtml } from '../js/utils.js';

export async function renderBranches() {
  const t = languageManager.t.bind(languageManager);
  
  const content = `
    <div class="branches-page">
      <div class="page-header">
        <h1>${t('branches.title')}</h1>
        <p>${t('branches.subtitle')}</p>
        <button class="btn btn-primary" id="add-branch-btn">
          <i data-lucide="plus"></i>
          ${t('branches.addBranch')}
        </button>
      </div>

      <!-- Loading State -->
      <div id="branches-loading" style="text-align: center; padding: 40px;">
        <i data-lucide="loader" style="width: 48px; height: 48px; opacity: 0.5; animation: spin 1s linear infinite;"></i>
        <p style="margin-top: 16px; color: #6b7280;">Loading branches...</p>
      </div>

      <!-- Branches Grid -->
      <div id="branches-grid" style="display: none; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; margin-top: 24px;">
      </div>

      <!-- Empty State -->
      <div id="empty-state" class="empty-state" style="display: none;">
        <i data-lucide="git-branch" style="width: 64px; height: 64px; opacity: 0.3;"></i>
        <h2>${t('branches.noBranches')}</h2>
        <p>${t('branches.addFirstBranch')}</p>
      </div>

      <!-- Add/Edit Branch Modal -->
      <div id="branch-modal" class="modal" style="display: none;">
        <div class="modal-content" style="max-width: 600px;">
          <div class="modal-header">
            <h2 id="modal-title">${t('branches.addBranch')}</h2>
            <button class="modal-close" id="close-modal-btn">
              <i data-lucide="x"></i>
            </button>
          </div>
          <div class="modal-body">
            <form id="branch-form">
              <div class="form-group">
                <label>Branch Name *</label>
                <input type="text" id="branch-name" class="form-control" required placeholder="e.g., Main Office">
              </div>
              <div class="form-group">
                <label>Address *</label>
                <input type="text" id="branch-address" class="form-control" required placeholder="123 Main Street">
              </div>
              <div class="form-group">
                <label>City *</label>
                <input type="text" id="branch-city" class="form-control" required placeholder="New York">
              </div>
              <div class="form-group">
                <label>State/Province</label>
                <input type="text" id="branch-state" class="form-control" placeholder="NY">
              </div>
              <div class="form-group">
                <label>Country *</label>
                <input type="text" id="branch-country" class="form-control" required placeholder="USA">
              </div>
              <div class="form-group">
                <label>Phone</label>
                <input type="tel" id="branch-phone" class="form-control" placeholder="+1234567890">
              </div>
              <div class="form-group">
                <label>Email</label>
                <input type="email" id="branch-email" class="form-control" placeholder="branch@company.com">
              </div>
              <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;">
                <button type="button" class="btn btn-text" id="cancel-btn">Cancel</button>
                <button type="submit" class="btn btn-primary" id="save-branch-btn">
                  <i data-lucide="save"></i>
                  Save Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;

  renderPageWithLayout(content, 'seller');
  if (window.lucide) window.lucide.createIcons();
  
  // Load branches
  await loadBranches();
  
  // Initialize event handlers
  initializeBranchHandlers();
}

// Load branches from Firestore
async function loadBranches() {
  const loadingEl = document.getElementById('branches-loading');
  const gridEl = document.getElementById('branches-grid');
  const emptyStateEl = document.getElementById('empty-state');
  
  try {
    const user = authManager.getCurrentUser();
    if (!user) {
      console.error('No user logged in');
      showEmptyState();
      return;
    }

    // Get Firestore instance
    const db = firebase.firestore();
    const snapshot = await db
      .collection('branches')
      .where('sellerId', '==', user.uid)
      .get();

    if (loadingEl) loadingEl.style.display = 'none';

    if (snapshot.empty) {
      showEmptyState();
    } else {
      const branches = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      displayBranches(branches);
    }
  } catch (error) {
    console.error('Error loading branches:', error);
    if (loadingEl) loadingEl.style.display = 'none';
    showEmptyState();
    if (window.toast) {
      window.toast.error('Failed to load branches: ' + error.message);
    }
  }
}

// Show empty state
function showEmptyState() {
  const loadingEl = document.getElementById('branches-loading');
  const gridEl = document.getElementById('branches-grid');
  const emptyStateEl = document.getElementById('empty-state');
  
  if (loadingEl) loadingEl.style.display = 'none';
  if (gridEl) gridEl.style.display = 'none';
  if (emptyStateEl) {
    emptyStateEl.style.display = 'flex';
    if (window.lucide) window.lucide.createIcons();
  }
}

// Display branches in grid
function displayBranches(branches) {
  const gridEl = document.getElementById('branches-grid');
  const emptyStateEl = document.getElementById('empty-state');
  
  if (!gridEl) return;
  
  if (emptyStateEl) emptyStateEl.style.display = 'none';
  gridEl.style.display = 'grid';
  
  gridEl.innerHTML = branches.map(branch => `
    <div class="card" data-branch-id="${branch.id}" style="padding: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
        <div>
          <h3 style="margin: 0 0 8px 0; font-size: 18px;">${escapeHtml(branch.name)}</h3>
          <span style="font-size: 12px; color: #6b7280; background: #f3f4f6; padding: 4px 8px; border-radius: 4px;">
            <i data-lucide="map-pin" style="width: 12px; height: 12px;"></i>
            ${escapeHtml(branch.city)}, ${escapeHtml(branch.country)}
          </span>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-text edit-branch-btn" data-branch-id="${branch.id}" style="padding: 8px;">
            <i data-lucide="edit-2" style="width: 16px; height: 16px;"></i>
          </button>
          <button class="btn btn-text delete-branch-btn" data-branch-id="${branch.id}" style="padding: 8px; color: #dc2626;">
            <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
          </button>
        </div>
      </div>
      
      <div style="display: flex; flex-direction: column; gap: 8px; font-size: 14px; color: #6b7280;">
        <div style="display: flex; align-items: start; gap: 8px;">
          <i data-lucide="map" style="width: 16px; height: 16px; margin-top: 2px; flex-shrink: 0;"></i>
          <span>${escapeHtml(branch.address)}<br>${escapeHtml(branch.city)}${branch.state ? ', ' + escapeHtml(branch.state) : ''}<br>${escapeHtml(branch.country)}</span>
        </div>
        ${branch.phone ? `
          <div style="display: flex; align-items: center; gap: 8px;">
            <i data-lucide="phone" style="width: 16px; height: 16px;"></i>
            <span>${escapeHtml(branch.phone)}</span>
          </div>
        ` : ''}
        ${branch.email ? `
          <div style="display: flex; align-items: center; gap: 8px;">
            <i data-lucide="mail" style="width: 16px; height: 16px;"></i>
            <span>${escapeHtml(branch.email)}</span>
          </div>
        ` : ''}
      </div>
    </div>
  `).join('');
  
  if (window.lucide) window.lucide.createIcons();
  
  // Attach event listeners to edit and delete buttons
  document.querySelectorAll('.edit-branch-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const branchId = btn.getAttribute('data-branch-id');
      const branch = branches.find(b => b.id === branchId);
      if (branch) openEditModal(branch);
    });
  });
  
  document.querySelectorAll('.delete-branch-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const branchId = btn.getAttribute('data-branch-id');
      await deleteBranch(branchId);
    });
  });
}

// Initialize branch handlers
function initializeBranchHandlers() {
  const addBranchBtn = document.getElementById('add-branch-btn');
  const modal = document.getElementById('branch-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const cancelBtn = document.getElementById('cancel-btn');
  const branchForm = document.getElementById('branch-form');
  
  let editingBranchId = null;
  
  // Open add modal
  if (addBranchBtn) {
    addBranchBtn.addEventListener('click', () => {
      editingBranchId = null;
      document.getElementById('modal-title').textContent = 'Add Branch';
      branchForm.reset();
      
      // Disable email field for new branches and set to user's email
      const emailField = document.getElementById('branch-email');
      const user = authManager.getCurrentUser();
      const profile = authManager.getUserProfile();
      if (emailField && user) {
        emailField.value = user.email || profile?.email || '';
        emailField.disabled = true;
        emailField.style.backgroundColor = '#f3f4f6';
        emailField.style.cursor = 'not-allowed';
      }
      
      modal.style.display = 'flex';
      if (window.lucide) window.lucide.createIcons();
    });
  }
  
  // Close modal
  const closeModal = () => {
    modal.style.display = 'none';
    branchForm.reset();
    editingBranchId = null;
  };
  
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  
  // Open edit modal
  window.openEditModal = (branch) => {
    editingBranchId = branch.id;
    document.getElementById('modal-title').textContent = 'Edit Branch';
    document.getElementById('branch-name').value = branch.name || '';
    document.getElementById('branch-address').value = branch.address || '';
    document.getElementById('branch-city').value = branch.city || '';
    document.getElementById('branch-state').value = branch.state || '';
    document.getElementById('branch-country').value = branch.country || '';
    document.getElementById('branch-phone').value = branch.phone || '';
    document.getElementById('branch-email').value = branch.email || '';
    
    // Enable email field for editing (allow updating)
    const emailField = document.getElementById('branch-email');
    if (emailField) {
      emailField.disabled = false;
      emailField.style.backgroundColor = '';
      emailField.style.cursor = '';
    }
    
    modal.style.display = 'flex';
    if (window.lucide) window.lucide.createIcons();
  };
  
  // Handle form submission
  if (branchForm) {
    branchForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const branchData = {
        name: document.getElementById('branch-name').value.trim(),
        address: document.getElementById('branch-address').value.trim(),
        city: document.getElementById('branch-city').value.trim(),
        state: document.getElementById('branch-state').value.trim(),
        country: document.getElementById('branch-country').value.trim(),
        phone: document.getElementById('branch-phone').value.trim(),
        email: document.getElementById('branch-email').value.trim(),
      };
      
      // Validation
      const errors = [];
      
      // Required field validation
      if (!branchData.name) {
        errors.push('Branch Name is required');
      } else if (branchData.name.length < 2) {
        errors.push('Branch Name must be at least 2 characters');
      } else if (branchData.name.length > 100) {
        errors.push('Branch Name must be less than 100 characters');
      }
      
      if (!branchData.address) {
        errors.push('Address is required');
      } else if (branchData.address.length < 5) {
        errors.push('Address must be at least 5 characters');
      }
      
      if (!branchData.city) {
        errors.push('City is required');
      } else if (branchData.city.length < 2) {
        errors.push('City must be at least 2 characters');
      }
      
      if (!branchData.country) {
        errors.push('Country is required');
      } else if (branchData.country.length < 2) {
        errors.push('Country must be at least 2 characters');
      }
      
      // Email validation (if provided)
      if (branchData.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(branchData.email)) {
          errors.push('Invalid email format');
        }
      }
      
      // Phone validation (if provided)
      if (branchData.phone) {
        // Remove spaces, dashes, and parentheses for validation
        const cleanPhone = branchData.phone.replace(/[\s\-\(\)]/g, '');
        // Check if it contains only digits and optional + at start
        const phoneRegex = /^\+?[0-9]{7,15}$/;
        if (!phoneRegex.test(cleanPhone)) {
          errors.push('Invalid phone number format (must be 7-15 digits, optionally starting with +)');
        }
      }
      
      // Show validation errors
      if (errors.length > 0) {
        if (window.toast) {
          errors.forEach(error => window.toast.error(error));
        } else {
          alert('Validation errors:\n\n' + errors.join('\n'));
        }
        return;
      }
      
      try {
        const user = authManager.getCurrentUser();
        if (!user) throw new Error('User not authenticated');
        
        const saveBtn = document.getElementById('save-branch-btn');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i data-lucide="loader"></i> Saving...';
        if (window.lucide) window.lucide.createIcons();
        
        const db = firebase.firestore();
        
        // Check for duplicate branch names (case-insensitive)
        const existingBranches = await db.collection('branches')
          .where('sellerId', '==', user.uid)
          .get();
        
        const duplicateName = existingBranches.docs.find(doc => {
          const branch = doc.data();
          // Skip the current branch when editing
          if (editingBranchId && doc.id === editingBranchId) {
            return false;
          }
          return branch.name.toLowerCase() === branchData.name.toLowerCase();
        });
        
        if (duplicateName) {
          if (window.toast) {
            window.toast.error('A branch with this name already exists');
          } else {
            alert('A branch with this name already exists');
          }
          saveBtn.disabled = false;
          saveBtn.innerHTML = '<i data-lucide="save"></i> Save Branch';
          if (window.lucide) window.lucide.createIcons();
          return;
        }
        
        if (editingBranchId) {
          // Update existing branch
          await db.collection('branches').doc(editingBranchId).update({
            ...branchData,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          if (window.toast) window.toast.success('Branch updated successfully');
        } else {
          // Add new branch
          await db.collection('branches').add({
            ...branchData,
            sellerId: user.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          if (window.toast) window.toast.success('Branch added successfully');
        }
        
        closeModal();
        await loadBranches();
      } catch (error) {
        console.error('Error saving branch:', error);
        if (window.toast) {
          window.toast.error('Failed to save branch: ' + error.message);
        }
      } finally {
        const saveBtn = document.getElementById('save-branch-btn');
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i data-lucide="save"></i> Save Branch';
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }
}

// Delete branch
async function deleteBranch(branchId) {
  const confirmed = confirm('Are you sure you want to delete this branch? This action cannot be undone.');
  
  if (!confirmed) return;
  
  try {
    const db = firebase.firestore();
    await db.collection('branches').doc(branchId).delete();
    
    if (window.toast) {
      window.toast.success('Branch deleted successfully');
    }
    
    await loadBranches();
  } catch (error) {
    console.error('Error deleting branch:', error);
    if (window.toast) {
      window.toast.error('Failed to delete branch: ' + error.message);
    }
  }
}
