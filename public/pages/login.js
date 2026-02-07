import router from '../js/router.js';
import authManager from '../js/auth.js';
import languageManager from '../js/language.js';

export function renderLoginPage() {
  const app = document.getElementById('app');
  const t = languageManager.t.bind(languageManager);
  
  app.innerHTML = `
    <div class="auth-page">
      <div class="auth-container">
        <div class="auth-header">
          <img src="/logo.svg" alt="I ONE Construction" class="auth-logo-image" />
          <h2 class="auth-title">${t('auth.welcomeBack')}</h2>
          <p class="auth-description">${t('auth.signInDescription')}</p>
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

        <form id="login-form" class="auth-form">
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
            <span class="btn-text">${t('auth.signIn')}</span>
          </button>
        </form>

        <div class="auth-divider">
          <span>${t('common.or')}</span>
        </div>

        <button id="google-signin-btn" type="button" class="btn btn-google">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
            <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.18L12.05 13.56c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9.003 18z" fill="#34A853"/>
            <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.003 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
          </svg>
          ${t('auth.continueWithGoogle')}
        </button>

        <div class="auth-footer">
          <p>
            ${t('auth.dontHaveAccount')}
            <a href="#" id="signup-link" class="auth-link">${t('auth.signup')}</a>
          </p>
        </div>
      </div>
    </div>
  `;

  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  const form = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const errorDiv = document.getElementById('error-message');
  const googleBtn = document.getElementById('google-signin-btn');
  const signupLink = document.getElementById('signup-link');
  
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
    
    if (isLoading) {
      submitBtn.disabled = true;
      googleBtn.disabled = true;
      btnText.textContent = t('common.loading');
      emailInput.disabled = true;
      passwordInput.disabled = true;
    } else {
      submitBtn.disabled = false;
      googleBtn.disabled = false;
      btnText.textContent = t('auth.signIn');
      emailInput.disabled = false;
      passwordInput.disabled = false;
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    setLoading(true);

    const email = emailInput.value;
    const password = passwordInput.value;

    const result = await authManager.signIn(email, password);

    if (result.success) {
      window.toast.success('Successfully logged in!');
      
      // Wait for profile to load before navigation
      const profile = await authManager.waitForProfile();
      
      if (profile?.role === 'seller') {
        router.navigate('/seller/dashboard');
      } else if (profile?.role === 'buyer') {
        router.navigate('/buyer/dashboard');
      } else {
        router.navigate('/profile-selection');
      }
    } else {
      showError(result.error || 'Failed to login. Please check your credentials.');
      setLoading(false);
    }
  });

  googleBtn.addEventListener('click', async () => {
    hideError();
    setLoading(true);

    const result = await authManager.signInWithGoogle();

    if (result.success) {
      window.toast.success('Successfully logged in with Google!');
      
      // Wait for profile to load before navigation
      const profile = await authManager.waitForProfile();
      
      if (profile?.role === 'seller') {
        router.navigate('/seller/dashboard');
      } else if (profile?.role === 'buyer') {
        router.navigate('/buyer/dashboard');
      } else {
        router.navigate('/profile-selection');
      }
    } else {
      showError(result.error || 'Failed to sign in with Google.');
      setLoading(false);
    }
  });

  signupLink.addEventListener('click', (e) => {
    e.preventDefault();
    router.navigate('/signup');
  });
}
