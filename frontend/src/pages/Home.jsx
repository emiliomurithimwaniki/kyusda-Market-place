import { useEffect, useMemo, useState } from 'react';
import ProductCard from '../components/ProductCard.jsx';
import { api } from '../lib/api.js';

export default function Home({ query, category, setCategory }) {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [prefetchCache, setPrefetchCache] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [catsRes, productsRes] = await Promise.all([
          api.getCategories(),
          api.getProducts({ featured: true, page: 1, page_size: 12 }),
        ]);
        if (!mounted) return;
        setCategories(catsRes?.data || []);

        const payload = productsRes?.data;
        const results = Array.isArray(payload?.results) ? payload.results : (payload || []);
        setProducts(results);
        setPage(1);
        setHasMore(Boolean(payload?.next));

        if (payload?.next) {
          try {
            const nextRes = await api.getProducts({ featured: true, page: 2, page_size: 12 });
            if (!mounted) return;
            const nextPayload = nextRes?.data;
            const nextResults = Array.isArray(nextPayload?.results) ? nextPayload.results : null;
            if (nextResults) setPrefetchCache({ page: 2, results: nextResults, hasMore: Boolean(nextPayload?.next) });
          } catch {
            if (mounted) setPrefetchCache(null);
          }
        } else {
          setPrefetchCache(null);
        }
      } catch {
        if (mounted) {
          setError('Unable to load data. Please check your internet connection and try again.');
          setCategories([]);
          setProducts([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  async function loadMore() {
    if (loadingMore || loading || !hasMore) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    setError(null);
    try {
      if (prefetchCache?.page === nextPage && Array.isArray(prefetchCache?.results)) {
        setProducts((prev) => [...prev, ...prefetchCache.results]);
        setPage(nextPage);
        setHasMore(Boolean(prefetchCache.hasMore));
        setPrefetchCache(null);
        return;
      }

      const res = await api.getProducts({ featured: true, page: nextPage, page_size: 12 });
      const payload = res?.data;
      const results = Array.isArray(payload?.results) ? payload.results : (payload || []);
      setProducts((prev) => [...prev, ...results]);
      setPage(nextPage);
      setHasMore(Boolean(payload?.next));
    } catch {
      setError('Unable to load more items. Please check your internet connection and try again.');
    } finally {
      setLoadingMore(false);
    }
  }

  const filteredProducts = useMemo(() => {
    const q = (query || '').toLowerCase();
    return (products || []).filter((p) => {
      if (category && category !== 'All' && p.category !== category) return false;
      if (q && !(p?.title || '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, query, category]);

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      {/* Hero Section */}
      <div className="heroRow">
        <div className="heroCard">
          <div className="heroTitle">Big Sale!</div>
          <div className="heroText">
            Get up to 40% OFF on campus electronics and student essentials. Limited time only!
          </div>
          <button className="btn btnPrimary" style={{ marginTop: 16 }}>Shop Now</button>
          <div className="heroArt"></div>
        </div>
        <div className="promoStack">
          <div className="promoCard">
            <div>
              <div className="promoTitle">Flash Deals</div>
              <div className="promoHint">Ends in 02:45:12</div>
            </div>
            <div className="badge">Hot</div>
          </div>
          <div className="promoCard" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: 'white' }}>
            <div>
              <div className="promoTitle" style={{ color: 'white' }}>New Arrivals</div>
              <div className="promoHint" style={{ color: 'rgba(255,255,255,0.8)' }}>Just listed today</div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="sectionHeader" style={{ marginTop: 24 }}>
        <div className="sectionTitle">Shop by Category</div>
        <div className="sectionHint">Explore our collections</div>
      </div>
      <div className="categoryGrid">
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`catTile ${category === cat.name ? 'pillActive' : ''}`}
            onClick={() => setCategory(cat.name)}
          >
            <div className="catIcon" style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', fontSize: 20 }}></div>
            <div style={{ fontWeight: 600 }}>{cat.name}</div>
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="sectionHeader" style={{ marginTop: 32 }}>
        <div className="sectionTitle">Featured Products</div>
        <div className="sectionHint">Handpicked for you</div>
      </div>
      <div className="grid">
        {loading ? null : error ? (
          <div className="pageCard" style={{ textAlign: 'center', padding: '60px 20px', gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📶</div>
            <div className="sectionTitle">Network Error</div>
            <div className="sectionHint">{error}</div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="pageCard" style={{ textAlign: 'center', padding: '60px 20px', gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🗂️</div>
            <div className="sectionTitle">No information</div>
            <div className="sectionHint">There are no products to show on this page.</div>
          </div>
        ) : (
          filteredProducts.map((p) => <ProductCard key={p.id} product={p} />)
        )}
      </div>

      {!loading && !error && hasMore ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
          <button className="btn btnPrimary" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      ) : null}

      <div className="sectionHeader" style={{ marginTop: 32 }}>
        <div className="sectionTitle">Recently Viewed</div>
        <div className="sectionHint">Pick up where you left off</div>
      </div>
      <div className="grid">
        {null}
      </div>
    </div>
  );
}
