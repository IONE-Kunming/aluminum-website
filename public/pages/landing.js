import router from '../js/router.js';

export function renderLandingPage() {
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="landing-page">
      <!-- Navigation -->
      <nav class="landing-nav">
        <div class="nav-container">
          <div class="nav-logo">
            <h1 class="logo-text">I ONE</h1>
            <span class="logo-subtitle">Construction</span>
          </div>
          <div class="nav-links">
            <a href="#features" class="nav-link">Features</a>
            <a href="#how-it-works" class="nav-link">How It Works</a>
            <a href="#benefits" class="nav-link">Benefits</a>
            <button class="btn btn-secondary" data-nav="login">Login</button>
            <button class="btn btn-primary" data-nav="signup">Get Started</button>
          </div>
        </div>
      </nav>

      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-content">
          <div class="hero-text">
            <h1 class="hero-title">
              Transform Your
              <span class="gradient-text"> Aluminum Trading</span>
              <br />Experience
            </h1>
            <p class="hero-description">
              Connect buyers and sellers on the most advanced aluminum trading platform. 
              Streamline operations, boost efficiency, and grow your business.
            </p>
            <div class="hero-buttons">
              <button class="btn btn-primary btn-lg" data-nav="signup">
                Start Trading <i data-lucide="arrow-right"></i>
              </button>
              <a href="#how-it-works" class="btn btn-secondary btn-lg">
                Learn More
              </a>
            </div>
            <div class="hero-stats">
              <div class="stat-item">
                <span class="stat-number">1000+</span>
                <span class="stat-label">Active Users</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">$50M+</span>
                <span class="stat-label">Transactions</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">99.9%</span>
                <span class="stat-label">Uptime</span>
              </div>
            </div>
          </div>
          <div class="hero-visual">
            <div class="floating-card card-glass">
              <div class="floating-card-icon">
                <i data-lucide="package" style="width: 32px; height: 32px;" class="icon-float"></i>
              </div>
              <h3>Real-time Trading</h3>
              <p>Instant order processing and tracking</p>
            </div>
            <div class="floating-card card-glass" style="animation-delay: 0.2s;">
              <div class="floating-card-icon">
                <i data-lucide="shield" style="width: 32px; height: 32px;" class="icon-float"></i>
              </div>
              <h3>Secure Transactions</h3>
              <p>Bank-level security for all trades</p>
            </div>
            <div class="floating-card card-glass" style="animation-delay: 0.4s;">
              <div class="floating-card-icon">
                <i data-lucide="trending-up" style="width: 32px; height: 32px;" class="icon-float"></i>
              </div>
              <h3>Analytics Dashboard</h3>
              <p>Track performance in real-time</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section id="features" class="features-section">
        <div class="section-container">
          <div class="section-header">
            <h2 class="section-title">Powerful Features</h2>
            <p class="section-subtitle">Everything you need to succeed in aluminum trading</p>
          </div>
          <div class="features-grid">
            <div class="feature-card card card-elevated">
              <div class="feature-icon">
                <i data-lucide="shopping-cart" style="width: 32px; height: 32px;" class="icon-interactive"></i>
              </div>
              <h3 class="feature-title">Easy Ordering</h3>
              <p class="feature-description">
                Browse catalogs, compare prices, and place orders with just a few clicks.
              </p>
            </div>
            <div class="feature-card card card-elevated">
              <div class="feature-icon">
                <i data-lucide="store" style="width: 32px; height: 32px;" class="icon-interactive"></i>
              </div>
              <h3 class="feature-title">Seller Management</h3>
              <p class="feature-description">
                Manage inventory, track orders, and grow your customer base effortlessly.
              </p>
            </div>
            <div class="feature-card card card-elevated">
              <div class="feature-icon">
                <i data-lucide="shield" style="width: 32px; height: 32px;" class="icon-interactive"></i>
              </div>
              <h3 class="feature-title">Secure Platform</h3>
              <p class="feature-description">
                Enterprise-grade security protecting every transaction and data point.
              </p>
            </div>
            <div class="feature-card card card-elevated">
              <div class="feature-icon">
                <i data-lucide="zap" style="width: 32px; height: 32px;" class="icon-interactive"></i>
              </div>
              <h3 class="feature-title">Lightning Fast</h3>
              <p class="feature-description">
                Optimized performance ensuring quick load times and smooth interactions.
              </p>
            </div>
            <div class="feature-card card card-elevated">
              <div class="feature-icon">
                <i data-lucide="file-text" style="width: 32px; height: 32px;" class="icon-interactive"></i>
              </div>
              <h3 class="feature-title">Invoice Management</h3>
              <p class="feature-description">
                Automated invoicing and payment tracking for seamless transactions.
              </p>
            </div>
            <div class="feature-card card card-elevated">
              <div class="feature-icon">
                <i data-lucide="users" style="width: 32px; height: 32px;" class="icon-interactive"></i>
              </div>
              <h3 class="feature-title">Multi-User Support</h3>
              <p class="feature-description">
                Role-based access for buyers, sellers, and administrators.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- How It Works Section -->
      <section id="how-it-works" class="how-it-works-section">
        <div class="section-container">
          <div class="section-header">
            <h2 class="section-title">How It Works</h2>
            <p class="section-subtitle">Get started in three simple steps</p>
          </div>
          <div class="steps-grid">
            <div class="step-card card card-glass">
              <div class="step-number">01</div>
              <div class="step-icon">
                <i data-lucide="users" style="width: 40px; height: 40px;"></i>
              </div>
              <h3 class="step-title">Create Account</h3>
              <p class="step-description">
                Sign up and choose your role - buyer or seller. Complete your profile in minutes.
              </p>
            </div>
            <div class="step-card card card-glass">
              <div class="step-number">02</div>
              <div class="step-icon">
                <i data-lucide="package" style="width: 40px; height: 40px;"></i>
              </div>
              <h3 class="step-title">Browse or List</h3>
              <p class="step-description">
                Buyers browse catalogs, sellers list products. Connect with trading partners.
              </p>
            </div>
            <div class="step-card card card-glass">
              <div class="step-number">03</div>
              <div class="step-icon">
                <i data-lucide="check-circle" style="width: 40px; height: 40px;"></i>
              </div>
              <h3 class="step-title">Trade Securely</h3>
              <p class="step-description">
                Complete transactions with confidence. Track orders and manage invoices easily.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Benefits Section -->
      <section id="benefits" class="benefits-section">
        <div class="section-container">
          <div class="benefits-content">
            <div class="benefits-text">
              <h2 class="section-title">Why Choose I ONE Construction?</h2>
              <div class="benefits-list">
                <div class="benefit-item">
                  <div class="benefit-icon">
                    <i data-lucide="award" style="width: 24px; height: 24px;"></i>
                  </div>
                  <div class="benefit-text">
                    <h4>Industry Leading</h4>
                    <p>Trusted by top aluminum traders worldwide</p>
                  </div>
                </div>
                <div class="benefit-item">
                  <div class="benefit-icon">
                    <i data-lucide="clock" style="width: 24px; height: 24px;"></i>
                  </div>
                  <div class="benefit-text">
                    <h4>24/7 Support</h4>
                    <p>Expert assistance whenever you need it</p>
                  </div>
                </div>
                <div class="benefit-item">
                  <div class="benefit-icon">
                    <i data-lucide="trending-up" style="width: 24px; height: 24px;"></i>
                  </div>
                  <div class="benefit-text">
                    <h4>Business Growth</h4>
                    <p>Analytics and tools to scale your operations</p>
                  </div>
                </div>
                <div class="benefit-item">
                  <div class="benefit-icon">
                    <i data-lucide="shield" style="width: 24px; height: 24px;"></i>
                  </div>
                  <div class="benefit-text">
                    <h4>Secure & Reliable</h4>
                    <p>Enterprise-grade security and 99.9% uptime</p>
                  </div>
                </div>
              </div>
            </div>
            <div class="benefits-visual">
              <div class="benefit-card card card-elevated">
                <div class="benefit-stat">
                  <span class="benefit-stat-number">50%</span>
                  <span class="benefit-stat-label">Faster Processing</span>
                </div>
              </div>
              <div class="benefit-card card card-elevated">
                <div class="benefit-stat">
                  <span class="benefit-stat-number">90%</span>
                  <span class="benefit-stat-label">Cost Reduction</span>
                </div>
              </div>
              <div class="benefit-card card card-elevated">
                <div class="benefit-stat">
                  <span class="benefit-stat-number">100%</span>
                  <span class="benefit-stat-label">Satisfaction Rate</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="cta-section">
        <div class="cta-card card card-glass">
          <h2 class="cta-title">Ready to Transform Your Trading?</h2>
          <p class="cta-description">
            Join thousands of successful traders on the I ONE Construction platform
          </p>
          <div class="cta-buttons">
            <button class="btn btn-primary btn-lg" data-nav="signup">
              Get Started Free <i data-lucide="arrow-right"></i>
            </button>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="landing-footer">
        <div class="footer-container">
          <div class="footer-content">
            <div class="footer-section">
              <h3 class="footer-logo">I ONE Construction</h3>
              <p class="footer-description">
                The premier platform for aluminum trading, connecting buyers and sellers worldwide.
              </p>
            </div>
            <div class="footer-section">
              <h4 class="footer-title">Product</h4>
              <ul class="footer-links">
                <li><a href="#features">Features</a></li>
                <li><a href="#how-it-works">How It Works</a></li>
                <li><button class="footer-link-btn" data-nav="login">Login</button></li>
                <li><button class="footer-link-btn" data-nav="signup">Sign Up</button></li>
              </ul>
            </div>
            <div class="footer-section">
              <h4 class="footer-title">Company</h4>
              <ul class="footer-links">
                <li><a href="#about">About Us</a></li>
                <li><a href="#contact">Contact</a></li>
                <li><a href="#careers">Careers</a></li>
                <li><a href="#privacy">Privacy Policy</a></li>
              </ul>
            </div>
            <div class="footer-section">
              <h4 class="footer-title">Support</h4>
              <ul class="footer-links">
                <li><a href="#help">Help Center</a></li>
                <li><a href="#docs">Documentation</a></li>
                <li><a href="#community">Community</a></li>
                <li><a href="#status">Status</a></li>
              </ul>
            </div>
          </div>
          <div class="footer-bottom">
            <p>&copy; 2024 I ONE Construction. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  `;

  // Add event listeners for navigation
  app.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const page = btn.getAttribute('data-nav');
      router.navigate(`/${page}`);
    });
  });

  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
}
