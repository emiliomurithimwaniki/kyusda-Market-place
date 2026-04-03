import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatKES } from '../lib/format';
import { api } from '../lib/api';

export default function Cart() {
  const { cartItems, groupedItems, updateQuantity, removeFromCart, getCartTotal, clearCart, showToast } = useCart();
  const nav = useNavigate();
  const [address, setAddress] = useState('');
  const [deliverOn, setDeliverOn] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCheckout = async (sellerId = null) => {
    if (!address.trim()) {
      setError('Please enter a delivery address');
      return;
    }

    if (!String(deliverOn || '').trim()) {
      setError('Please select a delivery date and time');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // If sellerId is provided, we only checkout items from that store
      const itemsToCheckout = sellerId 
        ? groupedItems[sellerId].items 
        : cartItems;

      await api.createOrders({
        items: itemsToCheckout,
        delivery_address: address,
        expected_delivery_at: deliverOn
      });

      // Remove checked out items from cart
      itemsToCheckout.forEach(item => removeFromCart(item.id));
      
      showToast('Order placed successfully!');
      nav('/orders'); // Redirect to the order tracking page
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🛒</div>
        <h2 className="sectionTitle">Your cart is empty</h2>
        <p className="sectionHint">Browse the marketplace to add items to your cart.</p>
        <button 
          className="btn btnPrimary" 
          style={{ marginTop: 24 }}
          onClick={() => nav('/market')}
        >
          Go to Marketplace
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 16px 80px', animation: 'fadeIn 0.5s ease' }}>
      <div className="pageCard" style={{ padding: 18, marginBottom: 24, background: 'radial-gradient(900px 420px at 20% 0%, rgba(79, 70, 229, 0.12), transparent 55%), linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.72))', border: '1px solid rgba(79,70,229,0.1)' }}>
        <h1 className="sectionTitle" style={{ margin: 0, fontSize: 24 }}>Your Cart</h1>
        <p className="sectionHint">Checkout items from different stores</p>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label className="label" style={{ fontWeight: 800, marginBottom: 8, display: 'block' }}>Delivery Address</label>
        <textarea 
          className="input" 
          placeholder="Enter your delivery address or pick up point..."
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          style={{ width: '100%', height: 100, padding: 12, borderRadius: 16 }}
        />
        {error && <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 8, fontWeight: 700 }}>{error}</p>}
      </div>

      <div style={{ marginBottom: 24 }}>
        <label className="label" style={{ fontWeight: 800, marginBottom: 8, display: 'block' }}>Deliver On</label>
        <input
          className="input"
          type="datetime-local"
          value={deliverOn}
          onChange={(e) => setDeliverOn(e.target.value)}
          style={{ width: '100%', padding: 12, borderRadius: 16 }}
        />
      </div>

      {Object.values(groupedItems).map((group) => (
        <div key={group.sellerId} className="pageCard" style={{ padding: 16, marginBottom: 20, borderRadius: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>Store: {group.sellerName}</h3>
            <button 
              className="btn btnPrimary" 
              style={{ fontSize: 12, padding: '6px 12px', borderRadius: 10 }}
              onClick={() => handleCheckout(group.sellerId)}
              disabled={loading}
            >
              Checkout from this Store
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {group.items.map((item) => (
              <div key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 60, height: 60, borderRadius: 12, overflow: 'hidden', background: 'var(--bg)' }}>
                  {item.image_url || item.image ? (
                    <img src={item.image_url || item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 2 }}>{item.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 700 }}>
                    {formatKES(item.offer_active ? item.offer_price : item.price)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button 
                    className="btn btnGhost" 
                    style={{ padding: '4px 8px', borderRadius: 8 }}
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  >-</button>
                  <span style={{ fontWeight: 800, fontSize: 14 }}>{item.quantity}</span>
                  <button 
                    className="btn btnGhost" 
                    style={{ padding: '4px 8px', borderRadius: 8 }}
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >+</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="pageCard" style={{ padding: 20, position: 'sticky', bottom: 10, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', boxShadow: '0 -10px 30px rgba(0,0,0,0.05)', borderRadius: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--muted)' }}>Total Amount</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)' }}>{formatKES(getCartTotal())}</div>
        </div>
        <button 
          className="btn btnPrimary" 
          style={{ width: '100%', padding: '14px', borderRadius: 16, fontSize: 16, fontWeight: 900 }}
          onClick={() => handleCheckout()}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Checkout All Stores'}
        </button>
      </div>
    </div>
  );
}
