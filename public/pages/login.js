import router from '../js/router.js';
import authManager from '../js/auth.js';

export function renderLoginPage() {
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="auth-page">
      <div class="auth-container">
        <div class="auth-header">
          <h1 class="auth-logo">IONE</h1>
          <p class="auth-subtitle">AlumaTech Industries</p>
          <h2 class="auth-title">Welcome Back</h2>
          <p class="auth-description">Sign in to access your account</p>
        </div>

        <div id="error-message" class="error-message" style="display: none;">
          <i data-lucide="alert-circle"></i>
          <span></span>
        </div>

        <form id="login-form" class="auth-form">
          <div class="form-group">
            <label for="email">
              <i data-lucide="mail"></i>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="your@email.com"
              required
            />
          </div>

          <div class="form-group">
            <label for="password">
              <i data-lucide="lock"></i>
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" class="btn btn-primary">
            <span class="btn-text">Sign In</span>
          </button>
        </form>

        <div class="auth-divider">
          <span>OR</span>
        </div>

        <button id="google-signin-btn" type="button" class="btn btn-google">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
            <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.18L12.05 13.56c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9.003 18z" fill="#34A853"/>
            <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.003 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div class="auth-footer">
          <p>
            Don't have an account? 
            <a href="#" id="signup-link" class="auth-link">Sign up</a>
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
      btnText.textContent = 'Signing in...';
      emailInput.disabled = true;
      passwordInput.disabled = true;
    } else {
      submitBtn.disabled = false;
      googleBtn.disabled = false;
      btnText.textContent = 'Sign In';
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
      
      // Wait a moment for profile to load
      setTimeout(() => {
        const profile = authManager.getUserProfile();
        if (profile?.role === 'seller') {
          router.navigate('/seller/dashboard');
        } else if (profile?.role === 'buyer') {
          router.navigate('/buyer/dashboard');
        } else {
          router.navigate('/profile-selection');
        }
      }, 500);
    } else {
      showError(result.error || 'Failed to login. Please check your credentials.');
      window.toast.error('Failed to login');
      setLoading(false);
    }
  });

  googleBtn.addEventListener('click', async () => {
    hideError();
    setLoading(true);

    const result = await authManager.signInWithGoogle();

    if (result.success) {
      window.toast.success('Successfully logged in with Google!');
      
      setTimeout(() => {
        const profile = authManager.getUserProfile();
        if (profile?.role) {
          if (profile.role === 'seller') {
            router.navigate('/seller/dashboard');
          } else {
            router.navigate('/buyer/dashboard');
          }
        } else {
          router.navigate('/profile-selection');
        }
      }, 500);
    } else {
      showError(result.error || 'Failed to sign in with Google.');
      window.toast.error('Failed to sign in with Google');
      setLoading(false);
    }
  });

  signupLink.addEventListener('click', (e) => {
    e.preventDefault();
    router.navigate('/signup');
  });
}
