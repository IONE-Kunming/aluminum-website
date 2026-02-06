import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { HelpCircle, Mail, Phone, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';

const SupportPage = () => {
  const { userProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: userProfile?.displayName || '',
    email: userProfile?.email || '',
    subject: '',
    category: 'general',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Support ticket submitted successfully! We\'ll get back to you soon.');
      
      // Reset message field
      setFormData({
        ...formData,
        subject: '',
        message: ''
      });
    } catch (error) {
      console.error('Support submission error:', error);
      toast.error('Failed to submit support ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="support-page">
      <div className="page-header">
        <h1>
          <HelpCircle size={32} />
          Support & Help
        </h1>
        <p>We're here to help you with any questions or issues</p>
      </div>

      <div className="support-container">
        {/* Contact Options */}
        <div className="contact-options">
          <h2>Contact Us</h2>
          
          <div className="contact-card">
            <div className="contact-icon">
              <Mail size={24} />
            </div>
            <div className="contact-details">
              <h3>Email Support</h3>
              <p>support@ione-platform.com</p>
              <span className="text-muted">Response within 24 hours</span>
            </div>
          </div>

          <div className="contact-card">
            <div className="contact-icon">
              <Phone size={24} />
            </div>
            <div className="contact-details">
              <h3>Phone Support</h3>
              <p>+1 (800) 555-IONE</p>
              <span className="text-muted">Mon-Fri, 9AM-6PM EST</span>
            </div>
          </div>

          <div className="contact-card">
            <div className="contact-icon">
              <MessageSquare size={24} />
            </div>
            <div className="contact-details">
              <h3>Live Chat</h3>
              <p>Chat with our team</p>
              <span className="text-muted">Available during business hours</span>
            </div>
          </div>
        </div>

        {/* Support Form */}
        <div className="support-form-container">
          <h2>Submit a Support Ticket</h2>
          <p className="text-muted">Fill out the form below and we'll get back to you as soon as possible</p>

          <form onSubmit={handleSubmit} className="support-form">
            <div className="form-group">
              <label htmlFor="name">
                Full Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">
                Email Address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="general">General Inquiry</option>
                <option value="technical">Technical Support</option>
                <option value="billing">Billing & Payments</option>
                <option value="orders">Order Issues</option>
                <option value="account">Account Management</option>
                <option value="feature">Feature Request</option>
                <option value="bug">Bug Report</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="subject">
                Subject *
              </label>
              <input
                id="subject"
                name="subject"
                type="text"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Brief description of your issue"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">
                Message *
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Please provide as much detail as possible..."
                rows="6"
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              <Send size={18} />
              {loading ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </form>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="faq-section">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-grid">
          <div className="faq-item">
            <h3>How do I place an order?</h3>
            <p>Browse our catalog, add items to your cart, and proceed to checkout. You'll receive order confirmation via email.</p>
          </div>
          <div className="faq-item">
            <h3>What payment methods do you accept?</h3>
            <p>We accept credit cards, bank transfers, and purchase orders for qualified businesses.</p>
          </div>
          <div className="faq-item">
            <h3>How can I track my order?</h3>
            <p>Visit the Orders page to view real-time tracking information for all your orders.</p>
          </div>
          <div className="faq-item">
            <h3>What is your return policy?</h3>
            <p>We offer a 30-day return policy for unused products in original packaging. Contact support to initiate a return.</p>
          </div>
          <div className="faq-item">
            <h3>How do I become a seller?</h3>
            <p>Sign up with a seller account and complete the verification process. Our team will review your application within 2-3 business days.</p>
          </div>
          <div className="faq-item">
            <h3>Do you offer bulk discounts?</h3>
            <p>Yes! Contact our sales team for custom pricing on large orders.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
