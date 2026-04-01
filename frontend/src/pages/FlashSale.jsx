import { useEffect, useMemo, useState } from 'react';
import ProductCard from '../components/ProductCard.jsx';
import { api } from '../lib/api.js';

export default function FlashSale() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getProducts({ flash_sale: true, page: 1, page_size: 40 });
        const payload = res?.data;
        const results = Array.isArray(payload?.results) ? payload.results : (Array.isArray(payload) ? payload : []);
        if (mounted) setProducts(results);
      } catch {
        if (mounted) setError('Unable to load flash sale items. Please check your internet connection and try again.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const active = useMemo(() => (Array.isArray(products) ? products : []), [products]);

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 10000); // Check every 10s for filtering
    return () => clearInterval(interval);
  }, []);

  const filteredActive = useMemo(() => {
    return active.filter(p => {
      if (!p?.offer_end) return false;
      return new Date(p.offer_end).getTime() > now;
    });
  }, [active, now]);

  const sortedByEndingSoon = useMemo(() => {
    return [...filteredActive].sort((a, b) => {
      const ea = new Date(a.offer_end).getTime();
      const eb = new Date(b.offer_end).getTime();
      return ea - eb;
    });
  }, [filteredActive]);

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <div className="pageCard" style={{ padding: 18, marginTop: 0, marginBottom: 16, overflow: 'hidden', position: 'relative' }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 10% 10%, rgba(79,70,229,0.20), transparent 55%), radial-gradient(circle at 90% 0%, rgba(124,58,237,0.18), transparent 45%), linear-gradient(135deg, rgba(255,255,255,0.85), rgba(255,255,255,0.70))',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
          <div>
            <div className="sectionTitle" style={{ margin: 0 }}>Flash Sale</div>
            <div className="sectionHint">Limited-time deals (8am - midnight, 2-hour sessions)</div>
          </div>
          <div className="badge" style={{ background: 'rgba(239,68,68,0.10)', borderColor: 'rgba(239,68,68,0.25)', color: 'var(--danger)', fontWeight: 900 }}>
            Live
          </div>
        </div>
      </div>

      {loading ? null : error ? (
        <div className="pageCard" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📶</div>
          <div className="sectionTitle">Network Error</div>
          <div className="sectionHint">{error}</div>
        </div>
      ) : active.length === 0 ? (
        <div className="pageCard" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
          <div className="sectionTitle">No flash deals right now</div>
          <div className="sectionHint">Check back soon for the next session.</div>
        </div>
      ) : (
        <>
          <div className="sectionHeader" style={{ marginTop: 0 }}>
            <div>
              <div className="sectionTitle">Ending Soon</div>
              <div className="sectionHint">Deals that are about to expire</div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 12,
              overflowX: 'auto',
              paddingBottom: 6,
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {sortedByEndingSoon.slice(0, 12).map((p) => (
              <div key={p.id} style={{ minWidth: 230, scrollSnapAlign: 'start' }}>
                <ProductCard product={p} showOffer />
              </div>
            ))}
          </div>

          <div className="sectionHeader" style={{ marginTop: 20 }}>
            <div>
              <div className="sectionTitle">All Flash Deals</div>
              <div className="sectionHint">Browse everything currently on offer</div>
            </div>
          </div>

          <div className="grid">
            {filteredActive.map((p) => (
              <ProductCard key={p.id} product={p} showOffer />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
