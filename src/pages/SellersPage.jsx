import { useState } from 'react';
import { Store, Search, Mail, Phone, MapPin, Star } from 'lucide-react';
import { toast } from 'sonner';
import '../styles/Pages.css';

// Mock sellers data
const mockSellers = [
  {
    id: 1,
    name: 'AlumaTech Industries',
    description: 'Leading supplier of high-quality aluminum products with 20+ years of experience',
    email: 'contact@alumatech.com',
    phone: '+1 (555) 123-4567',
    location: 'Los Angeles, CA',
    rating: 4.8,
    totalProducts: 48,
    completedOrders: 1250,
    specialties: ['Sheets', 'Plates', 'Extrusions']
  },
  {
    id: 2,
    name: 'Metro Aluminum Co.',
    description: 'Trusted aluminum supplier specializing in custom extrusion profiles',
    email: 'sales@metroaluminum.com',
    phone: '+1 (555) 234-5678',
    location: 'Chicago, IL',
    rating: 4.6,
    totalProducts: 35,
    completedOrders: 890,
    specialties: ['Extrusions', 'Bars', 'Custom Profiles']
  },
  {
    id: 3,
    name: 'Premium Metals Ltd.',
    description: 'Premium aerospace-grade aluminum products for demanding applications',
    email: 'info@premiummetals.com',
    phone: '+1 (555) 345-6789',
    location: 'Houston, TX',
    rating: 4.9,
    totalProducts: 52,
    completedOrders: 1560,
    specialties: ['Rods', 'Aerospace Grade', 'High Strength']
  },
  {
    id: 4,
    name: 'BuildPro Metals',
    description: 'Construction and building materials specialist with competitive pricing',
    email: 'orders@buildprometals.com',
    phone: '+1 (555) 456-7890',
    location: 'Denver, CO',
    rating: 4.5,
    totalProducts: 41,
    completedOrders: 720,
    specialties: ['Coils', 'Construction', 'Roofing']
  },
  {
    id: 5,
    name: 'Industrial Aluminum Supply',
    description: 'One-stop shop for all industrial aluminum needs',
    email: 'support@industrialaluminum.com',
    phone: '+1 (555) 567-8901',
    location: 'Phoenix, AZ',
    rating: 4.7,
    totalProducts: 63,
    completedOrders: 1100,
    specialties: ['All Types', 'Bulk Orders', 'Quick Delivery']
  }
];

const SellersPage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSellers = mockSellers.filter(seller => {
    return seller.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           seller.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
           seller.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const handleContact = (seller) => {
    toast.success(`Opening contact form for ${seller.name}`);
  };

  return (
    <div className="sellers-page">
      <div className="page-header">
        <h1>
          <Store size={32} />
          Sellers Directory
        </h1>
        <p>Connect with verified aluminum suppliers</p>
      </div>

      {/* Search */}
      <div className="page-controls">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search sellers by name, specialty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Sellers Grid */}
      <div className="sellers-grid">
        {filteredSellers.map((seller) => (
          <div key={seller.id} className="seller-card">
            <div className="seller-header">
              <div className="seller-avatar">
                <Store size={32} />
              </div>
              <div className="seller-rating">
                <Star size={16} fill="#fbbf24" color="#fbbf24" />
                <span>{seller.rating}</span>
              </div>
            </div>

            <h3>{seller.name}</h3>
            <p className="seller-description">{seller.description}</p>

            <div className="seller-stats">
              <div className="stat-item">
                <span className="stat-label">Products</span>
                <span className="stat-value">{seller.totalProducts}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Orders</span>
                <span className="stat-value">{seller.completedOrders}</span>
              </div>
            </div>

            <div className="seller-specialties">
              {seller.specialties.map((specialty, index) => (
                <span key={index} className="specialty-tag">
                  {specialty}
                </span>
              ))}
            </div>

            <div className="seller-contact-info">
              <div className="contact-item">
                <MapPin size={16} />
                <span>{seller.location}</span>
              </div>
              <div className="contact-item">
                <Phone size={16} />
                <span>{seller.phone}</span>
              </div>
              <div className="contact-item">
                <Mail size={16} />
                <span>{seller.email}</span>
              </div>
            </div>

            <div className="seller-actions">
              <button 
                className="btn btn-primary btn-block"
                onClick={() => handleContact(seller)}
              >
                <Mail size={18} />
                Contact Seller
              </button>
              <a 
                href={`/buyer/catalog?seller=${seller.id}`}
                className="btn btn-secondary btn-block"
              >
                View Products
              </a>
            </div>
          </div>
        ))}
      </div>

      {filteredSellers.length === 0 && (
        <div className="empty-state">
          <Store size={48} />
          <h3>No sellers found</h3>
          <p>Try adjusting your search criteria</p>
        </div>
      )}
    </div>
  );
};

export default SellersPage;
