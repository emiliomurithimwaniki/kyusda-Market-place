import { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard.jsx';
import ProductCardSkeleton from '../components/skeletons/ProductCardSkeleton.jsx';
import { api } from '../lib/api.js';

export default function NewArrivals() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Fetch products from the last 7 days
        const res = await api.getProducts({ days_ago: 7, page_size: 40 });
        if (!mounted) return;
        const payload = res?.data;
        const results = Array.isArray(payload?.results) ? payload.results : (payload || []);
        
        // Sorting is already handled by backend (-created_at), but we ensure it
        setProducts(results);
      } catch (err) {
        if (mounted) setError('Unable to load new arrivals.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div style={{ animation: 'fadeIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)', padding: '0 16px' }}>
      <div className="pageCard" style={{ padding: 18, marginBottom: 24, background: 'radial-gradient(900px 420px at 20% 0%, rgba(79, 70, 229, 0.12), transparent 55%), linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.72))', border: '1px solid rgba(79,70,229,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 32 }}>✨</div>
          <div>
            <h1 className="sectionTitle" style={{ margin: 0, fontSize: 24 }}>New Arrivals</h1>
            <p className="sectionHint" style={{ marginTop: 4 }}>Fresh items added in the last 7 days</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid">
          {Array.from({ length: 8 }).map((_, idx) => <ProductCardSkeleton key={idx} />)}
        </div>
      ) : error ? (
        <div className="pageCard" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📶</div>
          <div className="sectionTitle">Network Error</div>
          <div className="sectionHint">{error}</div>
        </div>
      ) : products.length > 0 ? (
        <div className="grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="pageCard" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
          <div className="sectionTitle">No new arrivals</div>
          <div className="sectionHint">Check back later for fresh items!</div>
        </div>
      )}
    </div>
  );
}
