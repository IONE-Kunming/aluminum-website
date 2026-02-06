import router from '../js/router.js';
import languageManager from '../js/language.js';

export function renderLandingPage() {
  const app = document.getElementById('app');
  const t = languageManager.t.bind(languageManager);
  
  app.innerHTML = `
    <div class="landing-page">
      <!-- Navigation -->
      <nav class="landing-nav">
        <div class="nav-container">
          <div class="nav-logo">
            <img src="/aluminum-website/logo.svg" alt="I ONE Construction" class="logo-image" />
          </div>
          <div class="nav-links">
            <a href="#features" class="nav-link">${t('landing.nav.features')}</a>
            <a href="#how-it-works" class="nav-link">${t('landing.nav.howItWorks')}</a>
            <a href="#benefits" class="nav-link">${t('landing.nav.benefits')}</a>
            <div class="language-dropdown">
              <button class="btn btn-secondary language-dropdown-btn" id="landing-language-toggle">
                ${t('languages.' + languageManager.getLanguage())}
                <i data-lucide="chevron-down" style="width: 16px; height: 16px;"></i>
              </button>
              <div class="language-dropdown-menu" id="landing-language-menu">
                <button class="language-option" data-lang="en">${t('languages.en')}</button>
                <button class="language-option" data-lang="ar">${t('languages.ar')}</button>
                <button class="language-option" data-lang="zh">${t('languages.zh')}</button>
              </div>
            </div>
            <button class="btn btn-secondary" data-nav="login">${t('landing.nav.login')}</button>
            <button class="btn btn-primary" data-nav="signup">${t('landing.nav.getStarted')}</button>
          </div>
        </div>
      </nav>

      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-content">
          <div class="hero-text">
            <h1 class="hero-title">
              ${t('landing.hero.title')}
              <span class="gradient-text"> ${t('landing.hero.titleHighlight')}</span>
              <br />${t('landing.hero.titleEnd')}
            </h1>
            <p class="hero-description">
              ${t('landing.hero.description')}
            </p>
            <div class="hero-buttons">
              <button class="btn btn-primary btn-lg" data-nav="signup">
                ${t('landing.hero.startTrading')} <i data-lucide="arrow-right"></i>
              </button>
              <a href="#how-it-works" class="btn btn-secondary btn-lg">
                ${t('landing.hero.learnMore')}
              </a>
            </div>
            <div class="hero-stats">
              <div class="stat-item">
                <span class="stat-number">1000+</span>
                <span class="stat-label">${t('landing.hero.stats.activeUsers')}</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">$50M+</span>
                <span class="stat-label">${t('landing.hero.stats.transactions')}</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">99.9%</span>
                <span class="stat-label">${t('landing.hero.stats.uptime')}</span>
              </div>
            </div>
          </div>
          <div class="hero-visual">
            <div class="floating-card card-glass">
              <div class="floating-card-icon">
                <i data-lucide="package" style="width: 32px; height: 32px;" class="icon-float"></i>
              </div>
              <h3>${t('landing.hero.cards.realtime.title')}</h3>
              <p>${t('landing.hero.cards.realtime.description')}</p>
            </div>
            <div class="floating-card card-glass" style="animation-delay: 0.2s;">
              <div class="floating-card-icon">
                <i data-lucide="shield" style="width: 32px; height: 32px;" class="icon-float"></i>
              </div>
              <h3>${t('landing.hero.cards.secure.title')}</h3>
              <p>${t('landing.hero.cards.secure.description')}</p>
            </div>
            <div class="floating-card card-glass" style="animation-delay: 0.4s;">
              <div class="floating-card-icon">
                <i data-lucide="trending-up" style="width: 32px; height: 32px;" class="icon-float"></i>
              </div>
              <h3>${t('landing.hero.cards.analytics.title')}</h3>
              <p>${t('landing.hero.cards.analytics.description')}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section id="features" class="features-section">
        <div class="section-container">
          <div class="section-header">
            <h2 class="section-title">${t('landing.features.title')}</h2>
            <p class="section-subtitle">${t('landing.features.subtitle')}</p>
          </div>
          <div class="features-grid">
            <div class="feature-card card card-elevated">
              <div class="feature-icon">
                <i data-lucide="shopping-cart" style="width: 32px; height: 32px;" class="icon-interactive"></i>
              </div>
              <h3 class="feature-title">${t('landing.features.easyOrdering.title')}</h3>
              <p class="feature-description">
                ${t('landing.features.easyOrdering.description')}
              </p>
            </div>
            <div class="feature-card card card-elevated">
              <div class="feature-icon">
                <i data-lucide="store" style="width: 32px; height: 32px;" class="icon-interactive"></i>
              </div>
              <h3 class="feature-title">${t('landing.features.sellerManagement.title')}</h3>
              <p class="feature-description">
                ${t('landing.features.sellerManagement.description')}
              </p>
            </div>
            <div class="feature-card card card-elevated">
              <div class="feature-icon">
                <i data-lucide="shield" style="width: 32px; height: 32px;" class="icon-interactive"></i>
              </div>
              <h3 class="feature-title">${t('landing.features.securePlatform.title')}</h3>
              <p class="feature-description">
                ${t('landing.features.securePlatform.description')}
              </p>
            </div>
            <div class="feature-card card card-elevated">
              <div class="feature-icon">
                <i data-lucide="zap" style="width: 32px; height: 32px;" class="icon-interactive"></i>
              </div>
              <h3 class="feature-title">${t('landing.features.lightningFast.title')}</h3>
              <p class="feature-description">
                ${t('landing.features.lightningFast.description')}
              </p>
            </div>
            <div class="feature-card card card-elevated">
              <div class="feature-icon">
                <i data-lucide="file-text" style="width: 32px; height: 32px;" class="icon-interactive"></i>
              </div>
              <h3 class="feature-title">${t('landing.features.invoiceManagement.title')}</h3>
              <p class="feature-description">
                ${t('landing.features.invoiceManagement.description')}
              </p>
            </div>
            <div class="feature-card card card-elevated">
              <div class="feature-icon">
                <i data-lucide="users" style="width: 32px; height: 32px;" class="icon-interactive"></i>
              </div>
              <h3 class="feature-title">${t('landing.features.multiUser.title')}</h3>
              <p class="feature-description">
                ${t('landing.features.multiUser.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- How It Works Section -->
      <section id="how-it-works" class="how-it-works-section">
        <div class="section-container">
          <div class="section-header">
            <h2 class="section-title">${t('landing.howItWorks.title')}</h2>
            <p class="section-subtitle">${t('landing.howItWorks.subtitle')}</p>
          </div>
          <div class="steps-grid">
            <div class="step-card card card-glass">
              <div class="step-number">01</div>
              <div class="step-icon">
                <i data-lucide="users" style="width: 40px; height: 40px;"></i>
              </div>
              <h3 class="step-title">${t('landing.howItWorks.step1.title')}</h3>
              <p class="step-description">
                ${t('landing.howItWorks.step1.description')}
              </p>
            </div>
            <div class="step-card card card-glass">
              <div class="step-number">02</div>
              <div class="step-icon">
                <i data-lucide="package" style="width: 40px; height: 40px;"></i>
              </div>
              <h3 class="step-title">${t('landing.howItWorks.step2.title')}</h3>
              <p class="step-description">
                ${t('landing.howItWorks.step2.description')}
              </p>
            </div>
            <div class="step-card card card-glass">
              <div class="step-number">03</div>
              <div class="step-icon">
                <i data-lucide="check-circle" style="width: 40px; height: 40px;"></i>
              </div>
              <h3 class="step-title">${t('landing.howItWorks.step3.title')}</h3>
              <p class="step-description">
                ${t('landing.howItWorks.step3.description')}
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
              <h2 class="section-title">${t('landing.benefits.title')}</h2>
              <div class="benefits-list">
                <div class="benefit-item">
                  <div class="benefit-icon">
                    <i data-lucide="award" style="width: 24px; height: 24px;"></i>
                  </div>
                  <div class="benefit-text">
                    <h4>${t('landing.benefits.industryLeading.title')}</h4>
                    <p>${t('landing.benefits.industryLeading.description')}</p>
                  </div>
                </div>
                <div class="benefit-item">
                  <div class="benefit-icon">
                    <i data-lucide="clock" style="width: 24px; height: 24px;"></i>
                  </div>
                  <div class="benefit-text">
                    <h4>${t('landing.benefits.support247.title')}</h4>
                    <p>${t('landing.benefits.support247.description')}</p>
                  </div>
                </div>
                <div class="benefit-item">
                  <div class="benefit-icon">
                    <i data-lucide="trending-up" style="width: 24px; height: 24px;"></i>
                  </div>
                  <div class="benefit-text">
                    <h4>${t('landing.benefits.businessGrowth.title')}</h4>
                    <p>${t('landing.benefits.businessGrowth.description')}</p>
                  </div>
                </div>
                <div class="benefit-item">
                  <div class="benefit-icon">
                    <i data-lucide="shield" style="width: 24px; height: 24px;"></i>
                  </div>
                  <div class="benefit-text">
                    <h4>${t('landing.benefits.secureReliable.title')}</h4>
                    <p>${t('landing.benefits.secureReliable.description')}</p>
                  </div>
                </div>
              </div>
            </div>
            <div class="benefits-visual">
              <div class="benefit-card card card-elevated">
                <div class="benefit-stat">
                  <span class="benefit-stat-number">50%</span>
                  <span class="benefit-stat-label">${t('landing.benefits.stats.fasterProcessing')}</span>
                </div>
              </div>
              <div class="benefit-card card card-elevated">
                <div class="benefit-stat">
                  <span class="benefit-stat-number">90%</span>
                  <span class="benefit-stat-label">${t('landing.benefits.stats.costReduction')}</span>
                </div>
              </div>
              <div class="benefit-card card card-elevated">
                <div class="benefit-stat">
                  <span class="benefit-stat-number">100%</span>
                  <span class="benefit-stat-label">${t('landing.benefits.stats.satisfactionRate')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="cta-section">
        <div class="cta-card card card-glass">
          <h2 class="cta-title">${t('landing.cta.title')}</h2>
          <p class="cta-description">
            ${t('landing.cta.description')}
          </p>
          <div class="cta-buttons">
            <button class="btn btn-primary btn-lg" data-nav="signup">
              ${t('landing.cta.getStarted')} <i data-lucide="arrow-right"></i>
            </button>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="landing-footer">
        <div class="footer-container">
          <div class="footer-content">
            <div class="footer-section">
              <h3 class="footer-logo">${t('landing.footer.companyName')}</h3>
              <p class="footer-description">
                ${t('landing.footer.description')}
              </p>
            </div>
            <div class="footer-section">
              <h4 class="footer-title">${t('landing.footer.product')}</h4>
              <ul class="footer-links">
                <li><a href="#features">${t('landing.nav.features')}</a></li>
                <li><a href="#how-it-works">${t('landing.nav.howItWorks')}</a></li>
                <li><button class="footer-link-btn" data-nav="login">${t('landing.nav.login')}</button></li>
                <li><button class="footer-link-btn" data-nav="signup">${t('auth.signup')}</button></li>
              </ul>
            </div>
            <div class="footer-section">
              <h4 class="footer-title">${t('landing.footer.company')}</h4>
              <ul class="footer-links">
                <li><a href="#about">${t('landing.footer.aboutUs')}</a></li>
                <li><a href="#contact">${t('landing.footer.contact')}</a></li>
                <li><a href="#careers">${t('landing.footer.careers')}</a></li>
                <li><a href="#privacy">${t('landing.footer.privacyPolicy')}</a></li>
              </ul>
            </div>
            <div class="footer-section">
              <h4 class="footer-title">${t('landing.footer.support')}</h4>
              <ul class="footer-links">
                <li><a href="#help">${t('landing.footer.helpCenter')}</a></li>
                <li><a href="#docs">${t('landing.footer.documentation')}</a></li>
                <li><a href="#community">${t('landing.footer.community')}</a></li>
                <li><a href="#status">${t('landing.footer.status')}</a></li>
              </ul>
            </div>
          </div>
          <div class="footer-bottom">
            <p>${t('landing.footer.copyright')}</p>
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

  // Language dropdown toggle
  const langToggle = document.getElementById('landing-language-toggle');
  const langMenu = document.getElementById('landing-language-menu');
  
  if (langToggle && langMenu) {
    langToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      langMenu.classList.toggle('active');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      langMenu.classList.remove('active');
    });

    // Language selection
    langMenu.querySelectorAll('.language-option').forEach(option => {
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        const lang = option.getAttribute('data-lang');
        languageManager.setLanguage(lang);
      });
    });
  }

  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
}
