import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { formatKES } from '../lib/format';
import { Package, Truck, CheckCircle, Clock, ChevronRight } from 'lucide-react';

export default function OrderTracking() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    let mounted = true;
    async function loadOrders() {
      try {
        const res = await api.getOrders();
        if (mounted) {
          setOrders(res.data);
        }
      } catch (err) {
        if (mounted) setError('Failed to load orders');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadOrders();
    return () => { mounted = false; };
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="text-muted" size={20} />;
      case 'processing': return <Package className="text-primary" size={20} />;
      case 'shipped': return <Truck className="text-primary" size={20} />;
      case 'delivered': return <CheckCircle className="text-success" size={20} />;
      default: return <Package size={20} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'rgba(107, 114, 128, 0.1)';
      case 'processing': return 'rgba(79, 70, 229, 0.1)';
      case 'shipped': return 'rgba(79, 70, 229, 0.1)';
      case 'delivered': return 'rgba(34, 197, 94, 0.1)';
      default: return 'var(--bg)';
    }
  };

  if (loading) return <div style={{ padding: 24, textAlign: 'center' }}>Loading orders...</div>;

  return (
    <div style={{ padding: '0 16px 80px', animation: 'fadeIn 0.5s ease' }}>
      <div className="pageCard" style={{ padding: 18, marginBottom: 24, background: 'radial-gradient(900px 420px at 20% 0%, rgba(79, 70, 229, 0.12), transparent 55%), linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.72))', border: '1px solid rgba(79,70,229,0.1)' }}>
        <h1 className="sectionTitle" style={{ margin: 0, fontSize: 24 }}>My Orders</h1>
        <p className="sectionHint">Track your purchases and deliveries</p>
      </div>

      {orders.length === 0 ? (
        <div className="pageCard" style={{ padding: 40, textAlign: 'center' }}>
          <Package size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
          <h3 className="sectionTitle">No orders yet</h3>
          <p className="sectionHint">Items you purchase will appear here.</p>
          <button className="btn btnPrimary" style={{ marginTop: 24 }} onClick={() => nav('/market')}>Start Shopping</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {orders.map((order) => (
            <div key={order.id} className="pageCard" style={{ padding: 16, borderRadius: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Order #{order.id}</div>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>Store: {order.seller_name}</div>
                </div>
                <div style={{ 
                  padding: '6px 12px', 
                  borderRadius: 12, 
                  background: getStatusColor(order.status),
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 800,
                  textTransform: 'capitalize'
                }}>
                  {getStatusIcon(order.status)}
                  {order.status}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                {order.items.map((item) => (
                  <div key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', background: 'var(--bg)' }}>
                      {item.product_image ? (
                        <img src={item.product_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</div>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{item.product_title}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>Qty: {item.quantity}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800 }}>{formatKES(item.price * item.quantity)}</div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>Total Amount</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--primary)' }}>{formatKES(order.total_price)}</div>
                </div>
                {order.tracking_number && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>Tracking</div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{order.tracking_number}</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
