import { useEffect, useState } from 'react';
import { api } from '../lib/api';

function formatWhen(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await api.getNotifications();
        if (!alive) return;
        setItems(Array.isArray(res?.data) ? res.data : (res?.data?.results || []));
      } catch {
        if (!alive) return;
        setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const markRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch {
      // ignore
    }
  };

  return (
    <div style={{ padding: '0 16px 80px', animation: 'fadeIn 0.5s ease' }}>
      <div className="pageCard" style={{ padding: 18, marginBottom: 16 }}>
        <div className="sectionTitle" style={{ margin: 0 }}>Notifications</div>
        <div className="sectionHint">Order updates and activity</div>
      </div>

      {loading ? (
        <div className="pageCard" style={{ padding: 18 }}>Loading...</div>
      ) : items.length === 0 ? (
        <div className="pageCard" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔔</div>
          <div className="sectionTitle">No notifications</div>
          <div className="sectionHint">You’ll see new order alerts here.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map((n) => {
            const buyerName = n?.data?.buyer_name || n?.actor_name || 'Someone';
            const buyerPhone = n?.data?.buyer_phone || n?.actor_phone || '';
            const deliveryAt = n?.data?.expected_delivery_at || '';
            const deliveryAddress = n?.data?.delivery_address || '';
            const productTitle = n?.data?.product_title || '';
            const productPrice = n?.data?.product_price || '';

            return (
              <div key={n.id} className="pageCard" style={{ padding: 16, borderRadius: 18, opacity: n.is_read ? 0.85 : 1 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 54, height: 54, borderRadius: 14, overflow: 'hidden', background: 'var(--bg)', border: '1px solid var(--border)' }}>
                    {n.image_url ? (
                      <img src={n.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}>📦</div>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                      <div style={{ fontWeight: 900, lineHeight: 1.2 }}>{n.title || 'Notification'}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{formatWhen(n.created_at)}</div>
                    </div>

                    <div style={{ marginTop: 6, color: 'var(--text)', opacity: 0.85, fontSize: 13 }}>{n.message}</div>

                    {(productTitle || productPrice) ? (
                      <div style={{ marginTop: 8, fontSize: 12, color: 'var(--muted)' }}>
                        {productTitle ? (
                          <span><strong style={{ color: 'var(--text)' }}>{productTitle}</strong></span>
                        ) : null}
                        {productPrice ? (
                          <span>{productTitle ? ' • ' : ''}KSh {productPrice}</span>
                        ) : null}
                      </div>
                    ) : null}

                    <div style={{ marginTop: 10, display: 'grid', gap: 6 }}>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                        <strong style={{ color: 'var(--text)' }}>{buyerName}</strong>
                        {buyerPhone ? ` • ${buyerPhone}` : ''}
                      </div>
                      {deliveryAt ? (
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                          Deliver on: <strong style={{ color: 'var(--text)' }}>{formatWhen(deliveryAt)}</strong>
                        </div>
                      ) : null}
                      {deliveryAddress ? (
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                          Address: <strong style={{ color: 'var(--text)' }}>{deliveryAddress}</strong>
                        </div>
                      ) : null}
                    </div>

                    <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {buyerPhone ? (
                        <a className="btn btnPrimary" href={`tel:${buyerPhone}`} style={{ padding: '8px 14px', borderRadius: 12 }}>
                          Call
                        </a>
                      ) : null}
                      {!n.is_read ? (
                        <button className="btn btnGhost" type="button" onClick={() => markRead(n.id)} style={{ padding: '8px 14px', borderRadius: 12 }}>
                          Mark as read
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
