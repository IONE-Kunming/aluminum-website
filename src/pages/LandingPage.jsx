import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  ShoppingCart, 
  Store, 
  Shield, 
  Zap, 
  Users, 
  TrendingUp,
  Package,
  FileText,
  Award,
  Clock,
  CheckCircle
} from 'lucide-react';
import '../styles/LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="nav-logo">
            <h1 className="logo-text">IONE</h1>
            <span className="logo-subtitle">AlumaTech</span>
          </div>
          <div className="nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#how-it-works" className="nav-link">How It Works</a>
            <a href="#benefits" className="nav-link">Benefits</a>
            <Link to="/login" className="btn btn-secondary">Login</Link>
            <Link to="/signup" className="btn btn-primary">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Transform Your
              <span className="gradient-text"> Aluminum Trading</span>
              <br />Experience
            </h1>
            <p className="hero-description">
              Connect buyers and sellers on the most advanced aluminum trading platform. 
              Streamline operations, boost efficiency, and grow your business.
            </p>
            <div className="hero-buttons">
              <Link to="/signup" className="btn btn-primary btn-lg">
                Start Trading <ArrowRight size={20} />
              </Link>
              <a href="#how-it-works" className="btn btn-secondary btn-lg">
                Learn More
              </a>
            </div>
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-number">1000+</span>
                <span className="stat-label">Active Users</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">$50M+</span>
                <span className="stat-label">Transactions</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">99.9%</span>
                <span className="stat-label">Uptime</span>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="floating-card card-glass">
              <div className="floating-card-icon">
                <Package size={32} className="icon-float" />
              </div>
              <h3>Real-time Trading</h3>
              <p>Instant order processing and tracking</p>
            </div>
            <div className="floating-card card-glass" style={{ animationDelay: '0.2s' }}>
              <div className="floating-card-icon">
                <Shield size={32} className="icon-float" />
              </div>
              <h3>Secure Transactions</h3>
              <p>Bank-level security for all trades</p>
            </div>
            <div className="floating-card card-glass" style={{ animationDelay: '0.4s' }}>
              <div className="floating-card-icon">
                <TrendingUp size={32} className="icon-float" />
              </div>
              <h3>Analytics Dashboard</h3>
              <p>Track performance in real-time</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Powerful Features</h2>
            <p className="section-subtitle">Everything you need to succeed in aluminum trading</p>
          </div>
          <div className="features-grid">
            <div className="feature-card card card-elevated">
              <div className="feature-icon">
                <ShoppingCart size={32} className="icon-interactive" />
              </div>
              <h3 className="feature-title">Easy Ordering</h3>
              <p className="feature-description">
                Browse catalogs, compare prices, and place orders with just a few clicks.
              </p>
            </div>
            <div className="feature-card card card-elevated">
              <div className="feature-icon">
                <Store size={32} className="icon-interactive" />
              </div>
              <h3 className="feature-title">Seller Management</h3>
              <p className="feature-description">
                Manage inventory, track orders, and grow your customer base effortlessly.
              </p>
            </div>
            <div className="feature-card card card-elevated">
              <div className="feature-icon">
                <Shield size={32} className="icon-interactive" />
              </div>
              <h3 className="feature-title">Secure Platform</h3>
              <p className="feature-description">
                Enterprise-grade security protecting every transaction and data point.
              </p>
            </div>
            <div className="feature-card card card-elevated">
              <div className="feature-icon">
                <Zap size={32} className="icon-interactive" />
              </div>
              <h3 className="feature-title">Lightning Fast</h3>
              <p className="feature-description">
                Optimized performance ensuring quick load times and smooth interactions.
              </p>
            </div>
            <div className="feature-card card card-elevated">
              <div className="feature-icon">
                <FileText size={32} className="icon-interactive" />
              </div>
              <h3 className="feature-title">Invoice Management</h3>
              <p className="feature-description">
                Automated invoicing and payment tracking for seamless transactions.
              </p>
            </div>
            <div className="feature-card card card-elevated">
              <div className="feature-icon">
                <Users size={32} className="icon-interactive" />
              </div>
              <h3 className="feature-title">Multi-User Support</h3>
              <p className="feature-description">
                Role-based access for buyers, sellers, and administrators.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">Get started in three simple steps</p>
          </div>
          <div className="steps-grid">
            <div className="step-card card card-glass">
              <div className="step-number">01</div>
              <div className="step-icon">
                <Users size={40} />
              </div>
              <h3 className="step-title">Create Account</h3>
              <p className="step-description">
                Sign up and choose your role - buyer or seller. Complete your profile in minutes.
              </p>
            </div>
            <div className="step-card card card-glass">
              <div className="step-number">02</div>
              <div className="step-icon">
                <Package size={40} />
              </div>
              <h3 className="step-title">Browse or List</h3>
              <p className="step-description">
                Buyers browse catalogs, sellers list products. Connect with trading partners.
              </p>
            </div>
            <div className="step-card card card-glass">
              <div className="step-number">03</div>
              <div className="step-icon">
                <CheckCircle size={40} />
              </div>
              <h3 className="step-title">Trade Securely</h3>
              <p className="step-description">
                Complete transactions with confidence. Track orders and manage invoices easily.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="benefits-section">
        <div className="section-container">
          <div className="benefits-content">
            <div className="benefits-text">
              <h2 className="section-title">Why Choose IONE AlumaTech?</h2>
              <div className="benefits-list">
                <div className="benefit-item">
                  <div className="benefit-icon">
                    <Award size={24} />
                  </div>
                  <div className="benefit-text">
                    <h4>Industry Leading</h4>
                    <p>Trusted by top aluminum traders worldwide</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon">
                    <Clock size={24} />
                  </div>
                  <div className="benefit-text">
                    <h4>24/7 Support</h4>
                    <p>Expert assistance whenever you need it</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon">
                    <TrendingUp size={24} />
                  </div>
                  <div className="benefit-text">
                    <h4>Business Growth</h4>
                    <p>Analytics and tools to scale your operations</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon">
                    <Shield size={24} />
                  </div>
                  <div className="benefit-text">
                    <h4>Secure & Reliable</h4>
                    <p>Enterprise-grade security and 99.9% uptime</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="benefits-visual">
              <div className="benefit-card card card-elevated">
                <div className="benefit-stat">
                  <span className="benefit-stat-number">50%</span>
                  <span className="benefit-stat-label">Faster Processing</span>
                </div>
              </div>
              <div className="benefit-card card card-elevated">
                <div className="benefit-stat">
                  <span className="benefit-stat-number">90%</span>
                  <span className="benefit-stat-label">Cost Reduction</span>
                </div>
              </div>
              <div className="benefit-card card card-elevated">
                <div className="benefit-stat">
                  <span className="benefit-stat-number">100%</span>
                  <span className="benefit-stat-label">Satisfaction Rate</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-card card card-glass">
          <h2 className="cta-title">Ready to Transform Your Trading?</h2>
          <p className="cta-description">
            Join thousands of successful traders on the IONE AlumaTech platform
          </p>
          <div className="cta-buttons">
            <Link to="/signup" className="btn btn-primary btn-lg">
              Get Started Free <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-section">
              <h3 className="footer-logo">IONE AlumaTech</h3>
              <p className="footer-description">
                The premier platform for aluminum trading, connecting buyers and sellers worldwide.
              </p>
            </div>
            <div className="footer-section">
              <h4 className="footer-title">Product</h4>
              <ul className="footer-links">
                <li><a href="#features">Features</a></li>
                <li><a href="#how-it-works">How It Works</a></li>
                <li><Link to="/login">Login</Link></li>
                <li><Link to="/signup">Sign Up</Link></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4 className="footer-title">Company</h4>
              <ul className="footer-links">
                <li><a href="#about">About Us</a></li>
                <li><a href="#contact">Contact</a></li>
                <li><a href="#careers">Careers</a></li>
                <li><a href="#privacy">Privacy Policy</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4 className="footer-title">Support</h4>
              <ul className="footer-links">
                <li><a href="#help">Help Center</a></li>
                <li><a href="#docs">Documentation</a></li>
                <li><a href="#community">Community</a></li>
                <li><a href="#status">Status</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 IONE AlumaTech Industries. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
