import router from '../js/router.js';
import authManager from '../js/auth.js';

export function renderProfileSelection() {
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="auth-page">
      <div class="auth-container profile-selection-container">
        <div class="auth-header">
          <h1 class="auth-logo">IONE</h1>
          <p class="auth-subtitle">AlumaTech Industries</p>
          <h2 class="auth-title">Choose Your Role</h2>
          <p class="auth-description">Select how you want to use the platform</p>
        </div>

        <div class="role-cards">
          <div class="role-card" data-role="buyer">
            <div class="role-card-icon">
              <i data-lucide="shopping-cart" style="width: 48px; height: 48px;"></i>
            </div>
            <h3>Buyer</h3>
            <p>Browse products, place orders, and manage purchases</p>
            <ul class="role-features">
              <li>Access product catalog</li>
              <li>Place and track orders</li>
              <li>Manage invoices</li>
              <li>Contact sellers</li>
            </ul>
          </div>

          <div class="role-card" data-role="seller">
            <div class="role-card-icon">
              <i data-lucide="store" style="width: 48px; height: 48px;"></i>
            </div>
            <h3>Seller</h3>
            <p>List products, manage inventory, and process orders</p>
            <ul class="role-features">
              <li>Manage product listings</li>
              <li>Process customer orders</li>
              <li>Generate invoices</li>
              <li>Manage branches</li>
            </ul>
          </div>
        </div>

        <button id="continue-btn" class="btn btn-primary" disabled>
          Continue
        </button>
      </div>
    </div>
  `;

  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  let selectedRole = '';
  const roleCards = document.querySelectorAll('.role-card');
  const continueBtn = document.getElementById('continue-btn');

  roleCards.forEach(card => {
    card.addEventListener('click', () => {
      roleCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedRole = card.getAttribute('data-role');
      continueBtn.disabled = false;
    });
  });

  continueBtn.addEventListener('click', async () => {
    if (!selectedRole) {
      window.toast.error('Please select a role');
      return;
    }

    continueBtn.disabled = true;
    continueBtn.textContent = 'Updating...';

    const user = authManager.getCurrentUser();
    if (!user) {
      window.toast.error('Not authenticated');
      router.navigate('/login');
      return;
    }

    const result = await authManager.updateUserProfile(user.uid, {
      role: selectedRole,
      createdAt: new Date().toISOString()
    });

    if (result.success) {
      window.toast.success('Profile updated successfully!');
      
      // Navigate based on selected role
      if (selectedRole === 'seller') {
        router.navigate('/seller/dashboard');
      } else {
        router.navigate('/buyer/dashboard');
      }
    } else {
      window.toast.error('Failed to update profile');
      continueBtn.disabled = false;
      continueBtn.textContent = 'Continue';
    }
  });
}
