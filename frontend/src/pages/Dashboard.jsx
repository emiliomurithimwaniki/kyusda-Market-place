import { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard.jsx';
import { api } from '../lib/api.js';

export default function Dashboard() {
  const [tab, setTab] = useState('products');
  const [me, setMe] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        if (alive) setProducts(productsRes?.data || []);
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
                <div className="price">-</div>
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
            <button type="button" className={`pill ${tab === 'orders' ? 'pillActive' : ''}`} onClick={() => setTab('orders')}>Orders</button>
            <button type="button" className={`pill ${tab === 'messages' ? 'pillActive' : ''}`} onClick={() => setTab('messages')}>Messages</button>
          </div>

          <div className="pageCard">
            {tab === 'products' && (
              <div>
                <div className="sectionTitle" style={{ marginBottom: 8 }}>My Products</div>
                <div style={{ color: 'var(--muted)', fontSize: 13 }}>You have {products.length} active listings.</div>

                <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                  {products.length === 0 ? (
                    <div className="pageCard" style={{ textAlign: 'center', padding: '60px 20px', gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: 48, marginBottom: 16 }}>🗂️</div>
                      <div className="sectionTitle">No information</div>
                      <div className="sectionHint">There are no products to show on this page.</div>
                    </div>
                  ) : products.map((p) => (
                    <div key={p.id} style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}>
                        <button 
                          type="button" 
                          className="btn btnGhost" 
                          style={{ padding: '8px 12px', border: '1px solid var(--border)', minWidth: 80 }} 
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
                <div className="sectionTitle" style={{ marginBottom: 8 }}>Orders</div>
                <div style={{ color: 'var(--muted)', fontSize: 13 }}>No information</div>
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
