import { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard.jsx';
import { api } from '../lib/api.js';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const nav = useNavigate();
  const [tab, setTab] = useState('products');
  const [me, setMe] = useState(null);
  const [products, setProducts] = useState([]);
  const [receivedOrders, setReceivedOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(null);
  const [savingOrderId, setSavingOrderId] = useState(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderTimingFilter, setOrderTimingFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [deletingId, setDeletingId] = useState(null);

  const handleDeleteProduct = async (product) => {
    if (!product?.id) return;
    const ok = window.confirm(`Delete "${product?.title || 'this product'}"? This cannot be undone.`);
    if (!ok) return;

    setDeletingId(product.id);
    try {
      await api.deleteProduct(product.id);
      setProducts((prev) => (prev || []).filter((p) => p.id !== product.id));
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.me();
        if (!alive) return;
        setMe(data);

        const productsRes = await api.getProducts({ sellerId: data.id });
        if (alive) {
          const payload = productsRes?.data;
          const results = Array.isArray(payload?.results) ? payload.results : (Array.isArray(payload) ? payload : []);
          setProducts(results);
        }
      } catch {
        if (alive) {
          setError('Unable to load data. Please check your internet connection and try again.');
          setMe(null);
          setProducts([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const refreshMyProducts = async () => {
    if (!me?.id) return;
    try {
      const productsRes = await api.getProducts({ sellerId: me.id });
      const payload = productsRes?.data;
      const results = Array.isArray(payload?.results) ? payload.results : (Array.isArray(payload) ? payload : []);
      setProducts(results);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!me?.id) return;
      if (tab !== 'orders') return;
      setOrdersLoading(true);
      setOrdersError(null);
      try {
        const res = await api.getOrders();
        const list = Array.isArray(res?.data) ? res.data : (res?.data?.results || []);
        const mine = list.filter((o) => String(o?.seller) === String(me?.id));
        if (alive) setReceivedOrders(mine);
      } catch {
        if (alive) {
          setOrdersError('Unable to load received orders.');
          setReceivedOrders([]);
        }
      } finally {
        if (alive) setOrdersLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [tab, me?.id]);

  const updateReceivedOrder = async (orderId, patch) => {
    setSavingOrderId(orderId);
    try {
      const res = await api.updateOrderStatus(orderId, patch);
      const next = res?.data;
      setReceivedOrders((prev) => prev.map((o) => (o.id === orderId ? next : o)));
    } catch {
      // ignore
    } finally {
      setSavingOrderId(null);
    }
  };

  const formatKES = (v) => {
    const n = Number(v);
    if (Number.isNaN(n)) return '';
    return `KSh ${n.toLocaleString('en-KE')}`;
  };

  const statusLabel = (s) => {
    switch (String(s || '').toLowerCase()) {
      case 'pending': return 'Pending';
      case 'processing': return 'Processing';
      case 'shipped': return 'Shipped';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return String(s || 'Unknown');
    }
  };

  const statusTone = (s) => {
    const v = String(s || '').toLowerCase();
    if (v === 'delivered') return { bg: 'rgba(22,163,74,0.10)', br: 'rgba(22,163,74,0.25)', fg: 'var(--success)' };
    if (v === 'shipped') return { bg: 'rgba(37,99,235,0.10)', br: 'rgba(37,99,235,0.20)', fg: '#2563eb' };
    if (v === 'processing') return { bg: 'rgba(124,58,237,0.10)', br: 'rgba(124,58,237,0.20)', fg: 'var(--primary-2)' };
    if (v === 'cancelled') return { bg: 'rgba(239,68,68,0.10)', br: 'rgba(239,68,68,0.22)', fg: 'var(--danger)' };
    return { bg: 'rgba(107,114,128,0.10)', br: 'rgba(107,114,128,0.20)', fg: 'var(--muted)' };
  };

  const filteredReceivedOrders = (receivedOrders || []).filter((o) => {
    if (orderStatusFilter !== 'all' && String(o?.status) !== String(orderStatusFilter)) return false;

    const hasSchedule = !!o?.expected_delivery_at;
    if (orderTimingFilter === 'scheduled' && !hasSchedule) return false;
    if (orderTimingFilter === 'unscheduled' && hasSchedule) return false;
    if (orderTimingFilter === 'today' && hasSchedule) {
      const d = new Date(o.expected_delivery_at);
      const now = new Date();
      const sameDay = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
      if (!sameDay) return false;
    }
    if (orderTimingFilter === 'today' && !hasSchedule) return false;

    return true;
  });

  const [boostingId, setBoostingId] = useState(null);

  async function boostProduct(product) {
    setBoostingId(product.id);
    try {
      // await api.boostProduct(product.id);
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert(`Boost active for: ${product.title}`);
    } catch (err) {
      alert('Failed to boost product');
    } finally {
      setBoostingId(null);
    }
  }

  return (
    <div>
      <div className="sectionHeader">
        <div className="sectionTitle">Dashboard</div>
        <div className="sectionHint">My activity</div>
      </div>

      {loading ? null : error ? (
        <div className="pageCard" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📶</div>
          <div className="sectionTitle">Network Error</div>
          <div className="sectionHint">{error}</div>
        </div>
      ) : !me ? (
        <div className="pageCard" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>👤</div>
          <div className="sectionTitle">No information</div>
          <div className="sectionHint">Login to view your dashboard.</div>
        </div>
      ) : (

        <div>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', marginBottom: 12 }}>
            <div className="card">
              <div className="cardBody">
                <div className="cardTitle">Earnings</div>
                <div className="price">{typeof me?.earnings !== 'undefined' ? formatKES(me.earnings) : '-'}</div>
              </div>
            </div>
            <div className="card">
              <div className="cardBody">
                <div className="cardTitle">Orders</div>
                <div className="price">-</div>
              </div>
            </div>
          </div>

          <div className="pillRow" style={{ marginTop: 0 }}>
            <button type="button" className={`pill ${tab === 'products' ? 'pillActive' : ''}`} onClick={() => setTab('products')}>My Products</button>
            <button type="button" className={`pill ${tab === 'orders' ? 'pillActive' : ''}`} onClick={() => setTab('orders')}>Received Orders</button>
            <button type="button" className={`pill ${tab === 'messages' ? 'pillActive' : ''}`} onClick={() => setTab('messages')}>Messages</button>
          </div>

          <div className="pageCard">
            {tab === 'products' && (
              <div>
                <div className="sectionTitle" style={{ marginBottom: 8 }}>My Products</div>
                <div style={{ color: 'var(--muted)', fontSize: 13 }}>You have {products.length} active listings.</div>

                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btnGhost" onClick={refreshMyProducts} style={{ padding: '8px 12px', borderRadius: 12 }}>
                    Refresh
                  </button>
                </div>

                <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                  {products.length === 0 ? (
                    <div className="pageCard" style={{ textAlign: 'center', padding: '60px 20px', gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: 48, marginBottom: 16 }}>🗂️</div>
                      <div className="sectionTitle">No information</div>
                      <div className="sectionHint">There are no products to show on this page.</div>
                    </div>
                  ) : products.map((p) => (
                    <div key={p.id} style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 2, display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div style={{
                          padding: '6px 10px',
                          borderRadius: 999,
                          border: '1px solid var(--border)',
                          background: 'rgba(255,255,255,0.9)',
                          fontSize: 11,
                          fontWeight: 900,
                          color: 'var(--muted)'
                        }}>
                          Stock: <span style={{ color: 'var(--text)' }}>{Number.isFinite(Number(p?.stock)) ? Number(p.stock) : (p?.stock ?? '—')}</span>
                        </div>

                        <button
                          type="button"
                          className="btn btnGhost"
                          style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 12, height: 38 }}
                          onClick={() => nav(`/product/${p.id}/edit`)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btnGhost"
                          style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 12, height: 38, color: 'var(--danger)' }}
                          onClick={() => handleDeleteProduct(p)}
                          disabled={deletingId === p.id}
                        >
                          {deletingId === p.id ? 'Deleting…' : 'Delete'}
                        </button>

                        <button 
                          type="button" 
                          className="btn btnGhost" 
                          style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 12, height: 38, minWidth: 70 }} 
                          onClick={() => boostProduct(p)}
                          disabled={boostingId === p.id}
                        >
                          {boostingId === p.id ? '⌛' : 'Boost'}
                        </button>
                      </div>
                      <ProductCard product={p} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tab === 'orders' && (
              <div>
                <div className="sectionTitle" style={{ marginBottom: 8 }}>Received Orders</div>
                <div style={{ color: 'var(--muted)', fontSize: 13 }}>Manage orders customers placed on your products.</div>

                <div className="pageCard" style={{ marginTop: 14, padding: 12, borderRadius: 18 }}>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--muted)', letterSpacing: 0.6, textTransform: 'uppercase' }}>Filters</div>

                    <select
                      className="input"
                      value={orderStatusFilter}
                      onChange={(e) => setOrderStatusFilter(e.target.value)}
                      style={{ padding: '8px 10px', borderRadius: 12, height: 40, minWidth: 170 }}
                    >
                      <option value="all">All statuses</option>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>

                    <select
                      className="input"
                      value={orderTimingFilter}
                      onChange={(e) => setOrderTimingFilter(e.target.value)}
                      style={{ padding: '8px 10px', borderRadius: 12, height: 40, minWidth: 190 }}
                    >
                      <option value="all">All delivery times</option>
                      <option value="scheduled">Scheduled delivery</option>
                      <option value="unscheduled">No delivery time</option>
                      <option value="today">Delivering today</option>
                    </select>

                    <button
                      type="button"
                      className="btn btnGhost"
                      onClick={() => {
                        setOrderStatusFilter('all');
                        setOrderTimingFilter('all');
                      }}
                      style={{ padding: '8px 12px', borderRadius: 12, height: 40 }}
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {ordersLoading ? (
                  <div style={{ padding: 16, color: 'var(--muted)' }}>Loading...</div>
                ) : ordersError ? (
                  <div style={{ padding: 16, color: 'var(--danger)', fontWeight: 700 }}>{ordersError}</div>
                ) : filteredReceivedOrders.length === 0 ? (
                  <div className="pageCard" style={{ textAlign: 'center', padding: '50px 20px', marginTop: 16 }}>
                    <div style={{ fontSize: 44, marginBottom: 12 }}>🧾</div>
                    <div className="sectionTitle">No orders found</div>
                    <div className="sectionHint">Try changing filters or wait for new orders.</div>
                  </div>
                ) : (
                  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {filteredReceivedOrders.map((o) => {
                      const preview = o?.items?.[0] || null;
                      const tone = statusTone(o?.status);

                      return (
                        <div
                          key={o.id}
                          className="pageCard"
                          style={{
                            padding: 14,
                            borderRadius: 20,
                            border: `1px solid ${tone.br}`,
                            background: `radial-gradient(900px 420px at 10% 0%, rgba(79, 70, 229, 0.10), transparent 52%), linear-gradient(180deg, rgba(255,255,255,0.88), rgba(255,255,255,0.72))`,
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', minWidth: 0 }}>
                              <div style={{ width: 72, height: 72, borderRadius: 18, overflow: 'hidden', background: 'var(--bg)', border: `1px solid ${tone.br}`, flex: '0 0 auto' }}>
                                {preview?.product_image ? (
                                  <img src={preview.product_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}>📦</div>
                                )}
                              </div>

                              <div style={{ minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                  <div style={{ fontWeight: 950, letterSpacing: -0.3 }}>Order #{o.id}</div>
                                  <div style={{
                                    padding: '5px 10px',
                                    borderRadius: 999,
                                    border: `1px solid ${tone.br}`,
                                    background: tone.bg,
                                    color: tone.fg,
                                    fontSize: 11,
                                    fontWeight: 900,
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.5,
                                  }}>
                                    {statusLabel(o.status)}
                                  </div>
                                </div>

                                <div style={{ marginTop: 6, fontSize: 13, fontWeight: 850, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 520 }}>
                                  {preview?.product_title || 'Item'}
                                </div>

                                <div style={{ marginTop: 4, fontSize: 12, color: 'var(--muted)', fontWeight: 750 }}>
                                  {preview?.price ? formatKES(preview.price) : ''}
                                </div>

                                <div style={{ marginTop: 8, display: 'grid', gap: 4 }}>
                                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                                    Buyer: <strong style={{ color: 'var(--text)' }}>{o.customer_name || '—'}</strong>
                                    {o.customer_phone ? ` • ${o.customer_phone}` : ''}
                                  </div>
                                  {o.expected_delivery_at ? (
                                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                                      Deliver on: <strong style={{ color: 'var(--text)' }}>{new Date(o.expected_delivery_at).toLocaleString()}</strong>
                                    </div>
                                  ) : (
                                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                                      Deliver on: <strong style={{ color: 'var(--text)' }}>Not set</strong>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                              {o.customer_phone ? (
                                <a className="btn btnPrimary" href={`tel:${o.customer_phone}`} style={{ padding: '8px 12px', borderRadius: 12, height: 40 }}>
                                  Call
                                </a>
                              ) : null}

                              <select
                                className="input"
                                value={o.status}
                                onChange={(e) => updateReceivedOrder(o.id, { status: e.target.value })}
                                disabled={savingOrderId === o.id}
                                style={{ padding: '8px 10px', borderRadius: 12, height: 40 }}
                              >
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </div>
                          </div>

                          <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
                            {o.delivery_address ? (
                              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                                Address: <strong style={{ color: 'var(--text)' }}>{o.delivery_address}</strong>
                              </div>
                            ) : null}

                            <input
                              className="input"
                              placeholder="Tracking number"
                              defaultValue={o.tracking_number || ''}
                              onBlur={(e) => {
                                const v = String(e.target.value || '').trim();
                                if (v === String(o.tracking_number || '').trim()) return;
                                updateReceivedOrder(o.id, { tracking_number: v });
                              }}
                              disabled={savingOrderId === o.id}
                              style={{ padding: '10px 12px', borderRadius: 14, height: 44 }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {tab === 'messages' && (
              <div>
                <div className="sectionTitle" style={{ marginBottom: 8 }}>Messages</div>
                <div style={{ color: 'var(--muted)', fontSize: 13 }}>No information</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
