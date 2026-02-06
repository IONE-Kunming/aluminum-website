import { useState } from 'react';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

// Mock cart items
const mockCartItems = [
  {
    id: 1,
    name: 'Aluminum Sheet 6061-T6',
    price: 25,
    unit: 'kg',
    quantity: 150,
    seller: 'AlumaTech Industries',
    image: '/placeholder-product.jpg'
  },
  {
    id: 2,
    name: 'Aluminum Extrusion Profile',
    price: 35,
    unit: 'unit',
    quantity: 100,
    seller: 'Metro Aluminum Co.',
    image: '/placeholder-product.jpg'
  },
  {
    id: 3,
    name: 'Aluminum Rod 2024-T4',
    price: 45,
    unit: 'kg',
    quantity: 75,
    seller: 'Premium Metals Ltd.',
    image: '/placeholder-product.jpg'
  }
];

const CartPage = () => {
  const [cartItems, setCartItems] = useState(mockCartItems);
  const navigate = useNavigate();

  const updateQuantity = (id, delta) => {
    setCartItems(items =>
      items.map(item =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const removeItem = (id) => {
    setCartItems(items => items.filter(item => item.id !== id));
    toast.success('Item removed from cart');
  };

  const calculateItemTotal = (item) => {
    return item.price * item.quantity;
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.1; // 10% tax
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    toast.success('Proceeding to checkout...');
    // Navigate to checkout or orders page
    navigate('/buyer/orders');
  };

  return (
    <div className="cart-page">
      <div className="page-header">
        <h1>
          <ShoppingCart size={32} />
          Shopping Cart
        </h1>
        <p>{cartItems.length} items in your cart</p>
      </div>

      {cartItems.length === 0 ? (
        <div className="empty-state">
          <ShoppingCart size={64} />
          <h2>Your cart is empty</h2>
          <p>Add some products to get started</p>
          <a href="/buyer/catalog" className="btn btn-primary">
            Browse Catalog
          </a>
        </div>
      ) : (
        <div className="cart-container">
          {/* Cart Items */}
          <div className="cart-items">
            {cartItems.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-image">
                  <ShoppingCart size={32} />
                </div>
                
                <div className="cart-item-details">
                  <h3>{item.name}</h3>
                  <p className="cart-item-seller">Seller: {item.seller}</p>
                  <p className="cart-item-price">${item.price}/{item.unit}</p>
                </div>

                <div className="cart-item-quantity">
                  <button 
                    className="quantity-btn"
                    onClick={() => updateQuantity(item.id, -10)}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="quantity-value">
                    {item.quantity} {item.unit}
                  </span>
                  <button 
                    className="quantity-btn"
                    onClick={() => updateQuantity(item.id, 10)}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className="cart-item-total">
                  <p className="item-total-label">Total</p>
                  <p className="item-total-value">
                    ${calculateItemTotal(item).toLocaleString()}
                  </p>
                </div>

                <button 
                  className="btn-icon btn-danger"
                  onClick={() => removeItem(item.id)}
                  title="Remove item"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="cart-summary">
            <h2>Order Summary</h2>
            
            <div className="summary-row">
              <span>Subtotal</span>
              <span>${calculateSubtotal().toLocaleString()}</span>
            </div>
            
            <div className="summary-row">
              <span>Tax (10%)</span>
              <span>${calculateTax().toLocaleString()}</span>
            </div>
            
            <div className="summary-row">
              <span>Shipping</span>
              <span className="text-muted">Calculated at checkout</span>
            </div>

            <div className="summary-divider"></div>
            
            <div className="summary-row summary-total">
              <span>Total</span>
              <span>${calculateTotal().toLocaleString()}</span>
            </div>

            <button 
              className="btn btn-primary btn-block"
              onClick={handleCheckout}
            >
              Proceed to Checkout
              <ArrowRight size={18} />
            </button>

            <a href="/buyer/catalog" className="btn btn-text btn-block">
              Continue Shopping
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
