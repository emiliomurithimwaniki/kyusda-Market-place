import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard.jsx';
import { api } from '../lib/api.js';

export default function SellerProfile() {
  const { id } = useParams();

  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      setSeller(null);
      setProducts([]);
      try {
        const [sellerRes, productsRes] = await Promise.all([
          api.getSeller(id),
          api.getProducts({ sellerId: id }),
        ]);
        if (mounted) {
          setSeller(sellerRes?.data || null);
          setProducts(productsRes?.data || []);
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

  const featuredProducts = useMemo(() => {
    return (products || []).filter((p) => p?.featured);
  }, [products]);

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      {loading ? null : error ? (
        <div className="pageCard" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📶</div>
          <div className="sectionTitle">Network Error</div>
          <div className="sectionHint">{error}</div>
        </div>
      ) : !seller ? (
        <div className="pageCard" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🗂️</div>
          <div className="sectionTitle">No information</div>
          <div className="sectionHint">There is no seller information to show on this page.</div>
        </div>
      ) : (
        <div>
          {/* Profile Header / Banner */}
          <div className="pageCard" style={{ padding: 0, overflow: 'hidden', marginBottom: 32 }}>
            <div style={{ height: 160, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', position: 'relative' }}></div>
            <div style={{ padding: '0 32px 32px', marginTop: -40, position: 'relative' }}>
              <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ 
                  width: 100, 
                  height: 100, 
                  borderRadius: 28, 
                  background: 'linear-gradient(135deg, var(--primary), var(--primary-2))', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: 48, 
                  color: 'white',
                  border: '6px solid white',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                }}>
                  👤
                </div>
                <div style={{ flex: 1, minWidth: 200, paddingBottom: 10 }}>
                  <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.8px', margin: '0 0 4px' }}>{seller.name}</h1>
                </div>
                <div style={{ display: 'flex', gap: 12, paddingBottom: 10 }}>
                  <button className="btn btnPrimary" style={{ padding: '12px 24px' }}>Follow Store</button>
                  <Link to="/messages" className="btn btnGhost" style={{ padding: '12px 24px', border: '1px solid var(--border)' }}>
                    Contact
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="profileLayout">
            {/* Left: Seller Stats & Info */}
            <div className="stickySidebar">
              <div className="pageCard" style={{ padding: 24 }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800 }}>About the Store</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ padding: 16, borderRadius: 16, background: 'rgba(0,0,0,0.02)', textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--primary)' }}>{products.length}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Products</div>
                  </div>
                  <div style={{ padding: 16, borderRadius: 16, background: 'rgba(0,0,0,0.02)', textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--primary)' }}>{featuredProducts.length}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Featured</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Seller Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              <div>
                <div className="sectionHeader" style={{ marginTop: 0 }}>
                  <div>
                    <div className="sectionTitle">Store Listings</div>
                    <div className="sectionHint">Showing {products.length} items available in store</div>
                  </div>
                </div>

                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
                  {products.length === 0 ? (
                    <div className="pageCard" style={{ textAlign: 'center', padding: '30px 20px', gridColumn: '1 / -1' }}>
                      <div className="sectionTitle">No information</div>
                      <div className="sectionHint">There are no products to show on this page.</div>
                    </div>
                  ) : (
                    products.map((p) => <ProductCard key={p.id} product={p} />)
                  )}
                </div>
              </div>

              <div className="fullWidthSection">
                <div className="sectionHeader">
                  <div>
                    <div className="sectionTitle">All Featured Items</div>
                    <div className="sectionHint">Curated products from {seller.name}</div>
                  </div>
                </div>
                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
                  {featuredProducts.length === 0 ? (
                    <div className="pageCard" style={{ textAlign: 'center', padding: '30px 20px', gridColumn: '1 / -1' }}>
                      <div className="sectionTitle">No information</div>
                      <div className="sectionHint">There are no featured products to show on this page.</div>
                    </div>
                  ) : (
                    featuredProducts.map((p) => <ProductCard key={p.id} product={p} />)
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
