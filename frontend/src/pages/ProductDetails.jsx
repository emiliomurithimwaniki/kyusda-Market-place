import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { formatKES } from '../lib/format.js';
import ProductCard from '../components/ProductCard.jsx';
import { api } from '../lib/api.js';

export default function ProductDetails() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('description');

  const [product, setProduct] = useState(null);
  const [sellerProducts, setSellerProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      setProduct(null);
      setSellerProducts([]);
      try {
        const productRes = await api.getProduct(id);
        const p = productRes?.data;
        if (mounted) setProduct(p || null);

        const sellerId = p?.sellerId;
        if (sellerId) {
          const [, sellerProductsRes] = await Promise.all([
            api.getSeller(sellerId),
            api.getProducts({ sellerId }),
          ]);
          if (mounted) setSellerProducts(sellerProductsRes?.data || []);
        }
      } catch {
        if (mounted) setError('Unable to load data. Please check your internet connection and try again.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [id]);

  const otherItems = useMemo(() => {
    return (sellerProducts || []).filter((p) => String(p?.id) !== String(id));
  }, [sellerProducts, id]);

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      {loading ? null : error ? (
        <div className="pageCard" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📶</div>
          <div className="sectionTitle">Network Error</div>
          <div className="sectionHint">{error}</div>
        </div>
      ) : !product ? (
        <div className="pageCard" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🗂️</div>
          <div className="sectionTitle">No information</div>
          <div className="sectionHint">There is no product information to show on this page.</div>
        </div>
      ) : (
        <div>
          <div className="sectionHeader" style={{ marginTop: 0 }}>
            <div>
              <div className="sectionTitle">{product.title}</div>
              <div className="sectionHint">{product.category}</div>
            </div>
          </div>

          <div className="pageCard" style={{ padding: 24 }}>
            <div className="productPrice" style={{ fontSize: 28, fontWeight: 900, color: 'var(--primary)' }}>{formatKES(product.price)}</div>
            <div style={{ marginTop: 12, color: 'var(--muted)', fontSize: 13 }}>{product.location || ''}</div>

            <div style={{ marginTop: 20 }}>
              <div className="pillRow" style={{ borderBottom: '1px solid var(--border)', borderRadius: 0, padding: 0, gap: 24 }}>
                <button
                  className={`tabBtn ${activeTab === 'description' ? 'active' : ''}`}
                  onClick={() => setActiveTab('description')}
                  style={{ background: 'none', border: 'none', padding: '12px 0', fontWeight: 700, color: activeTab === 'description' ? 'var(--primary)' : 'var(--muted)', borderBottom: activeTab === 'description' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer' }}
                >
                  Description
                </button>
                <button
                  className={`tabBtn ${activeTab === 'reviews' ? 'active' : ''}`}
                  onClick={() => setActiveTab('reviews')}
                  style={{ background: 'none', border: 'none', padding: '12px 0', fontWeight: 700, color: activeTab === 'reviews' ? 'var(--primary)' : 'var(--muted)', borderBottom: activeTab === 'reviews' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer' }}
                >
                  Reviews
                </button>
              </div>

              <div style={{ marginTop: 20 }}>
                {activeTab === 'description' ? (
                  <p style={{ lineHeight: 1.6, color: 'var(--text)', opacity: 0.85 }}>{product.description}</p>
                ) : (
                  <div style={{ textAlign: 'center', padding: '30px 20px' }}>
                    <div className="sectionTitle">No information</div>
                    <div className="sectionHint">There are no reviews to show on this page.</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pageCard" style={{ padding: 20, marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 900 }}>{product.seller}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Seller</div>
              </div>
              <Link to={`/profile/${product.sellerId}`} className="btn btnPrimary" style={{ fontSize: 12, padding: '8px 16px' }}>Visit Store</Link>
            </div>
          </div>

          <div style={{ marginTop: 32 }}>
            <div className="sectionHeader">
              <div>
                <div className="sectionTitle">More from {product.seller}</div>
                <div className="sectionHint">Other listings</div>
              </div>
            </div>

            <div className="grid">
              {otherItems.length === 0 ? (
                <div className="pageCard" style={{ textAlign: 'center', padding: '30px 20px', gridColumn: '1 / -1' }}>
                  <div className="sectionTitle">No information</div>
                  <div className="sectionHint">There are no other products to show on this page.</div>
                </div>
              ) : (
                otherItems.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
