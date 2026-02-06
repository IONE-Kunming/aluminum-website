import router from '../js/router.js';
import authManager from '../js/auth.js';
import languageManager from '../js/language.js';

export function renderSignupPage() {
  const app = document.getElementById('app');
  const t = languageManager.t.bind(languageManager);
  
  app.innerHTML = `
    <div class="auth-page">
      <div class="auth-container">
        <div class="auth-header">
          <img src="/logo.svg" alt="I ONE Construction" class="auth-logo-image" />
          <h2 class="auth-title">${t('auth.createAccount')}</h2>
          <p class="auth-description">${t('landing.hero.description')}</p>
        </div>

        <!-- Language Dropdown -->
        <div class="auth-language-dropdown">
          <div class="language-dropdown">
            <button class="language-toggle" id="auth-language-toggle" type="button">
              ${t('languages.' + languageManager.getLanguage())}
              <i data-lucide="chevron-down" style="width: 14px; height: 14px; margin-left: 4px;"></i>
            </button>
            <div class="language-dropdown-menu" id="auth-language-menu">
              <button class="language-option" data-lang="en">${t('languages.en')}</button>
              <button class="language-option" data-lang="ar">${t('languages.ar')}</button>
              <button class="language-option" data-lang="zh">${t('languages.zh')}</button>
            </div>
          </div>
        </div>

        <div id="error-message" class="error-message" style="display: none;">
          <i data-lucide="alert-circle"></i>
          <span></span>
        </div>

        <form id="signup-form" class="auth-form">
          <!-- Role Selection -->
          <div class="form-group">
            <label>${t('profile.role')}</label>
            <div class="role-selection">
              <label class="role-option active">
                <input
                  type="radio"
                  name="role"
                  value="buyer"
                  checked
                />
                <span>${t('profile.buyer')}</span>
              </label>
              <label class="role-option">
                <input
                  type="radio"
                  name="role"
                  value="seller"
                />
                <span>${t('profile.seller')}</span>
              </label>
            </div>
          </div>

          <!-- Full Name -->
          <div class="form-group">
            <label for="displayName">
              <i data-lucide="user"></i>
              ${t('profile.displayName')}
            </label>
            <input
              id="displayName"
              type="text"
              placeholder="${t('profile.displayName')}"
              required
            />
          </div>

          <!-- Company Name -->
          <div class="form-group">
            <label for="companyName">
              <i data-lucide="building"></i>
              ${t('auth.companyName')}
            </label>
            <input
              id="companyName"
              type="text"
              placeholder="${t('auth.companyName')}"
              required
            />
          </div>

          <!-- Email -->
          <div class="form-group">
            <label for="email">
              <i data-lucide="mail"></i>
              ${t('auth.email')}
            </label>
            <input
              id="email"
              type="email"
              placeholder="${t('auth.email')}"
              required
            />
          </div>

          <!-- Phone Number -->
          <div class="form-group">
            <label for="phoneNumber">
              <i data-lucide="phone"></i>
              ${t('auth.phoneNumber')}
            </label>
            <input
              id="phoneNumber"
              type="tel"
              placeholder="${t('auth.phoneNumber')}"
              required
            />
          </div>

          <!-- Password -->
          <div class="form-group">
            <label for="password">
              <i data-lucide="lock"></i>
              ${t('auth.password')}
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" class="btn btn-primary">
            <span class="btn-text">${t('auth.createAccount')}</span>
          </button>
        </form>

        <div class="auth-footer">
          <p>
            ${t('auth.alreadyHaveAccount')}
            <a href="#" id="login-link" class="auth-link">${t('auth.signIn')}</a>
          </p>
        </div>
      </div>
    </div>
  `;

  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  const form = document.getElementById('signup-form');
  const errorDiv = document.getElementById('error-message');
  const roleOptions = document.querySelectorAll('.role-option');
  const loginLink = document.getElementById('login-link');
  
  // Language dropdown
  const langToggle = document.getElementById('auth-language-toggle');
  const langMenu = document.getElementById('auth-language-menu');
  
  if (langToggle && langMenu) {
    langToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      langMenu.classList.toggle('active');
    });

    document.addEventListener('click', () => {
      langMenu.classList.remove('active');
    });

    langMenu.querySelectorAll('.language-option').forEach(option => {
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        const lang = option.getAttribute('data-lang');
        languageManager.setLanguage(lang);
      });
    });
  }

  // Handle role selection
  roleOptions.forEach(option => {
    option.addEventListener('click', () => {
      roleOptions.forEach(opt => opt.classList.remove('active'));
      option.classList.add('active');
    });
  });

  function showError(message) {
    errorDiv.style.display = 'flex';
    errorDiv.querySelector('span').textContent = message;
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function hideError() {
    errorDiv.style.display = 'none';
  }

  function setLoading(isLoading) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('.btn-text');
    const inputs = form.querySelectorAll('input');
    
    if (isLoading) {
      submitBtn.disabled = true;
      btnText.textContent = t('common.loading');
      inputs.forEach(input => input.disabled = true);
    } else {
      submitBtn.disabled = false;
      btnText.textContent = t('auth.createAccount');
      inputs.forEach(input => input.disabled = false);
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const displayName = document.getElementById('displayName').value;
    const email = document.getElementById('email').value;
    const companyName = document.getElementById('companyName').value;
    const phoneNumber = document.getElementById('phoneNumber').value;
    const password = document.getElementById('password').value;
    const role = form.querySelector('input[name="role"]:checked').value;

    // Validation
    if (password.length < 6) {
      showError(t('auth.passwordMinLength'));
      return;
    }

    setLoading(true);

    // Create user account
    const result = await authManager.signUp(email, password, displayName);

    if (result.success) {
      // Wait a moment for auth state to settle
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create user profile
      const user = authManager.getCurrentUser();
      if (user) {
        const profileResult = await authManager.updateUserProfile(user.uid, {
          role,
          companyName,
          phoneNumber,
          displayName,
          email,
          createdAt: new Date().toISOString()
        });

        if (profileResult.success) {
          window.toast.success('Account created successfully!');
          
          // Navigate based on role
          setTimeout(() => {
            if (role === 'seller') {
              router.navigate('/seller/dashboard');
            } else {
              router.navigate('/buyer/dashboard');
            }
          }, 500);
        } else {
          showError('Account created but failed to save profile');
          setLoading(false);
        }
      } else {
        showError('Account created but user not found');
        setLoading(false);
      }
    } else {
      showError(result.error || 'Failed to create account');
      setLoading(false);
    }
  });

  loginLink.addEventListener('click', (e) => {
    e.preventDefault();
    router.navigate('/login');
  });
}
