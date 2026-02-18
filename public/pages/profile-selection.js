import router from '../js/router.js';
import authManager from '../js/auth.js';
import languageManager from '../js/language.js';

export function renderProfileSelection() {
  const app = document.getElementById('app');
  const t = languageManager.t.bind(languageManager);
  
  // Get base URL from Vite for proper logo path
  const baseUrl = import.meta.env.BASE_URL || '/';
  const logoPath = `${baseUrl}logo.svg`.replace('//', '/'); // Avoid double slashes
  
  app.innerHTML = `
    <div class="auth-page">
      <div class="auth-container profile-selection-container">
        <div class="auth-header">
          <img src="${logoPath}" alt="I ONE Construction" class="auth-logo-image" />
          <h2 class="auth-title">${t('profile.chooseRole')}</h2>
          <p class="auth-description">${t('profile.chooseRoleDescription')}</p>
        </div>

        <div class="role-cards">
          <div class="role-card" data-role="buyer">
            <div class="role-card-icon">
              <i data-lucide="shopping-cart" style="width: 48px; height: 48px;"></i>
            </div>
            <h3>${t('profile.buyer')}</h3>
            <p>${t('profile.buyerDescription')}</p>
            <ul class="role-features">
              <li>${t('profile.buyerFeature1')}</li>
              <li>${t('profile.buyerFeature2')}</li>
              <li>${t('profile.buyerFeature3')}</li>
              <li>${t('profile.buyerFeature4')}</li>
            </ul>
          </div>

          <div class="role-card" data-role="seller">
            <div class="role-card-icon">
              <i data-lucide="store" style="width: 48px; height: 48px;"></i>
            </div>
            <h3>${t('profile.seller')}</h3>
            <p>${t('profile.sellerDescription')}</p>
            <ul class="role-features">
              <li>${t('profile.sellerFeature1')}</li>
              <li>${t('profile.sellerFeature2')}</li>
              <li>${t('profile.sellerFeature3')}</li>
              <li>${t('profile.sellerFeature4')}</li>
            </ul>
          </div>
        </div>

        <button id="continue-btn" class="btn btn-primary" disabled>
          ${t('common.next')}
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
      window.toast.error(t('profile.pleaseSelectRole'));
      return;
    }

    continueBtn.disabled = true;
    continueBtn.textContent = t('profile.updating');

    const user = authManager.getCurrentUser();
    if (!user) {
      window.toast.error(t('auth.notAuthenticated'));
      router.navigate('/login');
      return;
    }

    const result = await authManager.updateUserProfile(user.uid, {
      uid: user.uid,  // Explicitly store the user ID
      role: selectedRole,
      displayName: user.displayName || user.email,
      email: user.email,
      createdAt: new Date().toISOString()
    });

    if (result.success) {
      window.toast.success(t('profile.profileUpdated'));
      
      // Check for intended action from session storage
      const intendedAction = sessionStorage.getItem('intended-action');
      const intendedCategory = sessionStorage.getItem('intended-category');
      
      if (intendedAction === 'checkout') {
        // Clear session storage and redirect to checkout
        sessionStorage.removeItem('intended-action');
        router.navigate('/buyer/checkout');
      } else if (intendedAction === 'browse-category' && intendedCategory) {
        // Clear session storage and redirect to catalog with category
        sessionStorage.removeItem('intended-action');
        sessionStorage.removeItem('intended-category');
        router.navigate(`/buyer/catalog?category=${encodeURIComponent(intendedCategory)}`);
      } else {
        // Navigate based on selected role
        if (selectedRole === 'seller') {
          router.navigate('/seller/dashboard');
        } else {
          router.navigate('/buyer/catalog');
        }
      }
    } else {
      window.toast.error(t('profile.profileUpdateFailed'));
      continueBtn.disabled = false;
      continueBtn.textContent = t('common.next');
    }
  });
}
