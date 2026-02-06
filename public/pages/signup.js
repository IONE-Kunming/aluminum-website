import router from '../js/router.js';
import authManager from '../js/auth.js';

export function renderSignupPage() {
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="auth-page">
      <div class="auth-container">
        <div class="auth-header">
          <h1 class="auth-logo">IONE</h1>
          <p class="auth-subtitle">AlumaTech Industries</p>
          <h2 class="auth-title">Create Account</h2>
          <p class="auth-description">Join the aluminum trading platform</p>
        </div>

        <div id="error-message" class="error-message" style="display: none;">
          <i data-lucide="alert-circle"></i>
          <span></span>
        </div>

        <form id="signup-form" class="auth-form">
          <!-- Role Selection -->
          <div class="form-group">
            <label>Account Type</label>
            <div class="role-selection">
              <label class="role-option active">
                <input
                  type="radio"
                  name="role"
                  value="buyer"
                  checked
                />
                <span>Buyer</span>
              </label>
              <label class="role-option">
                <input
                  type="radio"
                  name="role"
                  value="seller"
                />
                <span>Seller</span>
              </label>
            </div>
          </div>

          <!-- Full Name -->
          <div class="form-group">
            <label for="displayName">
              <i data-lucide="user"></i>
              Full Name
            </label>
            <input
              id="displayName"
              type="text"
              placeholder="John Doe"
              required
            />
          </div>

          <!-- Email -->
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

          <!-- Company Name -->
          <div class="form-group">
            <label for="companyName">
              <i data-lucide="building"></i>
              Company Name
            </label>
            <input
              id="companyName"
              type="text"
              placeholder="Your Company"
              required
            />
          </div>

          <!-- Phone Number -->
          <div class="form-group">
            <label for="phoneNumber">
              <i data-lucide="phone"></i>
              Phone Number
            </label>
            <input
              id="phoneNumber"
              type="tel"
              placeholder="+1 (555) 000-0000"
              required
            />
          </div>

          <!-- Password -->
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

          <!-- Confirm Password -->
          <div class="form-group">
            <label for="confirmPassword">
              <i data-lucide="lock"></i>
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" class="btn btn-primary">
            <span class="btn-text">Create Account</span>
          </button>
        </form>

        <div class="auth-footer">
          <p>
            Already have an account? 
            <a href="#" id="login-link" class="auth-link">Sign in</a>
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
      btnText.textContent = 'Creating account...';
      inputs.forEach(input => input.disabled = true);
    } else {
      submitBtn.disabled = false;
      btnText.textContent = 'Create Account';
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
    const confirmPassword = document.getElementById('confirmPassword').value;
    const role = form.querySelector('input[name="role"]:checked').value;

    // Validation
    if (password !== confirmPassword) {
      showError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      showError('Password must be at least 6 characters');
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
      window.toast.error('Failed to create account');
      setLoading(false);
    }
  });

  loginLink.addEventListener('click', (e) => {
    e.preventDefault();
    router.navigate('/login');
  });
}
